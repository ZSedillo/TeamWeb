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
  const [fullyBookedDates, setFullyBookedDates] = useState({});
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
// Fixed version of the appointment management functions

const createDefaultAvailability = async () => {
  try {
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    // Fetch existing availability
    const fetchResponse = await fetch('https://teamweb-kera.onrender.com/booking/getBookingAvailability');
    if (!fetchResponse.ok) throw new Error('Failed to fetch existing availability');

    const existingAvailability = await fetchResponse.json();
    const existingDates = Object.keys(existingAvailability || {});

    // Check if this exact date was recently deleted
    const recentlyDeletedDates = JSON.parse(localStorage.getItem('deletedAvailabilityDates') || '[]');
    
    if (recentlyDeletedDates.includes(todayFormatted)) {
      console.log(`Availability for ${todayFormatted} was recently deleted. Skipping auto-creation.`);
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
          const appointmentDate = new Date(student.appointment_date);
          if (isNaN(appointmentDate.getTime())) {
            console.error("Invalid date format:", student.appointment_date);
            return null;
          }

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
            slotCapacity: student.slot_capacity || 1,
            isFull: false
          };
        }
        return null;
      }).filter(booking => booking !== null);
      
      if (studentBookings.length > 0) {
        const bookingsWithCapacity = calculateCapacityStatus(studentBookings);
        console.log("Processed bookings data:", bookingsWithCapacity);
        setBookingsData(bookingsWithCapacity);
        updateFullyBookedDates(bookingsWithCapacity);
        return;
      }
    }
    
    const response = await fetch('https://teamweb-kera.onrender.com/bookings');
    if (response.ok) {
      const apiBookings = await response.json();
      const bookingsWithCapacity = calculateCapacityStatus(apiBookings);
      setBookingsData(bookingsWithCapacity);
      updateFullyBookedDates(bookingsWithCapacity);
    } else {
      throw new Error('Failed to fetch bookings from API');
    }
    // Rest of the function remains the same...
  } catch (err) {
    console.error("Failed to fetch bookings:", err);
  }
};

// Add these helper functions RIGHT AFTER fetchBookingsData
const calculateCapacityStatus = (bookings) => {
  const slotsMap = {};
  
  bookings.forEach(booking => {
    const dateStr = formatDate(booking.date);
    const key = `${dateStr}-${booking.timeSlot}`;
    
    if (!slotsMap[key]) {
      slotsMap[key] = {
        bookings: [],
        capacity: booking.slotCapacity || 1
      };
    }
    slotsMap[key].bookings.push(booking);
  });
  
  return bookings.map(booking => {
    const dateStr = formatDate(booking.date);
    const key = `${dateStr}-${booking.timeSlot}`;
    const slot = slotsMap[key];
    
    return {
      ...booking,
      isFull: slot.bookings.length >= slot.capacity
    };
  });
};

const updateFullyBookedDates = (bookings) => {
  const dateMap = {};
  const weekDays = getNextSevenDays();
  
  weekDays.forEach(day => {
    const dateStr = formatDate(day);
    const dayBookings = bookings.filter(b => formatDate(b.date) === dateStr);
    const dayAppointments = appointments[dateStr] || [];
    
    dateMap[dateStr] = dayAppointments.some(appt => {
      return appt.timeSlots.every(slot => {
        const slotTime = typeof slot === 'object' ? slot.time : slot;
        const slotCapacity = typeof slot === 'object' ? slot.capacity : appt.defaultCapacity;
        const bookingsForSlot = dayBookings.filter(b => b.timeSlot === slotTime).length;
        return bookingsForSlot >= slotCapacity;
      });
    });
  });
  
  setFullyBookedDates(dateMap);
}; 

const handleDayClick = (day) => {
  const dateStr = formatDate(day);
  
  if (viewMode === 'availability' && fullyBookedDates[dateStr]) {
    toast.info("This day is fully booked. Please select another day.");
    return;
  }
  
  setSelectedDate(day);
  setEditingAppointmentId(null);
  
  if (viewMode === 'availability') {
    setAppointmentForm({
      timeSlots: [''],
      purpose: 'Student Registration',
      defaultCapacity: 0,
      individualCapacities: {}
    });
  }
  
  setIsFormVisible(false);
};

