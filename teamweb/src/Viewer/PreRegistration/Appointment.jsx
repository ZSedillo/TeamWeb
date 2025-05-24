import React, { useState, useEffect } from 'react';
import './Appointment.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

    // Helper to get filled/max for a slot on a date from API data
    const getSlotInfoForDate = (dateStr, slotTime) => {
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        for (const entry of availabilityData) {
            const slots = entry.availability[dayName];
            console.log('[DEBUG getSlotInfoForDate] dateStr:', dateStr, 'dayName:', dayName, 'slotTime:', slotTime, 'slots:', slots);
            if (Array.isArray(slots)) {
                for (const slot of slots) {
                    console.log('[DEBUG getSlotInfoForDate] Checking slot:', slot);
                    if (slot.time === slotTime) {
                        console.log('[DEBUG getSlotInfoForDate] MATCHED slot:', slot);
                        return { filled: slot.filled || 0, max: slot.max };
                    }
                }
            }
        }
        console.log('[DEBUG getSlotInfoForDate] No match found, returning default 0/3');
        return { filled: 0, max: 3 };
    };

    // Update email when preRegEmail changes
    useEffect(() => {
        if (preRegEmail) {
            setEmail(preRegEmail);
        }
    }, [preRegEmail]);

    // Embedded mode: check slot availability before saving to sessionStorage
    useEffect(() => {
        const checkAndSaveEmbeddedAppointment = () => {
            if (embedded && appointmentDate && appointmentTime && appointmentReason) {
                const { filled, max } = getSlotInfoForDate(appointmentDate, appointmentTime);
                if (filled >= max) {
                    setErrors(prev => ({ ...prev, appointmentTime: 'This slot is already full. Please choose another time.' }));
                    sessionStorage.removeItem('appointmentData');
                    return;
                }
                // If slot is available, save to sessionStorage
                const appointmentData = {
                    appointment_date: appointmentDate,
                    preferred_time: appointmentTime,
                    purpose_of_visit: appointmentReason
                };
                sessionStorage.setItem('appointmentData', JSON.stringify(appointmentData));
            } else if (embedded) {
                sessionStorage.removeItem('appointmentData');
            }
        };
        checkAndSaveEmbeddedAppointment();
    }, [embedded, appointmentDate, appointmentTime, appointmentReason, availabilityData]);

    // Fetch availability data from API
    const loadAvailabilityData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('https://teamweb-kera.onrender.com/booking/bookingAvailability');
            const data = await response.json();
            setAvailabilityData(data);
            processAvailableDates(data);
            // Build maxes for all slots (always use backend value)
            const maxes = {};
            for (const entry of data) {
                for (const day of Object.keys(entry.availability)) {
                    for (const slot of entry.availability[day]) {
                        const slotTime = typeof slot === 'object' && slot.time ? slot.time : slot;
                        // Fix: typeof slot.max === 'number' (not 'Number')
                        const slotMax = typeof slot === 'object' && typeof slot.max === 'number' ? slot.max : 3;
                        maxes[slotTime] = slotMax;
                    }
                }
            }
            setSlotMaxes(maxes);
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

    // Handle review information
    const handleReviewInformation = (e) => {
        e.preventDefault();
        const { filled, max } = getSlotInfoForDate(appointmentDate, appointmentTime);
        if (typeof max === 'number') {
            if (filled === max) {
                toast.error('This slot is already full. Please choose another time.');
                setErrors(prev => ({ ...prev, appointmentTime: '' }));
                return;
            }
        }
        // If all good, proceed to review (submit or next step)
        // ...existing review logic here...
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
                        onSubmit={embedded ? (e) => e.preventDefault() : handleReviewInformation} 
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
                                            const { filled, max } = getSlotInfoForDate(appointmentDate, slotTime);
                                            console.log('DEBUG slotTime:', slotTime, 'filled:', filled, 'max:', max, 'typeof filled:', typeof filled, 'typeof max:', typeof max);
                                            return (Number(filled) === Number(max))
                                                ? null
                                                : (
                                                    <div 
                                                        key={slotTime}
                                                        className={`appointment-time-option ${appointmentTime === slotTime ? 'active' : ''}`}
                                                        onClick={() => handleTimeSelect(slotTime)}
                                                    >
                                                        {formatTime(slotTime)}
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
            <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
}

export default Appointment;