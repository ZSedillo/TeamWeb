import React, { useState, useEffect } from 'react';
import './Appointment.css';

function Appointment({ embedded = false, preRegEmail = '' }) {
    // Base states
    const [email, setEmail] = useState(preRegEmail || "");
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

    // Slot maxes and filled counts
    const [slotMaxes, setSlotMaxes] = useState({}); // { '09:00': 3, ... }
    const [slotFilled, setSlotFilled] = useState({}); // { '2025-05-24_09:00': 2, ... }

    // Day mapping constant
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Initialize data on load
    useEffect(() => {
        loadAvailabilityData();
    }, []);

    // Update email when preRegEmail changes
    useEffect(() => {
        if (preRegEmail) {
            setEmail(preRegEmail);
        }
    }, [preRegEmail]);

    // Embedded mode: check slot availability before saving to sessionStorage
    useEffect(() => {
        const checkAndSaveEmbeddedAppointment = async () => {
            if (embedded && appointmentDate && appointmentTime && appointmentReason) {
                try {
                    // Get all bookings for the selected date
                    const bookingsRes = await fetch('https://teamweb-kera.onrender.com/preregistration/all');
                    if (!bookingsRes.ok) throw new Error('Failed to fetch bookings');
                    const bookings = await bookingsRes.json();
                    // Count how many bookings for this date and time
                    const count = bookings.filter(b => {
                        const slotTime = typeof b.preferred_time === 'object' && b.preferred_time.time ? b.preferred_time.time : b.preferred_time;
                        let bDate = b.appointment_date;
                        if (bDate instanceof Date) {
                            bDate = bDate.toISOString().split('T')[0];
                        } else if (typeof bDate === 'string' && bDate.includes('T')) {
                            bDate = bDate.split('T')[0];
                        }
                        return bDate === appointmentDate && slotTime === appointmentTime;
                    }).length;
                    const max = slotMaxes[appointmentTime] || 3;
                    if (count >= max) {
                        setErrors(prev => ({ ...prev, appointmentTime: 'This slot is already full. Please choose another time.' }));
                        // Remove any previously saved appointmentData
                        sessionStorage.removeItem('appointmentData');
                        return;
                    }
                    // If slot is available, save to sessionStorage
                    const appointmentData = {
                        date: appointmentDate,
                        time: appointmentTime,
                        purpose: appointmentReason
                    };
                    sessionStorage.setItem('appointmentData', JSON.stringify(appointmentData));
                } catch (err) {
                    setErrors(prev => ({ ...prev, appointmentTime: 'Failed to check slot availability. Please try again.' }));
                    sessionStorage.removeItem('appointmentData');
                }
            } else if (embedded) {
                // If not all fields are filled, remove appointmentData
                sessionStorage.removeItem('appointmentData');
            }
        };
        checkAndSaveEmbeddedAppointment();
        // Only run when these change
    }, [embedded, appointmentDate, appointmentTime, appointmentReason, slotMaxes]);

    // Fetch availability data from API
    const loadAvailabilityData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('https://teamweb-kera.onrender.com/booking/bookingAvailability');
            const data = await response.json();
            setAvailabilityData(data);
            processAvailableDates(data);
            
            // Fetch filled counts for each slot for the next 7 days
            const today = new Date();
            const maxes = {};
            // Build maxes for all slots
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(today.getDate() + i);
                const dayName = DAYS[date.getDay()];
                data.forEach(entry => {
                    if (entry.availability && entry.availability[dayName]) {
                        entry.availability[dayName].forEach(slot => {
                            const slotTime = typeof slot === 'object' && slot.time ? slot.time : slot;
                            const slotMax = typeof slot === 'object' && slot.max ? slot.max : 3;
                            maxes[slotTime] = slotMax;
                        });
                    }
                });
            }
            // Fetch all bookings for the next 7 days
            const bookingsRes = await fetch('https://teamweb-kera.onrender.com/preregistration/all');
            const bookings = await bookingsRes.json();
            const filled = {};
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(today.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                bookings.forEach(b => {
                    if (b.appointment_date && b.preferred_time) {
                        let bDate = b.appointment_date;
                        if (bDate instanceof Date) {
                            bDate = bDate.toISOString().split('T')[0];
                        } else if (typeof bDate === 'string' && bDate.includes('T')) {
                            bDate = bDate.split('T')[0];
                        }
                        const slotTime = typeof b.preferred_time === 'object' && b.preferred_time.time ? b.preferred_time.time : b.preferred_time;
                        if (bDate === dateStr) {
                            const key = `${bDate}_${slotTime}`;
                            filled[key] = (filled[key] || 0) + 1;
                        }
                    }
                });
            }
            setSlotMaxes(maxes);
            setSlotFilled(filled);
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
                    entry.availability[day].forEach(slot => {
                        if (typeof slot === 'object' && slot.time) {
                            availabilityByDay[day].push(slot);
                        } else if (typeof slot === 'string') {
                            availabilityByDay[day].push({ time: slot, max: 3 });
                        }
                    });
                }
            });
            const seen = new Set();
            availabilityByDay[day] = availabilityByDay[day].filter(slot => {
                const t = slot.time;
                if (seen.has(t)) return false;
                seen.add(t);
                return true;
            });
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
            
            if (availabilityByDay[dayName] && availabilityByDay[dayName].length > 0) {
                const dateString = date.toISOString().split('T')[0];
                const formattedDate = formatDate(date);
                
                datesList.push({
                    date: dateString,
                    dayName: dayName,
                    formattedDate: formattedDate,
                    times: availabilityByDay[dayName]
                });
            }
        }
        
        setAvailableDates(datesList);
        
        // Pre-select the first available date if exists
        if (datesList.length > 0) {
            setAppointmentDate(datesList[0].date);
            setAvailableTimes(datesList[0].times);
        }
    };

    // Format date for display
    const formatDate = (date) => {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    // Handle date selection
    const handleDateSelect = (dateString) => {
        setAppointmentDate(dateString);
        setAppointmentTime(""); // Reset time selection
        
        const selectedDateObj = availableDates.find(d => d.date === dateString);
        if (selectedDateObj) {
            setAvailableTimes(selectedDateObj.times);
        } else {
            setAvailableTimes([]);
        }
        
        setErrors(prev => ({...prev, appointmentDate: "", appointmentTime: ""}));
    };

    // Handle time selection
    const handleTimeSelect = (time) => {
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

    // Handle form submission - only used in standalone mode
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        // Fetch latest bookings for the selected date/time before submitting
        try {
            setIsLoading(true);
            // Get all bookings for the selected date
            const bookingsRes = await fetch('https://teamweb-kera.onrender.com/preregistration/all');
            const bookings = await bookingsRes.json();
            // Count how many bookings for this date and time
            const count = bookings.filter(b => {
                // Defensive: handle both string and object for preferred_time
                const slotTime = typeof b.preferred_time === 'object' && b.preferred_time.time ? b.preferred_time.time : b.preferred_time;
                // Defensive: handle both string and Date for appointment_date
                let bDate = b.appointment_date;
                if (bDate instanceof Date) {
                    bDate = bDate.toISOString().split('T')[0];
                } else if (typeof bDate === 'string' && bDate.includes('T')) {
                    bDate = bDate.split('T')[0];
                }
                return bDate === appointmentDate && slotTime === appointmentTime;
            }).length;
            const max = slotMaxes[appointmentTime] || 3;
            if (count >= max) {
                setErrors(prev => ({ ...prev, appointmentTime: 'This slot is already full. Please choose another time.' }));
                setIsLoading(false);
                return;
            }
        } catch (err) {
            setIsLoading(false);
            alert('Failed to check slot availability. Please try again.');
            return;
        }

        // Submit the booking
        try {
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
                // If backend says slot is full, show error
                if (result.error && result.error.toLowerCase().includes('full')) {
                    setErrors(prev => ({ ...prev, appointmentTime: 'This slot is already full. Please choose another time.' }));
                } else {
                    alert(result.error || 'Failed to book appointment. Please try again.');
                }
            }
        } catch (error) {
            console.error('Error submitting appointment:', error);
            alert('Failed to connect to the server. Please try again.');
        } finally {
            setIsLoading(false);
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

    // Success page for standalone mode
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
        <div className={embedded ? "appointment-embedded-container" : "appointment-main-container"}>
            <div className="appointment-section">
                {!embedded && <div className="appointment-title">Book an Appointment</div>}
                
                {isLoading ? (
                    <div className="appointment-loading">Loading availability data...</div>
                ) : availableDates.length === 0 ? (
                    <div className="appointment-no-dates">
                        <h3>No appointments available</h3>
                        <p>There are currently no appointments available for booking. Please check back later.</p>
                    </div>
                ) : (
                    <form 
                        onSubmit={embedded ? (e) => e.preventDefault() : handleSubmit} 
                        className={embedded ? "appointment-embedded-form" : "appointment-form"}
                    >
                        {!embedded && (
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
                        )}
                        
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
                        
                        <div className="appointment-form-group">
                            <label>Preferred Time <span className="appointment-required">*</span></label>
                            <div className="appointment-time-selection">
                                {!appointmentDate ? (
                                    <div className="appointment-select-date-first">Please select a date first</div>
                                ) : availableTimes.length === 0 ? (
                                    <div className="appointment-no-times">No available times for this date</div>
                                ) : (
                                    <div className="appointment-time-options">
                                        {availableTimes.map(slot => {
                                            const slotTime = typeof slot === 'object' && slot.time ? slot.time : slot;
                                            const slotMax = typeof slot === 'object' && slot.max ? slot.max : (slotMaxes[slotTime] || 3);
                                            const filledKey = `${appointmentDate}_${slotTime}`;
                                            const filled = slotFilled[filledKey] || 0;
                                            const isFull = filled >= slotMax;

                                            // If the slot is full, do not render it
                                            if (isFull) return null;

                                            return (
                                                <div 
                                                    key={slotTime}
                                                    className={`appointment-time-option ${appointmentTime === slotTime ? 'active' : ''}`}
                                                    onClick={() => handleTimeSelect(slotTime)}
                                                >
                                                    {formatTime(slotTime)}
                                                    <span className="slot-counter">{filled} / {slotMax}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {errors.appointmentTime && <div className="appointment-error">{errors.appointmentTime}</div>}
                        </div>
                        
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

                        {embedded && (appointmentDate && appointmentTime && appointmentReason) && (
                            <div className="appointment-embedded-success">
                                <p>✓ Appointment details saved for your registration</p>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}

export default Appointment;