// Missing function for updating individual capacity
const updateIndividualCapacity = (timeSlot, value) => {
  const numValue = parseInt(value, 10);
  
  if (isNaN(numValue) || numValue < 1) {
    setAppointmentForm(prev => ({
      ...prev,
      individualCapacities: {
        ...prev.individualCapacities,
        [timeSlot]: ''
      }
    }));
    toast.error("Capacity must be at least 1");
    return;
  }
  
  const capacityValue = Math.min(numValue, 50);
  
  setAppointmentForm(prev => ({
    ...prev,
    individualCapacities: {
      ...prev.individualCapacities,
      [timeSlot]: capacityValue
    }
  }));
};

const handleInputChange = (e) => {
  const { name, value } = e.target;
  
  if (name === 'defaultCapacity') {
    const numValue = parseInt(value, 10);
    
    if (isNaN(numValue) || numValue < 1) {
      toast.error("Default capacity must be at least 1");
      return;
    }
    
    setAppointmentForm(prev => ({
      ...prev,
      [name]: Math.min(numValue, 50)
    }));
    
  } else if (name.startsWith('individualCapacity_')) {
    const timeSlot = name.replace('individualCapacity_', '');
    updateIndividualCapacity(timeSlot, value);
    
  } else {
    setAppointmentForm(prev => ({
      ...prev,
      [name]: value
    }));
  }
};
// Enhanced saveAppointment function with comprehensive validation
const saveAppointment = async () => {
  // Validate at least one time slot exists
  if (!appointmentForm.timeSlots || appointmentForm.timeSlots.length === 0) {
    toast.error('Please add at least one time slot');
    return;
  }

  // Validate all time slots are filled
  if (appointmentForm.timeSlots.some(slot => !slot)) {
    toast.error('Please fill all time slot fields');
    return;
  }

  try {
    setIsLoading(true);
    
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = formatDate(selectedDate);
    
    // Create enhanced time slots with capacities
    const enhancedTimeSlots = appointmentForm.timeSlots.map(time => ({
      time,
      capacity: appointmentForm.individualCapacities[time] || appointmentForm.defaultCapacity,
      booked: 0, // Initialize with 0 bookings
      students: [] // Initialize empty students array
    }));

    // Create the payload with proper structure
    const payload = {
      date: dateStr,
      dayOfWeek,
      slots: enhancedTimeSlots,
      defaultCapacity: appointmentForm.defaultCapacity,
      purpose: appointmentForm.purpose
    };

    console.log('Sending payload:', payload); // Debug log

    let response;
    let endpoint;
    let method;

    if (editingAppointmentId) {
      endpoint = `https://teamweb-kera.onrender.com/booking/editBookingAvailability/${editingAppointmentId}`;
      method = 'PUT';
    } else {
      endpoint = 'https://teamweb-kera.onrender.com/booking/addBookingAvailability';
      method = 'POST';
    }

    response = await fetch(endpoint, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Add auth if needed
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      // Show server error message if available
      throw new Error(
        responseData.message || 
        responseData.error || 
        `Server responded with status ${response.status}`
      );
    }

    // Update local state
    const updatedAppointments = { ...appointments };
    if (!updatedAppointments[dateStr]) {
      updatedAppointments[dateStr] = [];
    }

    if (editingAppointmentId) {
      // Update existing appointment
      const appointmentIndex = updatedAppointments[dateStr].findIndex(
        appt => appt.id === editingAppointmentId
      );
      
      if (appointmentIndex >= 0) {
        updatedAppointments[dateStr][appointmentIndex] = {
          ...updatedAppointments[dateStr][appointmentIndex],
          timeSlots: enhancedTimeSlots,
          defaultCapacity: appointmentForm.defaultCapacity,
          purpose: appointmentForm.purpose
        };
      }
    } else {
      // Add new appointment
      updatedAppointments[dateStr].push({
        id: responseData._id || Date.now().toString(), // Use server ID or fallback
        timeSlots: enhancedTimeSlots,
        defaultCapacity: appointmentForm.defaultCapacity,
        purpose: appointmentForm.purpose,
        dayOfWeek
      });
    }

    // Update state
    setAppointments(updatedAppointments);
    
    // Log activity
    try {
      await fetch("https://teamweb-kera.onrender.com/report/add-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username || 'Admin',
          activityLog: `[Appointments] ${editingAppointmentId ? 'Updated' : 'Added'} availability for ${dateStr}`
        }),
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    // Reset form and close
    setAppointmentForm({
      timeSlots: [''],
      purpose: 'Student Registration',
      defaultCapacity: 3,
      individualCapacities: {}
    });
    setIsFormVisible(false);
    setEditingAppointmentId(null);
    
    toast.success(
      editingAppointmentId 
        ? 'Appointment updated successfully' 
        : 'Appointment added successfully'
    );
    
  } catch (err) {
    console.error('Save appointment error:', err);
    
    // Enhanced error display
    let errorMessage = 'Failed to save appointment';
    if (err.message.includes('NetworkError')) {
      errorMessage = 'Network error - please check your connection';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

// Enhanced editAppointment function with proper form initialization
const editAppointment = (appointment) => {
  const existingCapacities = {};
  const timeSlotsSimple = [];
  
  // Process the time slots to extract simple time strings and individual capacities
  if (appointment.timeSlots && Array.isArray(appointment.timeSlots)) {
    appointment.timeSlots.forEach(slot => {
      if (typeof slot === 'object' && slot.time) {
        timeSlotsSimple.push(slot.time);
        if (slot.capacity !== undefined && slot.capacity !== appointment.defaultCapacity) {
          existingCapacities[slot.time] = slot.capacity;
        }
      } else if (typeof slot === 'string') {
        timeSlotsSimple.push(slot);
      }
    });
  }
  
  setAppointmentForm({
    timeSlots: timeSlotsSimple.length > 0 ? timeSlotsSimple : [''],
    purpose: appointment.purpose || 'Student Registration',
    defaultCapacity: appointment.defaultCapacity || 1,
    individualCapacities: existingCapacities
  });
  
  setEditingAppointmentId(appointment.id);
  setIsFormVisible(true);
};
// Enhanced deleteAppointment function with confirmation dialog
const deleteAppointment = async (appointmentId) => {
  if (!window.confirm('Are you sure you want to delete this appointment availability? This action cannot be undone.')) {
    return;
  }

  try {
    setIsLoading(true);
    
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = formatDate(selectedDate);
    
    // Fetch the current availability data
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
    
    // Update with the modified availability
    const response = await fetch(`https://teamweb-kera.onrender.com/booking/editBookingAvailability/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        availability: updatedAvailability,
        lastModified: new Date().toISOString(),
        modifiedBy: username || 'Admin'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to delete appointment');
    }
    
    // Track this deleted date
    const recentlyDeletedDates = JSON.parse(localStorage.getItem('deletedAvailabilityDates') || '[]');
    if (!recentlyDeletedDates.includes(dateStr)) {
      recentlyDeletedDates.push(dateStr);
      // Keep only last 30 deleted dates to prevent localStorage bloat
      if (recentlyDeletedDates.length > 30) {
        recentlyDeletedDates.splice(0, recentlyDeletedDates.length - 30);
      }
      localStorage.setItem('deletedAvailabilityDates', JSON.stringify(recentlyDeletedDates));
    }
    
    // Log the activity
    try {
      await fetch("https://teamweb-kera.onrender.com/report/add-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username || 'Admin',
          activityLog: `[Manage Pre-Registration:Appointments] Deleted availability for ${dayOfWeek}`
        }),
      });
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }
    
    await fetchAvailabilityData();
    
    toast.success(`Availability for ${dayOfWeek} deleted successfully`);
  } catch (err) {
    console.error('Delete appointment error:', err);
    toast.error('Failed to delete appointment: ' + err.message);
  } finally {
    setIsLoading(false);
  }
};

// Enhanced time slot management functions
const addTimeSlot = () => {
  if (appointmentForm.timeSlots.length >= 20) {
    toast.error('Maximum 20 time slots allowed');
    return;
  }
  
  const newTimeSlots = [...appointmentForm.timeSlots, ''];
  setAppointmentForm({
    ...appointmentForm,
    timeSlots: newTimeSlots
  });
};

const removeTimeSlot = (index) => {
  if (appointmentForm.timeSlots.length <= 1) {
    toast.error('At least one time slot is required');
    return;
  }
  
  const newTimeSlots = [...appointmentForm.timeSlots];
  const removedSlot = newTimeSlots[index];
  newTimeSlots.splice(index, 1);
  
  // Remove individual capacity for the removed slot
  const updatedCapacities = { ...appointmentForm.individualCapacities };
  if (removedSlot && updatedCapacities[removedSlot]) {
    delete updatedCapacities[removedSlot];
  }
  
  setAppointmentForm({
    ...appointmentForm,
    timeSlots: newTimeSlots,
    individualCapacities: updatedCapacities
  });
};

const updateTimeSlot = (index, value) => {
  // Check if the time is already selected in another slot
  const existingIndex = appointmentForm.timeSlots.findIndex((slot, i) => slot === value && i !== index);
  if (value && existingIndex !== -1) {
    toast.error('This time slot is already selected. Please choose a different time.');
    return;
  }
  
  const oldValue = appointmentForm.timeSlots[index];
  const newTimeSlots = [...appointmentForm.timeSlots];
  newTimeSlots[index] = value;
  
  // Update individual capacities - rename the key if it exists
  const updatedCapacities = { ...appointmentForm.individualCapacities };
  if (oldValue && updatedCapacities[oldValue] && value) {
    updatedCapacities[value] = updatedCapacities[oldValue];
    delete updatedCapacities[oldValue];
  }
  
  setAppointmentForm({
    ...appointmentForm,
    timeSlots: newTimeSlots,
    individualCapacities: updatedCapacities
  });
};

// Get available time slots that haven't been selected yet
const getAvailableTimeSlots = (currentIndex) => {
  const selectedSlots = appointmentForm.timeSlots
    .filter((slot, i) => slot && i !== currentIndex);
  
  return availableTimeSlots.filter(slot => !selectedSlots.includes(slot));
};

// Get bookings for a specific date with improved date handling
const getBookingsForDate = (date) => {
  const targetDate = new Date(date);
  console.log(`Looking for bookings on: ${targetDate.toDateString()}`);
  
  const matchingBookings = bookingsData.filter(booking => {
    const bookingDate = new Date(booking.date);
    
    const sameYear = bookingDate.getUTCFullYear() === targetDate.getUTCFullYear();
    const sameMonth = bookingDate.getUTCMonth() === targetDate.getUTCMonth();
    const sameDay = bookingDate.getUTCDate() === targetDate.getUTCDate();
    const isMatch = sameYear && sameMonth && sameDay;
    
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

// Render week days with improved date handling
const renderWeekDays = () => {
  const days = getNextSevenDays();
  
  return days.map((day, index) => {
    const dayNumber = day.getDate();
    const isToday = formatDate(day) === formatDate(new Date());
    const dateStr = formatDate(day);
    
    const isSelected = selectedDate && formatDate(day) === formatDate(selectedDate);
    
    const hasAppointments = appointments[dateStr] && appointments[dateStr].length > 0;
    const bookings = getBookingsForDate(day);
    
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

        // Render bookings for selected date with capacity information
        const renderBookings = () => {
          const bookingsBySlot = getBookingsByTimeSlot(selectedDate);
          
          if (bookingsBySlot.length === 0) {
            return <div className="no-bookings">No bookings found for this date.</div>;
          }
          
          return (
            <div className="bookings-by-slot">
              {bookingsBySlot.map(({ time, bookings }, index) => {
                // Find the appointment slot to get capacity info
                const dateStr = formatDate(selectedDate);
                const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
                
                // Get appointment data for this day
                const appointmentData = appointments[dateStr]?.find(appt => appt.dayOfWeek === dayOfWeek);
                
                // Find the specific time slot to get its capacity
                let capacity = 0; // default fallback
                
                if (appointmentData) {
                  // Check enhanced time slots first
                  if (appointmentData.timeSlots && Array.isArray(appointmentData.timeSlots)) {
                    const timeSlotData = appointmentData.timeSlots.find(slot => {
                      if (typeof slot === 'object' && slot.time) {
                        // Convert 24-hour format to 12-hour format for comparison
                        const hour = parseInt(slot.time.split(':')[0]);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                        const displayTime = `${displayHour}:00 ${ampm}`;
                        return displayTime === time;
                      }
                      return false;
                    });
                    
                    if (timeSlotData && timeSlotData.capacity) {
                      capacity = timeSlotData.capacity;
                    } else {
                      capacity = appointmentData.defaultCapacity || 1;
                    }
                  } else {
                    // Fallback to default capacity
                    capacity = appointmentData.defaultCapacity || 1;
                  }
                }
                
                const isAtCapacity = bookings.length >= capacity;
                
                return (
                  <div key={index} className="time-slot-bookings">
                    <h4 className="time-slot-header">
                      <Clock size={16} />
                      {time}
                      <span className={`booking-count ${isAtCapacity ? 'at-capacity' : ''}`}>
                        {bookings.length}/{capacity} slots filled
                      </span>
                      {isAtCapacity && <span className="capacity-badge">FULL</span>}
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
                );
              })}
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
                            let timeDisplay, capacity;
                            
                            // Handle both enhanced and simple time slot formats
                            if (typeof slot === 'object' && slot.time) {
                              const hour = parseInt(slot.time.split(':')[0]);
                              const ampm = hour >= 12 ? 'PM' : 'AM';
                              const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                              timeDisplay = `${displayHour}:00 ${ampm}`;
                              
                              // Fixed capacity logic
                              capacity = (slot.capacity !== undefined) 
                                ? slot.capacity 
                                : (appointment.defaultCapacity !== undefined) 
                                  ? appointment.defaultCapacity 
                                  : 3;
                                  
                            } else if (typeof slot === 'string') {
                              const hour = parseInt(slot.split(':')[0]);
                              const ampm = hour >= 12 ? 'PM' : 'AM';
                              const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                              timeDisplay = `${displayHour}:00 ${ampm}`;
                              
                              // Fixed capacity logic
                              capacity = (appointment.defaultCapacity !== undefined) 
                                ? appointment.defaultCapacity 
                                : 3;
                            }
                            
                            // Get current bookings for this time slot
                            const currentBookings = getBookingsByTimeSlot(selectedDate)
                              .find(booking => booking.time === timeDisplay)?.bookings?.length || 0;
                            
                            return (
                              <div key={index} className="time-slot">
                                <Clock size={14} />
                                <span>{timeDisplay}</span>
                                <span className="capacity-info">
                                  ({currentBookings}/{capacity} booked)
                                </span>
                                {currentBookings >= capacity && (
                                  <span className="full-badge">FULL</span>
                                )}
                              </div>
                            );
                          }).filter(Boolean) // Remove null values
                        ) : (
                          <span className="no-slots">No time slots defined</span>
                        )}
                            </div>
                          </div>
                          {appointment.defaultCapacity && (
                            <div className="default-capacity-info">
                              <strong>Default Capacity per Slot:</strong> {appointment.defaultCapacity} students
                            </div>
                          )}
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
                        defaultCapacity: 1,
                        individualCapacities: {}
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
                      <label>Default Capacity per Time Slot:</label>
                      <input 
                        type="number" 
                        name="defaultCapacity" 
                        value={appointmentForm.defaultCapacity}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                        placeholder="Number of students per slot"
                      />
                      <small className="form-help-text">
                        This sets the default number of students that can book each time slot. 
                        You can customize individual slots below.
                      </small>
                    </div>
                    
                    <div className="form-group">
                      <label>Time Slots:</label>
                      {appointmentForm.timeSlots.map((timeSlot, index) => {
                        // Get available time slots for this dropdown (including currently selected value)
                        const availableOptions = timeSlot 
                          ? [...getAvailableTimeSlots(index), timeSlot] 
                          : getAvailableTimeSlots(index);
                        
                        const individualCapacity = appointmentForm.individualCapacities?.[timeSlot] || '';
                        
                        return (
                          <div key={index} className="time-slot-input">
                            <div className="time-slot-row">
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
                              
                              {timeSlot && (
                                <div className="capacity-input-group">
                                  <label className="capacity-label">Custom Capacity:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    placeholder={`Default: ${appointmentForm.defaultCapacity}`}
                                    value={individualCapacity}
                                    onChange={(e) => updateIndividualCapacity(timeSlot, e.target.value)}
                                    className="capacity-input"
                                  />
                                </div>
                              )}
                              
                              <button 
                                type="button" 
                                className="remove-slot-button"
                                onClick={() => removeTimeSlot(index)}
                                disabled={appointmentForm.timeSlots.length <= 1}
                              >
                                Remove
                              </button>
                            </div>
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