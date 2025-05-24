import React, { useState, useEffect } from 'react';
import './Appointment.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Appointment({
    embedded = false,
    preRegEmail = '',
    appointmentDate,
    appointmentTime,
    appointmentReason,
    setAppointmentDate,
    setAppointmentTime,
    setAppointmentReason
}) {
    const [email, setEmail] = useState(preRegEmail || "");
    const [errors, setErrors] = useState({});
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const [availabilityData, setAvailabilityData] = useState([]);
    const [availableDates, setAvailableDates] = useState([]);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    useEffect(() => {
        loadAvailabilityData();
    }, []);

    const getSlotInfoForDate = (dateStr, slotTime) => {
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        for (const entry of availabilityData) {
            const slots = entry.availability?.[dayName];
            if (Array.isArray(slots)) {
                for (const slot of slots) {
                    if (slot.time === slotTime) {
                        return {
                            filled: slot.filled || 0,
                            max: slot.max || 0
                        };
                    }
                }
            }
        }

        return { filled: 0, max: 0 };
    };

    useEffect(() => {
        if (preRegEmail) {
            setEmail(preRegEmail);
        }
    }, [preRegEmail]);

    useEffect(() => {
        // Only save to sessionStorage if all fields are filled and slot is available
        if (embedded && appointmentDate && appointmentTime && appointmentReason) {
            const { filled, max } = getSlotInfoForDate(appointmentDate, appointmentTime);
            if (max > 0 && filled < max) {
                const appointmentData = {
                    appointment_date: appointmentDate,
                    preferred_time: appointmentTime,
                    purpose_of_visit: appointmentReason
                };
                setErrors(prev => ({ ...prev, appointmentTime: '' }));
            } else if (max > 0 && filled >= max) {
                setErrors(prev => ({ ...prev, appointmentTime: 'This slot is already full. Please choose another time.' }));
            }
        }
    }, [embedded, appointmentDate, appointmentTime, appointmentReason, availabilityData]);

    const loadAvailabilityData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('https://teamweb-kera.onrender.com/booking/bookingAvailability');
            const data = await response.json();
            setAvailabilityData(data);
            processAvailableDates(data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching availability data:", error);
            setIsLoading(false);
        }
    };

    const processAvailableDates = (data) => {
        const availabilityByDay = {};

        DAYS.forEach(day => {
            availabilityByDay[day] = [];
            data.forEach(entry => {
                const slots = entry.availability?.[day];
                if (Array.isArray(slots)) {
                    availabilityByDay[day].push(...slots);
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const datesList = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            date.setHours(0, 0, 0, 0);

            const dayIndex = date.getDay();
            const dayName = DAYS[dayIndex];

            if (availabilityByDay[dayName]?.length > 0) {
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

        if (datesList.length > 0) {
            setAppointmentDate(datesList[0].date);
            setAvailableTimes(datesList[0].times);
        }
    };

    const formatDate = (date) => {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const formatTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const handleDateSelect = (dateString) => {
        setAppointmentDate(dateString);
        setAppointmentTime("");
        // Find the selected date object from availableDates
        const selectedDateObj = availableDates.find(d => d.date === dateString);
        if (selectedDateObj) {
            setAvailableTimes(selectedDateObj.times);
        } else {
            setAvailableTimes([]);
        }
        setErrors(prev => ({ ...prev, appointmentDate: "", appointmentTime: "" }));
    };

    const handleTimeSelect = (time) => {
        setAppointmentTime(time);
        setErrors(prev => ({ ...prev, appointmentTime: "" }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'email') {
            setEmail(value);
            setErrors(prev => ({ ...prev, email: "" }));
        } else if (name === 'appointmentReason') {
            setAppointmentReason(value);
            setErrors(prev => ({ ...prev, appointmentReason: "" }));
        }
    };

    const handleReviewInformation = (e) => {
        e.preventDefault();
        const { filled, max } = getSlotInfoForDate(appointmentDate, appointmentTime);
        if (max > 0 && filled >= max) {
            toast.error('This slot is already full. Please choose another time.');
            setErrors(prev => ({ ...prev, appointmentTime: '' }));
            return;
        }

        // Proceed with review or next step
        // setBookingSuccess(true);
        toast.success('Slot is available! Proceeding to next step...');
    };

    if (bookingSuccess) {
        return (
            <div className="appointment-main-container">
                <div className="appointment-success-wrapper">
                    <div className="appointment-success-card">
                        <div className="appointment-success-checkmark">✓</div>
                        <h1 className="appointment-success-heading">Appointment Booked Successfully!</h1>
                        <p>You will receive an appointment confirmation email at {email}.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="appointment-main-container">
            <ToastContainer />
            <form onSubmit={handleReviewInformation}>
                <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="appointmentReason"
                    placeholder="Reason for appointment"
                    value={appointmentReason}
                    onChange={handleInputChange}
                />

                <div className="date-selector">
                    {availableDates.map(({ date, formattedDate }) => (
                        <button
                            key={date}
                            type="button"
                            className={appointmentDate === date ? "selected" : ""}
                            onClick={() => handleDateSelect(date)}
                        >
                            {formattedDate}
                        </button>
                    ))}
                </div>

                <div className="time-selector">
                    {availableTimes.map(({ time, filled, max }) => (
                        <button
                            key={time}
                            type="button"
                            className={appointmentTime === time ? "selected" : ""}
                            disabled={filled >= max}
                            onClick={() => handleTimeSelect(time)}
                        >
                            {formatTime(time)} ({filled}/{max})
                        </button>
                    ))}
                </div>

                {/* Only show the Review Appointment button if not embedded */}
                {!embedded && (
                    <button type="submit">Review Appointment</button>
                )}
            </form>
        </div>
    );
}

export default Appointment;
