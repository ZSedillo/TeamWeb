import React, { useState, useEffect } from "react";
import Header from '../Component/Header.jsx';
import Footer from '../Component/Footer.jsx';
import Appointment from './Appointment';
import './Pre-registration.css';

function PreRegistration() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        nationality: "",
        email: "",
        mobileNumber: "",
        isNewStudent: "",
        parentFirstName: "",
        parentLastName: "",
        parentMobileNumber: "",
        yearLevel: "",
        strand: "",
    });
    const [formErrors, setFormErrors] = useState({});
    const [progress, setProgress] = useState(0);
    const [activeTab, setActiveTab] = useState('pre-reg');

    useEffect(() => {
        const storedData = sessionStorage.getItem('preRegFormData');
        if (storedData) {
            setFormData(JSON.parse(storedData));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: name === 'mobileNumber' || name === 'parentMobileNumber' 
                ? value.replace(/\D/g, '') 
                : value
        }));
        setFormErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validateForm = (data) => {
        const errors = {};
        const requiredFields = [
            'firstName', 'lastName', 'dateOfBirth', 'gender', 'nationality', 
            'email', 'mobileNumber', 'isNewStudent', 'parentFirstName', 
            'parentLastName', 'parentMobileNumber', 'yearLevel'
        ];

        requiredFields.forEach(field => {
            if (!data[field]?.trim()) {
                errors[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
            }
        });

        if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
            errors.email = "Email is invalid";
        }

        if ((data.yearLevel === '11' || data.yearLevel === '12') && !data.strand) {
            errors.strand = "Strand is required for Senior High School students";
        }

        return errors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errors = validateForm(formData);
        
        if (Object.keys(errors).length === 0) {
            sessionStorage.setItem('preRegFormData', JSON.stringify(formData));
            window.location.href = '/confirmregistration';
        } else {
            setFormErrors(errors);
        }
    };

    useEffect(() => {
        const totalFields = formData.yearLevel === '11' || formData.yearLevel === '12' ? 13 : 12;
        const filledFields = Object.entries(formData).filter(([key, value]) => 
            value !== "" && 
            (key !== 'strand' || ['11', '12'].includes(formData.yearLevel))
        ).length;

        setProgress(Math.min((filledFields / totalFields) * 100, 100));
    }, [formData]);

    const renderForm = () => (
        <div className="pre-reg-form-container">
            <div className="pre-reg-title">Personal Information</div>
            <form onSubmit={handleSubmit}>
                <div className="pre-reg-form-grid">
                    <div className="pre-reg-form-group">
                        <label htmlFor="firstName">
                            FIRST NAME <span className="pre-reg-required">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="firstName" 
                            name="firstName" 
                            value={formData.firstName} 
                            onChange={handleChange} 
                            className="pre-reg-input" 
                        />
                        {formErrors.firstName && <div className="error">{formErrors.firstName}</div>}
                    </div>

                    <div className="pre-reg-form-group">
                        <label htmlFor="lastName">
                            LAST NAME <span className="pre-reg-required">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="lastName" 
                            name="lastName" 
                            value={formData.lastName} 
                            onChange={handleChange} 
                            className="pre-reg-input" 
                        />
                        {formErrors.lastName && <div className="error">{formErrors.lastName}</div>}
                    </div>

                    <div className="pre-reg-form-group">
                        <label htmlFor="dateOfBirth">
                            DATE OF BIRTH <span className="pre-reg-required">*</span>
                        </label>
                        <input 
                            type="date" 
                            id="dateOfBirth" 
                            name="dateOfBirth" 
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            max={new Date().toISOString().split('T')[0]}
                            className="pre-reg-input"
                        />
                        {formErrors.dateOfBirth && <div className="error">{formErrors.dateOfBirth}</div>}
                    </div>

                    <div className="pre-reg-form-group">
                        <label htmlFor="gender">
                            GENDER <span className="pre-reg-required">*</span>
                        </label>
                        <select 
                            id="gender" 
                            name="gender" 
                            value={formData.gender} 
                            onChange={handleChange}
                            className="pre-reg-input"
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        {formErrors.gender && <div className="error">{formErrors.gender}</div>}
                    </div>

                    <div className="pre-reg-form-group">
                        <label htmlFor="nationality">
                            NATIONALITY <span className="pre-reg-required">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="nationality" 
                            name="nationality" 
                            value={formData.nationality} 
                            onChange={handleChange} 
                            className="pre-reg-input" 
                        />
                        {formErrors.nationality && <div className="error">{formErrors.nationality}</div>}
                    </div>

                    <div className="pre-reg-form-group">
                        <label htmlFor="email">
                            EMAIL <span className="pre-reg-required">*</span>
                        </label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            className="pre-reg-input" 
                        />
                        {formErrors.email && <div className="error">{formErrors.email}</div>}
                    </div>

                    <div className="pre-reg-form-group">
                        <label htmlFor="mobileNumber">
                            MOBILE NUMBER <span className="pre-reg-required">*</span>
                        </label>
                        <input 
                            type="tel" 
                            id="mobileNumber" 
                            name="mobileNumber" 
                            value={formData.mobileNumber}
                            onChange={handleChange}
                            maxLength="11"
                            placeholder="Enter numbers only"
                            className="pre-reg-input" 
                        />
                        {formErrors.mobileNumber && <div className="error">{formErrors.mobileNumber}</div>}
                    </div>

                    <div className="pre-reg-form-group">
                        <label htmlFor="isNewStudent">
                            ARE YOU A NEW OR OLD STUDENT? <span className="pre-reg-required">*</span>
                        </label>
                        <div className="pre-reg-radio-group">
                            <label className="pre-reg-radio-label">
                                <input 
                                    type="radio" 
                                    name="isNewStudent" 
                                    value="new" 
                                    checked={formData.isNewStudent === "new"} 
                                    onChange={handleChange} 
                                    className="pre-reg-radio-input"
                                />
                                <span className="pre-reg-radio-text">NEW</span>
                            </label>
                            <label className="pre-reg-radio-label">
                                <input 
                                    type="radio" 
                                    name="isNewStudent" 
                                    value="old" 
                                    checked={formData.isNewStudent === "old"} 
                                    onChange={handleChange} 
                                    className="pre-reg-radio-input"
                                />
                                <span className="pre-reg-radio-text">OLD</span>
                            </label>
                        </div>
                        {formErrors.isNewStudent && <div className="error">{formErrors.isNewStudent}</div>}
                    </div>

                    <div className="pre-reg-form-group">
                        <label htmlFor="yearLevel">
                            GRADE LEVEL <span className="pre-reg-required">*</span>
                        </label>
                        <select
                            id="yearLevel"
                            name="yearLevel"
                            value={formData.yearLevel}
                            onChange={handleChange}
                            className="pre-reg-select"
                        >
                            <option value="">Select Grade Level</option>
                            <option value="Kinder">Kinder</option>
                            <option value="1">Grade 1</option>
                            <option value="2">Grade 2</option>
                            <option value="3">Grade 3</option>
                            <option value="4">Grade 4</option>
                            <option value="5">Grade 5</option>
                            <option value="6">Grade 6</option>
                            <option value="7">Grade 7</option>
                            <option value="8">Grade 8</option>
                            <option value="9">Grade 9</option>
                            <option value="10">Grade 10</option>
                            <option value="11">Grade 11</option>
                            <option value="12">Grade 12</option>
                        </select>
                        {formErrors.yearLevel && <div className="error">{formErrors.yearLevel}</div>}
                    </div>

                    {(formData.yearLevel === '11' || formData.yearLevel === '12') && (
                        <div className="pre-reg-form-group">
                            <label htmlFor="strand">
                                STRAND <span className="pre-reg-required">*</span>
                            </label>
                            <select
                                id="strand"
                                name="strand"
                                value={formData.strand}
                                onChange={handleChange}
                                className="pre-reg-select"
                            >
                                <option value="">Select Strand</option>
                                <option value="ABM">ABM (Accountancy, Business and Management)</option>
                                <option value="STEM">STEM (Science, Technology, Engineering and Mathematics)</option>
                                <option value="HUMSS">HUMSS (Humanities and Social Sciences)</option>
                            </select>
                            {formErrors.strand && <div className="error">{formErrors.strand}</div>}
                        </div>
                    )}

                    <div className="pre-reg-form-group">
                        <label htmlFor="parentFirstName">
                            PARENT/GUARDIAN FIRST NAME <span className="pre-reg-required">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="parentFirstName" 
                            name="parentFirstName" 
                            value={formData.parentFirstName} 
                            onChange={handleChange} 
                            className="pre-reg-input" 
                        />
                        {formErrors.parentFirstName && <div className="error">{formErrors.parentFirstName}</div>}
                    </div>

                    <div className="pre-reg-form-group">
                        <label htmlFor="parentLastName">
                            PARENT/GUARDIAN LAST NAME <span className="pre-reg-required">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="parentLastName" 
                            name="parentLastName" 
                            value={formData.parentLastName} 
                            onChange={handleChange} 
                            className="pre-reg-input" 
                        />
                        {formErrors.parentLastName && <div className="error">{formErrors.parentLastName}</div>}
                    </div>

                    <div className="pre-reg-form-group">
                        <label htmlFor="parentMobileNumber">
                            PARENT/GUARDIAN MOBILE NUMBER <span className="pre-reg-required">*</span>
                        </label>
                        <input 
                            type="tel" 
                            id="parentMobileNumber" 
                            name="parentMobileNumber" 
                            value={formData.parentMobileNumber}
                            onChange={handleChange}
                            maxLength="11"
                            placeholder="Enter numbers only"
                            className="pre-reg-input" 
                        />
                        {formErrors.parentMobileNumber && <div className="error">{formErrors.parentMobileNumber}</div>}
                    </div>
                </div>
                <button className="pre-reg-submit-btn" type="submit">
                    Review Information
                </button>
            </form>
        </div>
    );

    return (
        <>
            <Header />
            <div className="pre-reg-main-container">
                <div className="pre-reg-tabs">
                    <button 
                        className={`pre-reg-tab ${activeTab === 'pre-reg' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pre-reg')}
                    >
                        Pre-Registration
                    </button>
                    <button 
                        className={`pre-reg-tab ${activeTab === 'appointment' ? 'active' : ''}`}
                        onClick={() => setActiveTab('appointment')}
                    >
                        Book Appointment
                    </button>
                </div>

                {activeTab === 'pre-reg' ? (
                    <div className="pre-reg-container">
                        <div className="pre-reg-progress-bar">
                            <div
                                className="pre-reg-progress"
                                style={{ width: `${progress}%` }}
                                aria-valuenow={progress}
                                aria-valuemin="0"
                                aria-valuemax="100"
                            ></div>
                        </div>
                        <div className="pre-reg-progress-percentage">
                            {progress.toFixed(0)}%
                        </div>

                        {renderForm()}
                    </div>
                ) : (
                    <Appointment />
                )}
            </div>
            <Footer />
        </>
    );
}

export default PreRegistration;