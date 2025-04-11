import React, { useState, useEffect } from 'react';
import './UpdateAppointment.css';
import { Calendar, Clock, AlertCircle, User, Users, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';

const UpdateAppointment = (props) => {
  // Initial state for calendar - always use the current date
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState({});
  const [appointmentForm, setAppointmentForm] = useState({
    timeSlots: [],
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [availabilityData, setAvailabilityData] = useState([]);
  const [bookingsData, setBookingsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('availability');
   const [username, setUsername] = useState("");

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
    // Create a new date object to avoid modifying the original
    const localDate = new Date(date);
    
    // Get the UTC components to avoid timezone issues
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    
    // Return consistent YYYY-MM-DD format
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

  // Load appointment data
  useEffect(() => {
    const loggedInUser = localStorage.getItem('username');
    if (loggedInUser) {
        setUsername(loggedInUser);
    } else {
        setUsername("Admin");
    }
    fetchAvailabilityData();
    fetchBookingsData();
  }, [props.studentData]);

// Modify the fetchAvailabilityData function to auto-populate all days with default availability
// Modify the fetchAvailabilityData function to respect deleted dates
const fetchAvailabilityData = async () => {
  try {
    setIsLoading(true);
    const response = await fetch('https://teamweb-kera.onrender.com/booking/bookingAvailability');
    
    if (!response.ok) {
      throw new Error('Failed to fetch availability data');
    }
    
    const data = await response.json();
    setAvailabilityData(data);
    
    // Create a formatted appointments object
    const formattedAppointments = {};
    
    // Get the next 7 days
    const weekDays = getNextSevenDays();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Get list of recently deleted dates to avoid recreating them
    const recentlyDeletedDates = JSON.parse(localStorage.getItem('deletedAvailabilityDates') || '[]');
    
    // First, populate with any existing availability data from the API
    if (data && data.length > 0) {
      data.forEach(item => {
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
    }
    
    // Now, auto-populate any days that don't have availability with default slots
    // EXCEPT for days that have been explicitly deleted
    weekDays.forEach(date => {
      const dateStr = formatDate(date);
      
      // Skip auto-population if this date was recently deleted
      if (recentlyDeletedDates.includes(dateStr)) {
        console.log(`Skipping auto-population for deleted date: ${dateStr}`);
        return; // Skip this date
      }
      
      // If this date doesn't have any appointments yet, add default ones
      if (!formattedAppointments[dateStr] || formattedAppointments[dateStr].length === 0) {
        // Check if we have an existing availability entry to use
        let availabilityId = null;
        if (data && data.length > 0) {
          availabilityId = data[0]._id;
        }
        
        formattedAppointments[dateStr] = [{
          id: availabilityId, // This might be null if no availability exists yet
          timeSlots: generateTimeSlots(), // This gives us 9AM to 4PM
        }];
      }
    });
    
    // Update the appointments state with our complete set
    setAppointments(formattedAppointments);
    
    // If no availability exists yet in the database but we want to show defaults,
    // we might need to create an initial entry
    if (data.length === 0) {
      // This would be a good place to create default availability in the database
      // for all days of the week if you want persistence
      createDefaultAvailability();
    }
    
  } catch (err) {
    setError('Failed to fetch appointment data: ' + err.message);
    console.error(err);
  } finally {
    setIsLoading(false);
  }
};

// Add this new function to create default availability if none exists
// Fix the createDefaultAvailability function to respect deleted days
const createDefaultAvailability = async () => {
  try {
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    // Fetch existing availability
    const fetchResponse = await fetch('https://teamweb-kera.onrender.com/booking/getBookingAvailability');
    if (!fetchResponse.ok) throw new Error('Failed to fetch existing availability');

    const existingAvailability = await fetchResponse.json();
    const existingDates = Object.keys(existingAvailability || {});

    // Keep track of which days have been explicitly deleted
    // We need to store this information somewhere or infer it from the data
    
    // If we have availability data, check if the specific day was deleted
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // If this exact date was recently deleted, don't recreate it
    const dateStr = formatDate(selectedDate);
    const recentlyDeletedDates = JSON.parse(localStorage.getItem('deletedAvailabilityDates') || '[]');
    
    if (recentlyDeletedDates.includes(dateStr)) {
      console.log(`Availability for ${dateStr} was recently deleted. Skipping auto-creation.`);
      return;
    }

    // Only create default availability for today if it doesn't exist yet
    // and hasn't been explicitly deleted
    if (!existingDates.includes(todayFormatted)) {
      const defaultAvailability = { [todayFormatted]: generateTimeSlots() };

      const response = await fetch('https://teamweb-kera.onrender.com/booking/addBookingAvailability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: defaultAvailability }),
      });

      if (!response.ok) throw new Error('Failed to create default availability');
      console.log(`Created availability for ${todayFormatted}`);
    } else {
      console.log(`Availability for ${todayFormatted} already exists.`);
    }

  } catch (err) {
    console.error('Error creating availability:', err);
  }
};

  
const fetchBookingsData = async () => {
  try {
    if (props.studentData && props.studentData.length > 0) {
      console.log("Processing student data:", props.studentData);
      
      const studentBookings = props.studentData.map(student => {
        if (student.appointment_date) {
          // Parse the appointment date string
          let appointmentDate = new Date(student.appointment_date);
          
          // Adjust for the timezone offset if there's a shift
          // This adds one day to fix the specific issue you're seeing
          appointmentDate = new Date(appointmentDate.getTime() + 24 * 60 * 60 * 1000);
          
          console.log(`Original date: ${student.appointment_date}`);
          console.log(`Adjusted date: ${appointmentDate.toISOString()}`);
          
          return {
            _id: student._id,
            date: appointmentDate,
            timeSlot: student.preferred_time || "09:00",
            studentName: student.name,
            studentEmail: student.email,
            studentPhone: student.phone_number,
            purpose: student.purpose_of_visit || "Registration",
            status: student.status === "approved" ? "confirmed" : "pending",
            grade_level: student.grade_level,
            strand: student.strand,
            gender: student.gender,
          };
        }
        return null;
      }).filter(booking => booking !== null);
      
      if (studentBookings.length > 0) {
        console.log("Processed bookings data:", studentBookings);
        setBookingsData(studentBookings);
        return;
      }
    }
    
    // Rest of the function remains the same...
  } catch (err) {
    console.error("Failed to fetch bookings:", err);
  }
};

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
      setIsLoading(true);
      
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Create the update for just this specific day
      const dayUpdate = {
        [dayOfWeek]: appointmentForm.timeSlots
      };
      
      let response;
      
      if (editingAppointmentId) {
        // For editing an existing availability entry
        
        // First, get the current availability to preserve other days
        const currentResponse = await fetch(`https://teamweb-kera.onrender.com/booking/bookingAvailability`);
        if (!currentResponse.ok) {
          throw new Error('Failed to fetch current availability data');
        }
        
        const availabilityData = await currentResponse.json();
        const existingEntry = availabilityData.find(item => item._id === editingAppointmentId);
        
        if (!existingEntry) {
          throw new Error('Could not find the availability entry to edit');
        }
        
        // Merge the existing availability with the new day's data
        const mergedAvailability = {
          ...existingEntry.availability, // Keep all existing days
          ...dayUpdate // Update/add only the current day
        };
        
        // Update with the merged data
        response = await fetch(`https://teamweb-kera.onrender.com/booking/editBookingAvailability/${editingAppointmentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ availability: mergedAvailability })
        });
      } else {
        // For adding a new day to an existing availability
        
        // Check if we already have any availability entries
        const availabilityResponse = await fetch('https://teamweb-kera.onrender.com/booking/bookingAvailability');
        if (!availabilityResponse.ok) {
          throw new Error('Failed to fetch availability data');
        }
        
        const availabilityData = await availabilityResponse.json();
        
        if (availabilityData && availabilityData.length > 0) {
          // If we have an existing entry, update it by merging
          const existingEntry = availabilityData[0]; // Use the first available entry
          
          // Merge the existing availability with the new day
          const mergedAvailability = {
            ...existingEntry.availability, // Keep all existing days
            ...dayUpdate // Add/update the current day
          };
          
          // Update with the merged data
          response = await fetch(`https://teamweb-kera.onrender.com/booking/editBookingAvailability/${existingEntry._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ availability: mergedAvailability })
          });
        } else {
          // If no entries exist, create a new one with just this day's availability
          response = await fetch('https://teamweb-kera.onrender.com/booking/addBookingAvailability', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ availability: dayUpdate })
          });
        }
      }
      
      if (!response.ok) {
        throw new Error('Failed to save appointment');
      }
      await fetch("https://teamweb-kera.onrender.com/report/add-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username, // Replace with actual username
          activityLog: `[Manage Pre-Registration:Appointments] ${editingAppointmentId ? 'Updated' : 'Added'} availability for ${dayOfWeek}`
        }),
      });
      
      // Refresh the availability data
      await fetchAvailabilityData();
      
      setIsFormVisible(false);
      setEditingAppointmentId(null);
      
      toast.success(editingAppointmentId ? 'Appointment updated successfully' : 'Appointment added successfully');
    } catch (err) {
      toast.error('Failed to save appointment: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Edit appointment
  const editAppointment = (appointment) => {
    setAppointmentForm({
      timeSlots: appointment.timeSlots || [],
    });
    setEditingAppointmentId(appointment.id);
    setIsFormVisible(true);
  };

  // Delete appointment for a specific day
  const deleteAppointment = async (appointmentId) => {
    try {
      setIsLoading(true);
      
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = formatDate(selectedDate);
      
      // First, fetch the current availability data to preserve other days
      const currentResponse = await fetch('https://teamweb-kera.onrender.com/booking/bookingAvailability');
      if (!currentResponse.ok) {
        throw new Error('Failed to fetch current availability data');
      }
      
      const availabilityData = await currentResponse.json();
      const existingEntry = availabilityData.find(item => item._id === appointmentId);
      
      if (!existingEntry) {
        throw new Error('Could not find the availability entry to delete');
      }
      
      // Create a copy of the existing availability object
      const updatedAvailability = { ...existingEntry.availability };
      
      // Remove only the selected day's availability
      delete updatedAvailability[dayOfWeek];
      
      // Update with the modified availability (where the selected day is removed)
      const response = await fetch(`https://teamweb-kera.onrender.com/booking/editBookingAvailability/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ availability: updatedAvailability })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }
      
      // Track this deleted date so we don't auto-recreate it
      const recentlyDeletedDates = JSON.parse(localStorage.getItem('deletedAvailabilityDates') || '[]');
      if (!recentlyDeletedDates.includes(dateStr)) {
        recentlyDeletedDates.push(dateStr);
        localStorage.setItem('deletedAvailabilityDates', JSON.stringify(recentlyDeletedDates));
      }
      
      await fetch("https://teamweb-kera.onrender.com/report/add-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username, // Replace with actual username
          activityLog: `[Manage Pre-Registration:Appointments] Deleted availability for ${dayOfWeek}`
        }),
      });
      
      await fetchAvailabilityData();
      
      toast.success(`Availability for ${dayOfWeek} deleted successfully`);
    } catch (err) {
      toast.error('Failed to delete appointment: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
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
    // Check if the time is already selected in another slot
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
    // Get all time slots that are already selected (except the current one)
    const selectedSlots = appointmentForm.timeSlots
      .filter((slot, i) => slot && i !== currentIndex);
    
    // Return only time slots that aren't already selected
    return availableTimeSlots.filter(slot => !selectedSlots.includes(slot));
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date) => {
    // Create a date object for the target date
    const targetDate = new Date(date);
    
    // For debugging
    console.log(`Looking for bookings on: ${targetDate.toDateString()}`);
    
    // Filter bookings based on date match
    const matchingBookings = bookingsData.filter(booking => {
      // Get the booking date
      const bookingDate = new Date(booking.date);
      
      // Compare year, month, and day directly
      const sameYear = bookingDate.getUTCFullYear() === targetDate.getUTCFullYear();
      const sameMonth = bookingDate.getUTCMonth() === targetDate.getUTCMonth();
      const sameDay = bookingDate.getUTCDate() === targetDate.getUTCDate();
      const isMatch = sameYear && sameMonth && sameDay;
      
      // Debug output
      console.log(`Comparing booking: ${bookingDate.toDateString()} with target: ${targetDate.toDateString()}, match: ${isMatch}`);
      
      return isMatch;
    });
    
    console.log(`Found ${matchingBookings.length} bookings for ${targetDate.toDateString()}`);
    return matchingBookings;
  };
  
  
  // Get bookings organized by time slot
  const getBookingsByTimeSlot = (date) => {
    const bookings = getBookingsForDate(date);
    const slotMap = {};
    
    bookings.forEach(booking => {
      if (!slotMap[booking.timeSlot]) {
        slotMap[booking.timeSlot] = [];
      }
      slotMap[booking.timeSlot].push(booking);
    });
    
    return Object.entries(slotMap)
      .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
      .map(([time, bookings]) => ({ time, bookings }));
  };

  // Render week days - always showing today + 6 days
  const renderWeekDays = () => {
    const days = getNextSevenDays();
    
    return days.map((day, index) => {
      const dayNumber = day.getDate();
      const isToday = formatDate(day) === formatDate(new Date());
      const dateStr = formatDate(day);
      
      // Check if this day is selected
      const isSelected = selectedDate && formatDate(day) === formatDate(selectedDate);
      
      const hasAppointments = appointments[dateStr] && appointments[dateStr].length > 0;
      const bookings = getBookingsForDate(day);
      
      // Add debug info to see what dates are being rendered
      console.log(`Rendering day: ${dateStr}, bookings: ${bookings.length}`);
      
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
      return <div className="no-bookings">No bookings found for this date.</div>;
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
              {bookings.map(booking => (
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
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render calendar header with date range - simplified to just show the date range
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
                            const hour = parseInt(slot.split(':')[0]);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour > 12 ? hour - 12 : hour;
                            return (
                              <div key={index} className="time-slot">
                                <Clock size={14} />
                                <span>{`${displayHour}:00 ${ampm}`}</span>
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
                  // Get available time slots for this dropdown (including currently selected value)
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
                        {availableOptions.sort().map(slot => {
                          const hour = parseInt(slot.split(':')[0]);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour > 12 ? hour - 12 : hour;
                          return (
                            <option key={slot} value={slot}>
                              {`${displayHour}:00 ${ampm}`}
                            </option>
                          );
                        })}
                      </select>
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