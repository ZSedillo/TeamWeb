import React, { useEffect, useState } from 'react';
import Header from '../Component/Header';
import Footer from '../Component/Footer';
import './Pre-registration.css';

function ConfirmRegistration() {
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        const storedData = sessionStorage.getItem('preRegFormData');
        if (storedData) {
            setFormData(JSON.parse(storedData));
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
    
        console.log("Raw Date of Birth from formData:", formData.dateOfBirth); // Check raw input
    
        const gradeLevel = formData.yearLevel;
        const isSeniorHigh = gradeLevel === "11" || gradeLevel === "12";
    
        const preRegistrationData = {
            name: `${formData.lastName} ${formData.firstName}`,
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
            status: "pending"
        };
        console.log("Pre-registration data to be sent:", preRegistrationData);
        try {
            const response = await fetch("https://teamweb-kera.onrender.com/preregistration/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(preRegistrationData),
            });
    
            const result = await response.json();
    
            if (response.ok) {
                sessionStorage.setItem("registrationSuccess", "true");
                sessionStorage.removeItem("preRegFormData");
                window.location.href = "/success";
            } else {
                alert(`Error: ${result.error || "Something went wrong"}`);
            }
        } catch (error) {
            console.error("Error submitting registration:", error);
            alert("Failed to submit registration. Please try again.");
        }
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
                        <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                        <p><strong>Date of Birth:</strong> {formData.dateOfBirth}</p>
                        <p><strong>Gender:</strong> {formData.gender}</p>
                        <p><strong>Nationality:</strong> {formData.nationality}</p>
                        <p><strong>Email:</strong> {formData.email}</p>
                        <p><strong>Mobile Number:</strong> {formData.mobileNumber}</p>
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