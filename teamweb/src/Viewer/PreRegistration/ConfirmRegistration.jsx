import React, { useState, useEffect } from 'react';
import Header from '../Component/Header';
import Footer from '../Component/Footer';
import './Pre-registration.css';

function ConfirmRegistration() {
    const [formData, setFormData] = useState(null);
    const [appointmentData, setAppointmentData] = useState(null);

    useEffect(() => {
        const storedData = sessionStorage.getItem('preRegFormData');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            setFormData(parsedData);
            
            // Check if the user has selected to book an appointment
            if (parsedData.needsAppointment === "yes") {
                // Look for appointment data in sessionStorage
                const storedAppointmentData = sessionStorage.getItem('appointmentData');
                if (storedAppointmentData) {
                    setAppointmentData(JSON.parse(storedAppointmentData));
                }
            }
        } else {
            window.location.href = '/preregistration';
        }
    }, []);

    const handleEdit = (e) => {
        e.preventDefault();
        // Keep the data in sessionStorage when going back to edit
        window.location.href = '/preregistration?edit=true';
    };

const handleConfirm = async () => {
    if (!formData) return;

    console.log("Raw Date of Birth from formData:", formData.dateOfBirth);

    const gradeLevel = formData.yearLevel;
    const isSeniorHigh = gradeLevel === "11" || gradeLevel === "12";
    const currentYear = new Date().getFullYear().toString();

    const preRegistrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone_number: formData.mobileNumber,
        age: new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear(),
        birthdate: new Date(formData.dateOfBirth).toISOString(),
        gender: formData.gender,
        grade_level: gradeLevel,
        strand: isSeniorHigh ? formData.strand || "" : "",
        email: formData.email,
        nationality: formData.nationality,
        parent_guardian_name: `${formData.parentFirstName} ${formData.parentLastName}`,
        parent_guardian_number: formData.parentMobileNumber,
        isNewStudent: formData.isNewStudent?.toLowerCase() === "new" ? "new" : "old",
        status: "pending",
        address: formData.address || "", // Ensure address is included and has a default value
        registration_year: currentYear, // Add the registration year
    };
    
    console.log("Pre-registration data to be sent:", preRegistrationData);
    
    try {
        // First, submit the pre-registration data
        const response = await fetch("https://teamweb-kera.onrender.com/preregistration/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(preRegistrationData),
        });

        const result = await response.json();

        if (response.ok) {
            // If appointment data exists, also submit that
            if (appointmentData && formData.needsAppointment === "yes") {
                try {
                    console.log("Submitting appointment data:", {
                        email: formData.email,
                        appointment_date: appointmentData.date,
                        preferred_time: appointmentData.time,
                        purpose_of_visit: appointmentData.purpose
                    });
                    
                    const bookingResponse = await fetch('https://teamweb-kera.onrender.com/preregistration/addBooking', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: formData.email,
                            appointment_date: appointmentData.date,
                            preferred_time: appointmentData.time,
                            purpose_of_visit: appointmentData.purpose,
                        }),
                    });
                    
                    if (!bookingResponse.ok) {
                        const bookingResult = await bookingResponse.json();
                        console.error("Booking error:", bookingResult.error);
                        // Continue to success page even if booking fails
                    }
                } catch (bookingError) {
                    console.error("Error submitting appointment:", bookingError);
                    // Continue to success page even if booking fails
                }
            }
            
            // Clear data and redirect to success page
            sessionStorage.setItem("registrationSuccess", "true");
            sessionStorage.removeItem("preRegFormData");
            sessionStorage.removeItem("appointmentData");
            window.location.href = "/success";
        } else {
            alert(`Error: ${result.error || "Something went wrong"}`);
        }
    } catch (error) {
        console.error("Error submitting registration:", error);
        alert("Failed to submit registration. Please try again.");
    }
};
    
    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    // Format time for display
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    if (!formData) return null;

    return (
        <>
            <Header />
            <div className="pre-reg-confirm-container">
                <h2 className="pre-reg-confirm-title">Review Your Information</h2>
                
                {/* Personal Information Section */}
                <div className="pre-reg-confirm-section">
                    <h3>Personal Information</h3>
                    <div className="pre-reg-confirm-grid">
                        <p><strong>Name:</strong> {formData.lastName}, {formData.firstName}</p>
                        <p><strong>Date of Birth:</strong> {formatDate(formData.dateOfBirth)}</p>
                        <p><strong>Gender:</strong> {formData.gender}</p>
                        <p><strong>Nationality:</strong> {formData.nationality}</p>
                        <p><strong>Email:</strong> {formData.email}</p>
                        <p><strong>Mobile Number:</strong> {formData.mobileNumber}</p>
                        <p><strong>Address:</strong> {formData.address || "Not provided"}</p>
                    </div>
                </div>

                {/* Academic Information Section */}
                <div className="pre-reg-confirm-section">
                    <h3>Academic Information</h3>
                    <div className="pre-reg-confirm-grid">
                        <p><strong>Student Status:</strong> {formData.isNewStudent === 'new' ? 'New Student' : 'Old Student'}</p>
                        <p><strong>Grade Level:</strong> {formData.yearLevel}</p>
                        {(formData.yearLevel === "11" || formData.yearLevel === "12") && formData.strand && (
                            <p><strong>Strand:</strong> {formData.strand}</p>
                        )}
                    </div>
                </div>

                {/* Parent/Guardian Information Section */}
                <div className="pre-reg-confirm-section">
                    <h3>Parent/Guardian Information</h3>
                    <div className="pre-reg-confirm-grid">
                        <p><strong>Name:</strong> {formData.parentFirstName} {formData.parentLastName}</p>
                        <p><strong>Mobile Number:</strong> {formData.parentMobileNumber}</p>
                    </div>
                </div>

                {/* Appointment Information Section (if applicable) */}
                {formData.needsAppointment === "yes" && appointmentData && (
                    <div className="pre-reg-confirm-section">
                        <h3>Appointment Details</h3>
                        <div className="pre-reg-confirm-grid">
                            <p><strong>Date:</strong> {formatDate(appointmentData.date)}</p>
                            <p><strong>Time:</strong> {formatTime(appointmentData.time)}</p>
                            <p><strong>Purpose:</strong> {appointmentData.purpose}</p>
                        </div>
                    </div>
                )}

                <div className="pre-reg-confirm-buttons">
                    <button 
                        onClick={handleEdit}
                        className="pre-reg-edit-btn"
                    >
                        Edit Information
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className="pre-reg-confirm-btn"
                    >
                        Confirm & Submit
                    </button>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default ConfirmRegistration;