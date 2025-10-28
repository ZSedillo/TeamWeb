
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './UpdateAppointment.css';
import { Calendar, Clock, AlertCircle, User, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
// import {
//   fetchBookingAvailability,
//   fetchBookings,
//   saveBookingAvailability,
// } from '../../_actions/bookingActions';
// import { addActivityReport } from '../../_actions/reportActions';

const UpdateAppointment = (props) => {
  const dispatch = useDispatch();
  
  // Redux state
  const { 
    availability: availabilityData = [], 
    bookings: bookingsData = [],
    loading: isLoading = false,
    error 
  } = useSelector(state => state.booking || {});

  // Local state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState({});
  const [appointmentForm, setAppointmentForm] = useState({
    timeSlots: [],
  });
  const [slotMaxes, setSlotMaxes] = useState({});
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [viewMode, setViewMode] = useState('availability');

  // Generate time slots from 9 AM to 4 PM in 1-hour intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 16; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(timeString);
    }
    return slots;
  };

  const availableTimeSlots = generateTimeSlots();

  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    const localDate = new Date(date);
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get the next 7 days starting from the current date
  const getNextSevenDays = () => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Load appointment data on mount
  useEffect(() => {
    dispatch(fetchBookingAvailability());
    
    const weekDays = getNextSevenDays();
    const startStr = weekDays[0].toISOString().split('T')[0];
    const endStr = weekDays[6].toISOString().split('T')[0];
    dispatch(fetchBookings(startStr, endStr));
  }, [dispatch]);

  // Update appointments when availability data changes
  useEffect(() => {
    if (availabilityData && availabilityData.length > 0) {
      const formattedAppointments = {};
      const weekDays = getNextSevenDays();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      availabilityData.forEach(item => {
        weekDays.forEach(date => {
          const dayName = days[date.getDay()];
          const dateStr = formatDate(date);
          
          if (item.availability && item.availability[dayName] && item.availability[dayName].length > 0) {
            if (!formattedAppointments[dateStr]) {
              formattedAppointments[dateStr] = [];
            }
            
            formattedAppointments[dateStr].push({
              id: item._id,
              timeSlots: item.availability[dayName] || [],
            });
          }
        });
      });
      
      setAppointments(formattedAppointments);
    }
  }, [availabilityData]);

  // Handle click on a calendar day
  const handleDayClick = (day) => {
    setSelectedDate(day);
    setEditingAppointmentId(null);
    
    if (viewMode === 'availability') {
      setAppointmentForm({
        timeSlots: [''],
      });
    }
    
    setIsFormVisible(false);
    
    if (viewMode === 'bookings') {
      const weekDays = getNextSevenDays();
      const startStr = weekDays[0].toISOString().split('T')[0];
      const endStr = weekDays[6].toISOString().split('T')[0];
      dispatch(fetchBookings(startStr, endStr));
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'maxAppointments') {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) return;
      
      setAppointmentForm({
        ...appointmentForm,
        [name]: Math.min(Math.max(1, numValue), 20)
      });
    } else {
      setAppointmentForm({
        ...appointmentForm,
        [name]: value
      });
    }
  };

  // Save appointment
  const saveAppointment = async () => {
    if (!appointmentForm.timeSlots || appointmentForm.timeSlots.length === 0) {
      toast.error('Please add at least one time slot');
      return;
    }

    try {
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      const username = localStorage.getItem('username') || 'Admin';

      // Build slots as objects with max
      const slotsWithMax = appointmentForm.timeSlots.map(slot => ({
        time: slot,
        max: slotMaxes[slot] || 3
      }));

      // Create the update for just this specific day
      const dayUpdate = {
        [dayOfWeek]: slotsWithMax
      };

      // Build limits object nested by day of week
      const limitsByDay = { [dayOfWeek]: {} };
      appointmentForm.timeSlots.forEach(slot => {
        const slotTime = typeof slot === 'object' && slot.time ? slot.time : slot;
        const slotMax = typeof slot === 'object' && slot.max ? slot.max : (slotMaxes[slotTime] || 3);
        limitsByDay[dayOfWeek][slotTime] = slotMax;
      });

      let availabilityPayload;

      if (editingAppointmentId) {
        // Editing existing availability
        const existingEntry = availabilityData.find(item => item._id === editingAppointmentId);
        
        if (!existingEntry) {
          throw new Error('Could not find the availability entry to edit');
        }

        const mergedAvailability = {
          ...existingEntry.availability,
          ...dayUpdate
        };

        availabilityPayload = {
          url: `/booking/editBookingAvailability/${editingAppointmentId}`,
          method: 'PUT',
          data: { availability: mergedAvailability, limits: limitsByDay }
        };
      } else {
        // Adding new availability
        if (availabilityData && availabilityData.length > 0) {
          const existingEntry = availabilityData[0];

          const mergedAvailability = {
            ...existingEntry.availability,
            ...dayUpdate
          };

          availabilityPayload = {
            url: `/booking/editBookingAvailability/${existingEntry._id}`,
            method: 'PUT',
            data: { availability: mergedAvailability, limits: limitsByDay }
          };
        } else {
          availabilityPayload = {
            url: '/booking/addBookingAvailability',
            method: 'POST',
            data: { availability: dayUpdate, limits: limitsByDay }
          };
        }
      }

      await dispatch(saveBookingAvailability(availabilityPayload));

      // Log activity using action
      // dispatch(addActivityReport(
      //   username,
      //   `[Manage Pre-Registration:Appointments] ${editingAppointmentId ? 'Updated' : 'Added'} availability for ${dayOfWeek}`
      // ));

      setIsFormVisible(false);
      setEditingAppointmentId(null);

      toast.success(editingAppointmentId ? 'Appointment updated successfully' : 'Appointment added successfully');
    } catch (err) {
      toast.error('Failed to save appointment: ' + err.message);
      console.error(err);
    }
  };

  // Edit appointment
  const editAppointment = (appointment) => {
    setAppointmentForm({
      timeSlots: appointment.timeSlots.map(s => s.time || s) || [],
    });
    setSlotMaxes(
      (appointment.timeSlots || []).reduce((acc, s) => {
        if (typeof s === 'object') acc[s.time] = s.max;
        return acc;
      }, {})
    );
    setEditingAppointmentId(appointment.id);
    setIsFormVisible(true);
  };

  // Delete appointment for a specific day
  const deleteAppointment = async (appointmentId) => {
    try {
      const username = localStorage.getItem('username') || 'Admin';
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

      const existingEntry = availabilityData.find(item => item._id === appointmentId);

      if (!existingEntry) {
        throw new Error('Could not find the availability entry to delete');
      }

      const updatedAvailability = { ...existingEntry.availability };
      delete updatedAvailability[dayOfWeek];

      const availabilityPayload = {
        url: `/booking/editBookingAvailability/${appointmentId}`,
        method: 'PUT',
        data: { availability: updatedAvailability }
      };

      await dispatch(saveBookingAvailability(availabilityPayload));

      // Log activity using action
      // dispatch(addActivityReport(
      //   username,
      //   `[Manage Pre-Registration:Appointments] Deleted availability for ${dayOfWeek}`
      // ));

      toast.success(`Availability for ${dayOfWeek} deleted successfully`);
    } catch (err) {
      toast.error('Failed to delete appointment: ' + err.message);
      console.error(err);
    }
  };

  // Add time slot
  const addTimeSlot = () => {
    const newTimeSlots = [...appointmentForm.timeSlots, ''];
    setAppointmentForm({
      ...appointmentForm,
      timeSlots: newTimeSlots
    });
  };
  
  // Remove time slot
  const removeTimeSlot = (index) => {
    const newTimeSlots = [...appointmentForm.timeSlots];
    newTimeSlots.splice(index, 1);
    setAppointmentForm({
      ...appointmentForm,
      timeSlots: newTimeSlots
    });
  };
  
  // Update time slot
  const updateTimeSlot = (index, value) => {
    if (value && appointmentForm.timeSlots.findIndex((slot, i) => slot === value && i !== index) !== -1) {
      toast.error('This time slot is already selected. Please choose a different time.');
      return;
    }
    
    const newTimeSlots = [...appointmentForm.timeSlots];
    newTimeSlots[index] = value;
    setAppointmentForm({
      ...appointmentForm,
      timeSlots: newTimeSlots
    });
  };

  // Get available time slots that haven't been selected yet
  const getAvailableTimeSlots = (currentIndex) => {
    const selectedSlots = appointmentForm.timeSlots
      .filter((slot, i) => slot && i !== currentIndex);
    
    return availableTimeSlots.filter(slot => !selectedSlots.includes(slot));
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date) => {
    const targetDate = new Date(date);
    
    const matchingBookings = bookingsData.filter(booking => {
      const bookingDate = new Date(booking.date || booking.appointment_date);
      
      const sameYear = bookingDate.getUTCFullYear() === targetDate.getUTCFullYear();
      const sameMonth = bookingDate.getUTCMonth() === targetDate.getUTCMonth();
      const sameDay = bookingDate.getUTCDate() === targetDate.getUTCDate();
      
      return sameYear && sameMonth && sameDay;
    });
    
    return matchingBookings;
  };
  
  // Get bookings organized by time slot
  const getBookingsByTimeSlot = (date) => {
    const bookings = getBookingsForDate(date);
    const dateStr = formatDate(date);
    
    let slotsFromAvailability = [];
    if (appointments[dateStr] && appointments[dateStr][0] && appointments[dateStr][0].timeSlots) {
      slotsFromAvailability = appointments[dateStr][0].timeSlots.map(slot =>
        typeof slot === 'object' && slot.time ? slot.time : slot
      );
    }
    
    const slotsFromBookings = Array.from(new Set(bookings.map(b => b.timeSlot || b.preferred_time?.time || b.preferred_time)));
    
    const allSlots = slotsFromAvailability.length > 0
      ? Array.from(new Set([...slotsFromAvailability, ...slotsFromBookings])).sort()
      : slotsFromBookings.sort();
    
    const slotMap = {};
    allSlots.forEach(slot => {
      slotMap[slot] = [];
    });
    
    bookings.forEach(booking => {
      const timeSlot = booking.timeSlot || booking.preferred_time?.time || booking.preferred_time;
      if (!slotMap[timeSlot]) {
        slotMap[timeSlot] = [];
      }
      slotMap[timeSlot].push({
        ...booking,
        studentName: booking.studentName || `${booking.lastName}, ${booking.firstName}`,
        studentEmail: booking.studentEmail || booking.email,
        studentPhone: booking.studentPhone || booking.phone_number,
        purpose: booking.purpose || booking.purpose_of_visit || 'Registration',
        status: booking.status === 'approved' ? 'confirmed' : 'pending'
      });
    });
    
    return Object.entries(slotMap)
      .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
      .map(([time, bookings]) => ({ time, bookings }));
  };

  // Render week days
  const renderWeekDays = () => {
    const days = getNextSevenDays();
    
    return days.map((day, index) => {
      const dayNumber = day.getDate();
      const isToday = formatDate(day) === formatDate(new Date());
      const dateStr = formatDate(day);
      const isSelected = selectedDate && formatDate(day) === formatDate(selectedDate);
      const hasAppointments = appointments[dateStr] && appointments[dateStr].length > 0;
      const bookings = getBookingsForDate(day);
      
      return (
        <div 
          key={index}
          className={`calendar-day 
            ${isToday ? 'today' : ''}
            ${isSelected ? 'selected' : ''}
            ${viewMode === 'availability' && hasAppointments ? 'has-appointments' : ''}
            ${viewMode === 'bookings' && bookings.length > 0 ? 'has-bookings' : ''}`}
          onClick={() => handleDayClick(day)}
        >
          <div className="weekday-name">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()]}
          </div>
          <span className="day-number">{dayNumber}</span>
          {viewMode === 'availability' && hasAppointments && (
            <span className="appointment-count">
              {appointments[dateStr].reduce((sum, appt) => sum + (appt.timeSlots?.length || 0), 0)}
            </span>
          )}
          {viewMode === 'bookings' && bookings.length > 0 && (
            <span className="booking-count">{bookings.length}</span>
          )}
        </div>
      );
    });
  };

  // Render bookings for selected date
  const renderBookings = () => {
    const bookingsBySlot = getBookingsByTimeSlot(selectedDate);
    if (bookingsBySlot.length === 0) {
      return <div className="no-bookings">No bookings for this date.</div>;
    }
    return (
      <div className="bookings-by-slot">
        {bookingsBySlot.map(({ time, bookings }, index) => (
          <div key={index} className="time-slot-bookings">
            <h4 className="time-slot-header">
              <Clock size={16} />
              {time}
              <span className="booking-count">{bookings.length} booking(s)</span>
            </h4>
            <div className="bookings-list">
              {bookings.length === 0 ? (
                <div className="no-bookings">No bookings for this slot.</div>
              ) : (
                bookings.map(booking => (
                  <div key={booking._id} className={`booking-item ${booking.status}`}>
                    <div className="booking-student-info">
                      <div className="booking-student-name">
                        <User size={16} />
                        {booking.studentName}
                      </div>
                      <div className="booking-contact">
                        <div className="booking-email">{booking.studentEmail}</div>
                        <div className="booking-phone">{booking.studentPhone}</div>
                      </div>
                      <div className="booking-purpose">Purpose: {booking.purpose}</div>
                    </div>
                    <div className="booking-actions">
                      <div className="booking-status-badge">
                        {booking.status}
                      </div>
                      <button 
                        className="btn-view-details"
                        onClick={() => props.onViewStudentDetails?.(booking._id)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render calendar header
  const renderCalendarHeader = () => {
    const days = getNextSevenDays();
    const startDate = days[0];
    const endDate = days[6];
    const options = { month: 'short', day: 'numeric' };
    
    return (
      <div className="calendar-header">
        <h2>
          Current Week: {startDate.toLocaleDateString('default', options)} - {endDate.toLocaleDateString('default', options)}
        </h2>
      </div>
    );
  };

  return (
    <div className="appointment-calendar">
      <div className="section-header">
        <h2>Manage Appointment System</h2>
        <p>Configure and view appointments for student pre-registration</p>
      </div>
      
      <div className="view-mode-tabs">
        <button 
          className={`view-tab ${viewMode === 'availability' ? 'active' : ''}`}
          onClick={() => setViewMode('availability')}
        >
          <Calendar size={18} />
          Availability Settings
        </button>
        <button 
          className={`view-tab ${viewMode === 'bookings' ? 'active' : ''}`}
          onClick={() => setViewMode('bookings')}
        >
          <Users size={18} />
          Booked Appointments
        </button>
      </div>
      
      {renderCalendarHeader()}
      
      <div className="calendar-days">
        {renderWeekDays()}
      </div>
      
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading appointment data...</p>
        </div>
      )}
      
      {error && (
        <div className="error-state">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}
      
      {selectedDate && !isLoading && !error && viewMode === 'availability' && (
        <div className="appointment-section">
          <h3>
            <Calendar size={20} />
            Appointment Slots for {selectedDate.toLocaleDateString('default', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </h3>
          
          {appointments[formatDate(selectedDate)]?.length > 0 ? (
            <div className="appointment-list">
              {appointments[formatDate(selectedDate)].map(appointment => (
                <div key={appointment.id} className="appointment-item">
                  <div className="appointment-info">
                    <div className="appointment-slots">
                      <strong>Available Time Slots:</strong>
                      <div className="time-slots-container">
                        {appointment.timeSlots?.length > 0 ? (
                          appointment.timeSlots.map((slot, index) => {
                            if (!slot) return null;
                            const slotTime = typeof slot === 'object' && slot.time ? slot.time : (typeof slot === 'string' ? slot : null);
                            if (!slotTime) return null;
                            const slotMax = typeof slot === 'object' && slot.max ? slot.max : 3;
                            const filled = typeof slot === 'object' && typeof slot.filled === 'number'
                              ? slot.filled
                              : getBookingsForDate(selectedDate).filter(b => (b.timeSlot || b.preferred_time?.time || b.preferred_time) === slotTime).length;
                            const hour = parseInt(slotTime.split(':')[0]);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour > 12 ? hour - 12 : hour;
                            return (
                              <div key={index} className={`time-slot${filled >= slotMax ? ' full' : ''}`}>
                                <Clock size={14} />
                                <span>{`${displayHour}:00 ${ampm}`}</span>
                                <span style={{ marginLeft: 8 }}>{filled} / {slotMax} filled</span>
                              </div>
                            );
                          })
                        ) : (
                          <span className="no-slots">No time slots defined</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="appointment-actions">
                    <button onClick={() => editAppointment(appointment)}>Edit</button>
                    <button onClick={() => deleteAppointment(appointment.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-appointments">
              <p>No appointment slots configured for this date.</p>
              <p>Click the button below to add availability.</p>
              <button 
                className="add-appointment-button"
                onClick={() => {
                  setIsFormVisible(!isFormVisible);
                  setEditingAppointmentId(null);
                  if (!isFormVisible) {
                    setAppointmentForm({
                      timeSlots: [''],
                      purpose: 'Student Registration',
                    });
                  }
                }}
                disabled={isLoading}
              >
                {isFormVisible ? 'Cancel' : 'Add Availability'}
              </button>
            </div>
          )}
          
          {isFormVisible && (
            <div className="appointment-form">
              <h4>
                {editingAppointmentId ? 'Edit Appointment Availability' : 'New Appointment Availability'}
              </h4>
              
              <div className="form-group">
                <label>Purpose:</label>
                <input 
                  type="text" 
                  name="purpose" 
                  value={appointmentForm.purpose}
                  onChange={handleInputChange}
                  placeholder="e.g., Student Registration, Document Submission"
                />
              </div>
              
              <div className="form-group">
                <label>Time Slots:</label>
                {appointmentForm.timeSlots.map((timeSlot, index) => {
                  const availableOptions = timeSlot 
                    ? [...getAvailableTimeSlots(index), timeSlot] 
                    : getAvailableTimeSlots(index);
                  
                  return (
                    <div key={index} className="time-slot-input">
                      <select
                        value={timeSlot}
                        onChange={(e) => updateTimeSlot(index, e.target.value)}
                        required
                        className="time-slot-select"
                      >
                        <option value="">Select a time</option>
                        {availableOptions.sort().map((slot, optIdx) => {
                          if (!slot) return null;
                          const slotValue = typeof slot === 'object' && slot.time ? slot.time : (typeof slot === 'string' ? slot : null);
                          if (!slotValue) return null;
                          const hour = parseInt(slotValue.split(':')[0]);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour > 12 ? hour - 12 : hour;
                          return (
                            <option key={`${slotValue}-${index}-${optIdx}`} value={slotValue}>
                              {`${displayHour}:00 ${ampm}`}
                            </option>
                          );
                        })}
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={slotMaxes[timeSlot] || 3}
                        onChange={e => {
                          setSlotMaxes({ ...slotMaxes, [timeSlot]: parseInt(e.target.value, 10) });
                        }}
                        className="slot-max-input"
                        style={{ width: 50, marginLeft: 8 }}
                        title="Max bookings for this slot"
                      />
                      <span style={{ marginLeft: 4 }}>max</span>
                      <button 
                        type="button" 
                        className="remove-slot-button"
                        onClick={() => removeTimeSlot(index)}
                        disabled={appointmentForm.timeSlots.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
                <button 
                  type="button" 
                  className="add-slot-button"
                  onClick={addTimeSlot}
                  disabled={appointmentForm.timeSlots.filter(slot => slot !== '').length >= availableTimeSlots.length}
                >
                  + Add Time Slot
                </button>
              </div>              
              <button 
                onClick={saveAppointment}
                disabled={isLoading}
                className="save-button"
              >
                {isLoading ? 'Saving...' : 'Save Availability'}
              </button>
            </div>
          )}
        </div>
      )}
      
      {selectedDate && !isLoading && !error && viewMode === 'bookings' && (
        <div className="bookings-section">
          <div className="bookings-header">
            <h3>
              <Users size={20} />
              Bookings for {selectedDate.toLocaleDateString('default', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </h3>
          </div>
          
          {renderBookings()}
        </div>
      )}
    </div>
  );
};

UpdateAppointment.propTypes = {
  studentData: PropTypes.array,
  onViewStudentDetails: PropTypes.func,
};

UpdateAppointment.defaultProps = {
  studentData: [],
  onViewStudentDetails: null,
};

export default UpdateAppointment;