import React, { useState, useEffect } from 'react';
import './Appointment.css';

function Appointment() {
    // Base states
    const [email, setEmail] = useState("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [appointmentTime, setAppointmentTime] = useState("");
    const [appointmentReason, setAppointmentReason] = useState("");
    const [errors, setErrors] = useState({});
    const [bookingSuccess, setBookingSuccess] = useState(false);
    
    // Availability data states
    const [availabilityData, setAvailabilityData] = useState([]);
    const [availableDates, setAvailableDates] = useState([]);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Day mapping constant
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Initialize data on load
    useEffect(() => {
        loadAvailabilityData();
    }, []);

    // Fetch availability data from API
    const loadAvailabilityData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('https://teamweb-kera.onrender.com/booking/bookingAvailability');
            const data = await response.json();
            
            console.log("API Response:", data);
            
            if (data && data.length > 0) {
                setAvailabilityData(data);
                processAvailableDates(data);
            } else {
                console.log("No availability data returned from API");
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching availability data:", error);
            setIsLoading(false);
        }
    };

    // Process availability data to find available dates
    const processAvailableDates = (data) => {
        // Map of days to their availability
        const availabilityByDay = {};
        
        // Populate the availability map
        DAYS.forEach(day => {
            availabilityByDay[day] = [];
            
            data.forEach(entry => {
                if (entry.availability && entry.availability[day] && entry.availability[day].length > 0) {
                    availabilityByDay[day] = [
                        ...availabilityByDay[day],
                        ...entry.availability[day]
                    ];
                }
            });
            
            // Remove duplicates
            availabilityByDay[day] = [...new Set(availabilityByDay[day])];
            console.log(`Availability for ${day}:`, availabilityByDay[day]);
        });
        
        // Generate the next 7 days with availability info
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time part to compare dates properly
        
        const datesList = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            date.setHours(0, 0, 0, 0);
            
            const dayIndex = date.getDay();
            const dayName = DAYS[dayIndex];
            
            // Check if this day has any available times
            if (availabilityByDay[dayName] && availabilityByDay[dayName].length > 0) {
                const dateString = date.toISOString().split('T')[0];
                const formattedDate = formatDate(date);
                
                datesList.push({
                    date: dateString,
                    dayName: dayName,
                    formattedDate: formattedDate,
                    times: availabilityByDay[dayName]
                });
                
                console.log(`Added available date: ${dateString} (${dayName}) with ${availabilityByDay[dayName].length} time slots`);
            }
        }
        
        setAvailableDates(datesList);
        
        // Pre-select the first available date if exists
        if (datesList.length > 0) {
            setAppointmentDate(datesList[0].date);
            setAvailableTimes(datesList[0].times);
            console.log(`Pre-selected date: ${datesList[0].date} with times:`, datesList[0].times);
        }
    };

    // Format date for display
    const formatDate = (date) => {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    // Handle date selection
    const handleDateSelect = (dateString) => {
        console.log(`Selected date: ${dateString}`);
        setAppointmentDate(dateString);
        setAppointmentTime(""); // Reset time selection
        
        // Find the selected date in our available dates
        const selectedDateObj = availableDates.find(d => d.date === dateString);
        if (selectedDateObj) {
            setAvailableTimes(selectedDateObj.times);
            console.log(`Set available times for ${dateString}:`, selectedDateObj.times);
        } else {
            setAvailableTimes([]);
            console.log(`No times found for date: ${dateString}`);
        }
        
        // Clear any errors
        setErrors(prev => ({...prev, appointmentDate: "", appointmentTime: ""}));
    };

    // Handle time selection
    const handleTimeSelect = (time) => {
        console.log(`Selected time: ${time}`);
        setAppointmentTime(time);
        setErrors(prev => ({...prev, appointmentTime: ""}));
    };

    // Format time to 12-hour format
    const formatTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Form validation
    const validateForm = () => {
        const newErrors = {};
        
        if (!email) newErrors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email format";
        
        if (!appointmentDate) newErrors.appointmentDate = "Please select a date";
        if (!appointmentTime) newErrors.appointmentTime = "Please select a time";
        if (!appointmentReason.trim()) newErrors.appointmentReason = "Please provide a reason for your visit";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            try {
                console.log("Submitting appointment data:", {
                    email,
                    appointment_date: appointmentDate,
                    preferred_time: appointmentTime,
                    purpose_of_visit: appointmentReason
                });
                
                const response = await fetch('https://teamweb-kera.onrender.com/preregistration/addBooking', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        appointment_date: appointmentDate,
                        preferred_time: appointmentTime,
                        purpose_of_visit: appointmentReason,
                    }),
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    setBookingSuccess(true);
                } else {
                    alert(result.error || 'Failed to book appointment. Please try again.');
                }
            } catch (error) {
                console.error('Error submitting appointment:', error);
                alert('Failed to connect to the server. Please try again.');
            }
        }
    };

    // Handle input change for email and reason
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'email') {
            setEmail(value);
            if (errors.email) setErrors(prev => ({...prev, email: ""}));
        } else if (name === 'appointmentReason') {
            setAppointmentReason(value);
            if (errors.appointmentReason) setErrors(prev => ({...prev, appointmentReason: ""}));
        }
    };

    // Success page
    if (bookingSuccess) {
        return (
            <div className="appointment-main-container">
                <div className="appointment-success-wrapper">
                    <div className="appointment-success-card">
                        <div className="appointment-success-checkmark">✓</div>
                        <h1 className="appointment-success-heading">Appointment Booked Successfully!</h1>
                        <p>You will receive an appointment confirmation email at {email}.</p>
                        <br />
                        <br />
                        <a href="/" className="appointment-success-home-btn">Return to Homepage</a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div classname="form-wrapper">
        <div className="appointment-main-container">
            <div className="appointment-section">
                <div className="appointment-title">Book an Appointment</div>
                
                {isLoading ? (
                    <div className="appointment-loading">Loading availability data...</div>
                ) : availableDates.length === 0 ? (
                    <div className="appointment-no-dates">
                        <h3>No appointments available</h3>
                        <p>There are currently no appointments available for booking. Please check back later.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="appointment-form">
                        {/* Email Field */}
                        <div className="appointment-form-group">
                            <label htmlFor="email">Email <span className="appointment-required">*</span></label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email"
                                value={email}
                                onChange={handleInputChange}
                                placeholder="your@email.com"
                            />
                            {errors.email && <div className="appointment-error">{errors.email}</div>}
                        </div>
                        
                        {/* Date Selection */}
                        <div className="appointment-form-group">
                            <label>Preferred Date <span className="appointment-required">*</span></label>
                            <div className="appointment-date-selection">
                                {availableDates.map(day => (
                                    <div 
                                        key={day.date}
                                        className={`appointment-date-option ${appointmentDate === day.date ? 'active' : ''}`}
                                        onClick={() => handleDateSelect(day.date)}
                                    >
                                        <div className="date-option-weekday">{day.formattedDate.split(',')[0]}</div>
                                        <div className="date-option-date">{day.formattedDate.split(',')[1]}</div>
                                    </div>
                                ))}
                            </div>
                            {errors.appointmentDate && <div className="appointment-error">{errors.appointmentDate}</div>}
                        </div>
                        
                        {/* Time Selection */}
                        <div className="appointment-form-group">
                            <label>Preferred Time <span className="appointment-required">*</span></label>
                            <div className="appointment-time-selection">
                                {!appointmentDate ? (
                                    <div className="appointment-select-date-first">Please select a date first</div>
                                ) : availableTimes.length === 0 ? (
                                    <div className="appointment-no-times">No available times for this date</div>
                                ) : (
                                    <div className="appointment-time-options">
                                        {availableTimes.map(time => (
                                            <div 
                                                key={time}
                                                className={`appointment-time-option ${appointmentTime === time ? 'active' : ''}`}
                                                onClick={() => handleTimeSelect(time)}
                                            >
                                                {formatTime(time)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.appointmentTime && <div className="appointment-error">{errors.appointmentTime}</div>}
                        </div>
                        
                        {/* Reason Field */}
                        <div className="appointment-form-group">
                            <label htmlFor="appointmentReason">Purpose of Visit <span className="appointment-required">*</span></label>
                            <textarea 
                                id="appointmentReason" 
                                name="appointmentReason"
                                value={appointmentReason}
                                onChange={handleInputChange}
                                rows="4"
                                placeholder="Please describe the reason for your appointment"
                            ></textarea>
                            {errors.appointmentReason && <div className="appointment-error">{errors.appointmentReason}</div>}
                        </div>
                        
                        {/* Submit Button */}
                        <div className="appointment-btn-group">
                            <button 
                                type="submit"
                                className="appointment-submit-btn"
                            >
                                Book Appointment    
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
        </div>
    );
}

export default Appointment;