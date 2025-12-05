import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminHeader from '../Component/AdminHeader.jsx';
// import UpdateAppointment from './UpdateAppointment';
import ViewReports from './ViewReports';
import {MapPin, Search, Filter, User, Calendar, Phone, Mail, Clock, CheckCircle, AlertCircle, Send, ChartBar, Trash2, ChevronDown } from 'lucide-react';
import ExpectedStudents from './ExpectedStudents';
import EnrolledStudents from './EnrolledStudents';

import './ManagePreRegistration.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Redux actions
import {
    fetchPreRegistrations,
    updatePreRegistrationStatus,
    updatePreRegistrationEnrollment,
    deletePreRegistration,
    deleteAllPreRegistrations
} from '../../_actions/preRegistration.actions';

function ManagePreRegistration() {
    const dispatch = useDispatch();
    
    // 1. Get Pre-Registration State
    const { 
        loading, 
        preRegistrations, 
        totalPages: reduxTotalPages, 
        totalRecords: reduxTotalRecords,
        error: reduxError 
    } = useSelector(state => state.preRegistration);

    // 2. Get User State
    const { user } = useSelector(state => state.user);
    const currentUsername = user?.username || "Admin";

    // Local UI state
    const [processingStatus, setProcessingStatus] = useState(null);
    const [processingEnrollment, setProcessingEnrollment] = useState(null);
    const [showEnrollmentConfirmation, setShowEnrollmentConfirmation] = useState(false);
    const [studentToEnroll, setStudentToEnroll] = useState(null);
    
    // Confirmation dialog states
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [studentToUpdate, setStudentToUpdate] = useState(null);
    
    // Pagination states (client-side)
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Filter and search states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedGrade, setSelectedGrade] = useState("");
    const [selectedStrand, setSelectedStrand] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [expandedRow, setExpandedRow] = useState(null);
    
    // UI state
    const [activeTab, setActiveTab] = useState('table');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const [showDeleteConfirmationDialog, setShowDeleteConfirmationDialog] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);

    const currentYear = new Date().getFullYear().toString();
    const startYear = 2020;

    const yearOptions = [];
    for (let year = currentYear; year >= startYear; year--) {
        yearOptions.push(year.toString());
    }

    // Client-side pagination calculations
    const students = useMemo(() => {
        const startIdx = (currentPage - 1) * limit;
        const endIdx = startIdx + limit;
        return (preRegistrations || []).slice(startIdx, endIdx);
    }, [preRegistrations, currentPage, limit]);

    const totalPages = Math.ceil((preRegistrations?.length || 0) / limit);
    const totalRecords = preRegistrations?.length || 0;

    const tabs = [
        { id: "table", label: "Student Records", icon: <User size={16} /> },
        { id: "reports", label: "Reports", icon: <ChartBar size={16} /> },
        { id: "expected", label: "Expected Students", icon: <CheckCircle size={16} /> },
        { id: "enrolled", label: "Enrolled Students", icon: <User size={16} /> }
    ];

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setIsDropdownOpen(false);
    };

    const getActiveTabData = () => {
        return tabs.find(tab => tab.id === activeTab);
    };

    // --- Delete All Logic ---
    const handleDeleteAllPreRegistrations = async () => {
        if (deleteConfirmText !== 'Confirm') {
            toast.error('Please type "Confirm" to proceed with deletion', {
                position: "top-center",
                autoClose: 3000,
            });
            return;
        }

        try {
            setIsDeleting(true);
            await dispatch(deleteAllPreRegistrations(currentUsername));

            toast.success(
                <div>
                    <p><strong>Deletion Successful</strong></p>
                    <p>All pre-registration records have been deleted</p>
                </div>,
                { position: "top-center", autoClose: 5000 }
            );

            setShowDeleteConfirmation(false);
            setDeleteConfirmText('');
        } catch (err) {
            console.error('Failed to delete records:', err);
            toast.error('Failed to delete records. Please try again.', {
                position: "top-center",
                autoClose: 5000,
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Format Date Helper ---
    const formatLocalDate = (dateString, incrementDay = false) => {
        if (!dateString) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            let [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    // --- Fetch Effect ---
    useEffect(() => {
        const queryParams = {};
        
        if (searchTerm) {
            queryParams.search = searchTerm.trim();
            queryParams.name = searchTerm.trim();
        }
        queryParams.registration_year = selectedYear || currentYear;
        if (selectedGrade) queryParams.grade = selectedGrade;
        if (selectedStrand) queryParams.strand = selectedStrand;
        if (selectedType) queryParams.type = selectedType;
        queryParams.limit = 10000; // Fetch all for client-side pagination

        dispatch(fetchPreRegistrations(queryParams));
    }, [dispatch, searchTerm, selectedYear, selectedGrade, selectedStrand, selectedType]);

    // --- Mobile Resize Effect ---
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // --- Handlers ---
    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleYearChange = (e) => {
        setSelectedYear(e.target.value);
        setCurrentPage(1);
    };

    const handleGradeChange = (e) => {
        setSelectedGrade(e.target.value);
        setCurrentPage(1);
    };

    const handleStrandChange = (e) => {
        setSelectedStrand(e.target.value);
        setCurrentPage(1);
    };

    const handleTypeChange = (e) => {
        setSelectedType(e.target.value);
        setCurrentPage(1);
    };

    const confirmStatusChange = (studentId, currentStatus) => {
        const student = students.find(s => s._id === studentId);
        setStudentToUpdate({
            id: studentId,
            currentStatus: currentStatus,
            name: `${student?.firstName} ${student?.lastName}` || "this student"
        });
        setShowConfirmation(true);
    };
    
    const cancelStatusChange = () => {
        setShowConfirmation(false);
        setStudentToUpdate(null);
    };

    const handleStatusChange = async () => {
        try {
            if (!studentToUpdate) return;
            
            setShowConfirmation(false);
            setProcessingStatus(studentToUpdate.id);
            
            const newStatus = studentToUpdate.currentStatus === "approved" ? "pending" : "approved";
            
            await dispatch(updatePreRegistrationStatus(
                studentToUpdate.id, 
                newStatus, 
                studentToUpdate.name, 
                currentUsername 
            ));

            if (newStatus === "approved") {
                const student = students.find(s => s._id === studentToUpdate.id);
                if (student) {
                    toast.success(
                        <div>
                            <p><strong>Approval email sent</strong></p>
                            <p>Notification sent to {student.email}</p>
                        </div>, 
                        { icon: <Send size={16} />, position: "top-center", autoClose: 5000 }
                    );
                }
            }
            
            toast.success(
                <div>
                    <p><strong>Status Updated</strong></p>
                    <p>Student status changed to {newStatus}</p>
                </div>,
                { icon: <CheckCircle size={16} />, position: "top-center", autoClose: 3000 }
            );
            
        } catch (err) {
            console.error('Failed to update status:', err);
            toast.error('Failed to update status. Please try again.', {
                position: "top-center",
                autoClose: 5000,
            });
        } finally {
            setProcessingStatus(null);
            setStudentToUpdate(null);
        }
    };

    const confirmEnrollmentChange = (studentId, currentEnrollmentStatus) => {
        const student = students.find(s => s._id === studentId);
        
        setStudentToEnroll({
            id: studentId,
            enrollment: currentEnrollmentStatus,
            name: `${student?.firstName} ${student?.lastName}` || "this student"
        });
    
        setShowEnrollmentConfirmation(true);
    };

    const handleEnrollmentChange = async () => {
        try {
            if (!studentToEnroll) return;

            setShowEnrollmentConfirmation(false);
            setProcessingEnrollment(studentToEnroll.id);

            const newEnrollmentStatus = !studentToEnroll.enrollment;

            await dispatch(updatePreRegistrationEnrollment(
                studentToEnroll.id,
                newEnrollmentStatus,
                studentToEnroll.name,
                currentUsername 
            ));

            toast.success(
                <div>
                    <p><strong>Enrollment Status Updated</strong></p>
                    <p>Student enrollment status is now {newEnrollmentStatus ? "Enrolled" : "Not Enrolled"}</p>
                </div>,
                { icon: <CheckCircle size={16} />, position: "top-center", autoClose: 3000 }
            );

        } catch (err) {
            console.error('Failed to update enrollment status:', err);
            toast.error('Failed to update enrollment status. Please try again.', {
                position: "top-center",
                autoClose: 5000,
            });
        } finally {
            setProcessingEnrollment(null);
            setStudentToEnroll(null);
        }
    };

    const toggleRow = (index) => {
        setExpandedRow(expandedRow === index ? null : index);
    };
    
    const getActiveFiltersText = () => {
        const filters = [];
        
        if (searchTerm) filters.push(`Name: "${searchTerm}"`);
        if (selectedYear) filters.push(`Year: ${selectedYear}`);
        if (selectedGrade) filters.push(`Grade: ${selectedGrade}`);
        if (selectedStrand) filters.push(`Strand: ${selectedStrand}`);
        if (selectedType) filters.push(`Type: ${selectedType}`);
        
        return filters.length > 0 
            ? `Filtered by: ${filters.join(', ')}` 
            : 'Showing all records';
    };
    
    const handleDeleteStudent = (studentId, studentName) => {
        setStudentToDelete({ id: studentId, name: studentName });
        setShowDeleteConfirmationDialog(true);
    };

    function capitalizeFullName(name, isLastName = false) {
        if (!name) return '';
        if (isLastName) return name.toUpperCase();
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // --- Dialog Components (Defined HERE to avoid ReferenceError) ---

    // 1. Delete All Dialog
    const DeleteConfirmationDialog = () => {
        if (!showDeleteConfirmation) return null;
        
        const isConfirmTextValid = deleteConfirmText === 'Confirm';
        const confirmProgress = Math.min(deleteConfirmText.length, 7) / 7;
        
        return (
            <div className="confirmation-overlay">
                <div className="confirmation-dialog">
                    <div className="confirmation-header">
                        <h3>Confirm Deletion</h3>
                    </div>
                    <div className="confirmation-content">
                        <p><strong>Warning:</strong> You are about to delete ALL pre-registration records.</p>
                        <p>This action cannot be undone.</p>
                        <p>Type <strong>Confirm</strong> below to proceed:</p>
                        <div className="confirm-input-container">
                            <input
                                type="text"
                                className={`confirm-input ${isConfirmTextValid ? 'valid' : deleteConfirmText.length > 0 ? 'in-progress' : ''}`}
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="Type 'Confirm' here"
                                autoFocus
                            />
                            {deleteConfirmText.length > 0 && !isConfirmTextValid && (
                                <div className="confirmation-progress">
                                    <div className="progress-bar" style={{ width: `${confirmProgress * 100}%` }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="confirmation-actions">
                        <button className="btn-cancel" onClick={() => {setShowDeleteConfirmation(false); setDeleteConfirmText('');}}>Cancel</button>
                        <button className={`btn-confirm delete ${isConfirmTextValid ? 'ready' : 'disabled'}`} onClick={handleDeleteAllPreRegistrations} disabled={!isConfirmTextValid || isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete All Records'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // 2. Status Change Dialog (THIS WAS MISSING)
    const ConfirmationDialog = () => {
        if (!showConfirmation) return null;
        
        const newStatus = studentToUpdate?.currentStatus === "approved" ? "Pending" : "Approved";
        const actionText = studentToUpdate?.currentStatus === "approved" ? "change to Pending" : "approve";
        
        return (
            <div className="confirmation-overlay">
                <div className="confirmation-dialog">
                    <div className="confirmation-header">
                        <h3>Confirm Status Change</h3>
                    </div>
                    <div className="confirmation-content">
                        <p>Are you sure you want to {actionText} the status for <strong>{studentToUpdate?.name}</strong>?</p>
                        {studentToUpdate?.currentStatus !== "approved" && (
                            <p>This will send an approval notification email to the student.</p>
                        )}
                    </div>
                    <div className="confirmation-actions">
                        <button className="btn-cancel" onClick={cancelStatusChange}>
                            Cancel
                        </button>
                        <button 
                            className={`btn-confirm ${studentToUpdate?.currentStatus === "approved" ? "pending" : "approved"}`}
                            onClick={handleStatusChange}
                        >
                            {studentToUpdate?.currentStatus === "approved" ? 
                                "Yes, Change to Pending" : 
                                "Yes, Approve Student"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // 3. Delete Single Student Dialog
    const DeleteStudentDialog = () => {
        if (!showDeleteConfirmationDialog || !studentToDelete) return null;
        
        const confirmDelete = async () => {
            try {
                await dispatch(deletePreRegistration(studentToDelete.id, studentToDelete.name, currentUsername));
                setShowDeleteConfirmationDialog(false);
                setStudentToDelete(null);
                toast.success(<div><p><strong>Record Deleted</strong></p><p>Successfully deleted {studentToDelete.name}'s record</p></div>, { position: "top-center", autoClose: 3000 });
            } catch (err) {
                console.error('Failed to delete record:', err);
                toast.error('Failed to delete record.', { position: "top-center", autoClose: 5000 });
                setShowDeleteConfirmationDialog(false);
                setStudentToDelete(null);
            }
        };

        return (
            <div className="confirmation-overlay">
                <div className="confirmation-dialog">
                    <div className="confirmation-header"><h3>Confirm Delete</h3></div>
                    <div className="confirmation-content"><p>Are you sure you want to delete the record for <strong>{studentToDelete.name}</strong>?</p><p>This action cannot be undone.</p></div>
                    <div className="confirmation-actions">
                        <button className="btn-cancel" onClick={() => {setShowDeleteConfirmationDialog(false); setStudentToDelete(null);}}>Cancel</button>
                        <button className="btn-confirm delete" onClick={confirmDelete}><Trash2 size={14} /> Delete Record</button>
                    </div>
                </div>
            </div>
        );
    };

    // 4. Enrollment Dialog
    const EnrollmentConfirmationDialog = () => {
        if (!showEnrollmentConfirmation) return null;
        const isEnrolled = studentToEnroll?.enrollment === true;
        const actionText = isEnrolled ? "Mark as not Enrolled" : "Enroll";
        return (
            <div className="confirmation-overlay">
                <div className="confirmation-dialog">
                    <div className="confirmation-header"><h3>Confirm Enrollment Change</h3></div>
                    <div className="confirmation-content"><p>Are you sure you want to {actionText} <strong>{studentToEnroll?.name}</strong>?</p></div>
                    <div className="confirmation-actions">
                        <button className="btn-cancel" onClick={() => {setShowEnrollmentConfirmation(false); setStudentToEnroll(null);}}>Cancel</button>
                        <button className={`btn-enrollment-confirm ${isEnrolled ? 'false' : 'true'}`} onClick={handleEnrollmentChange}>
                            {isEnrolled ? "Mark as Not Enrolled" : "Mark as Enrolled"}
                        </button>
                    </div>
                </div>
            </div>
        );  
    };

    const renderTable = () => {
        if (loading) return <div className="loading-state"><div className="loading-spinner"></div><p>Loading student data...</p></div>;
        if (reduxError) return <div className="error-state"><AlertCircle size={24} /><p>{reduxError}</p></div>;
        if (students.length === 0) return <div className="empty-state"><User size={48} /><h3>No Records Found</h3><p>No student registration records match your filter criteria.</p></div>;

        return (
            <div className="data-table-container">
                <div className="active-filters">
                    <span>{getActiveFiltersText()}</span>
                    {(searchTerm || selectedYear || selectedGrade || selectedStrand || selectedType) && (
                        <button className="clear-filters-btn" onClick={() => {
                            setSearchTerm(""); setSelectedYear(""); setSelectedGrade(""); setSelectedStrand(""); setSelectedType(""); setCurrentPage(1);
                        }}>Clear Filters</button>
                    )}
                </div>
                
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student Name</th><th>Gender</th><th>Type</th><th>Date of Birth</th><th>Age</th><th>Grade Level</th><th>Strand</th><th>Email Address</th><th>Address</th><th>Phone Number</th><th>Details</th><th>Status</th><th>Enrollment</th><th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => {
                                const birthDate = new Date(student.birthdate);
                                const age = new Date().getFullYear() - birthDate.getFullYear();
                                return (
                                    <React.Fragment key={student._id || index}>
                                        <tr id={`student-row-${student._id}`} className={expandedRow === index ? 'row-expanded' : ''}>
                                            <td className="cell-name">{capitalizeFullName(student.lastName, true)}, {capitalizeFullName(student.firstName)}</td>
                                            <td className="cell-center">{student.gender}</td>
                                            <td className="cell-center">{student.isNewStudent}</td>
                                            <td className="cell-center">{birthDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</td>
                                            <td className="cell-center">{age}</td>
                                            <td className="cell-center">{student.grade_level}</td>
                                            <td className="cell-center">{student.strand || "N/A"}</td>
                                            <td className="cell-email"><div className="email-container"><Mail size={14} /><span>{student.email}</span></div></td>
                                            <td className="cell-address"><div className="address-container"><MapPin size={14} /><span>{student.address}</span></div></td>
                                            <td className="cell-phone"><div className="phone-container"><Phone size={14} /><span>{student.phone_number}</span></div></td>
                                            <td className="cell-action"><button className="btn-details" onClick={() => toggleRow(index)}><Clock size={14} /> {expandedRow === index ? 'Hide' : 'View'}</button></td>
                                            <td className="cell-status">
                                                <button className={`btn-status ${processingStatus === student._id ? 'processing' : student.status?.toLowerCase() || 'pending'}`} onClick={() => confirmStatusChange(student._id, student.status)} disabled={processingStatus === student._id}>
                                                    {processingStatus === student._id ? <><span className="status-loading"></span>Processing...</> : student.status === "approved" ? <><CheckCircle size={14} /> Approved</> : <><AlertCircle size={14} /> Pending</>}
                                                </button>
                                            </td>
                                            <td className="cell-status">
                                                <button className={`btn-enrollment ${processingEnrollment === student._id ? 'processing' : student.enrollment === true ? true : false}`} onClick={() => confirmEnrollmentChange(student._id, student.enrollment)} disabled={processingEnrollment === student._id}>
                                                    {processingEnrollment === student._id ? <><span className="status-loading"></span>Processing...</> : student.enrollment === true ? <><CheckCircle size={14} /> Enrolled</> : <><AlertCircle size={14} /> Not Enrolled</>}
                                                </button>
                                            </td>
                                            <td className="cell-action">
                                                <button className="btn-delete" onClick={() => handleDeleteStudent(student._id, `${student.firstName} ${student.lastName}`)} title="Delete record"><Trash2 size={14} /> Delete</button>
                                            </td>
                                        </tr>
                                        {expandedRow === index && (
                                            <tr className="details-row"><td colSpan="14"><div className="details-content"><div className="details-section"><h4>Appointment Information</h4><div className="details-grid"><div className="details-item"><span className="details-label">Date:</span><span className="details-value">{student.appointment_date ? formatLocalDate(student.appointment_date, true) : "Not scheduled"}</span></div><div className="details-item"><span className="details-label">Time:</span><span className="details-value">{student.preferred_time || "Not specified"}</span></div><div className="details-item"><span className="details-label">Purpose:</span><span className="details-value">{student.purpose_of_visit || "Not specified"}</span></div></div></div></div></td></tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="pagination">
                    <button className="btn-page" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                    <span className="page-info">Page {currentPage} of {totalPages} ({totalRecords} total)</span>
                    <button className="btn-page" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                </div>
            </div>
        );
    };
    
    return (
        <div className="manage-preregistration">
            <AdminHeader />
            <div className="content-container-manage-preregistration">
                <div className="page-header"><h1>Student Pre-Registration Management</h1><p>View and manage student pre-registration records</p></div>
                {isMobile ? (
                    <div className="mobile-tabs-dropdown">
                        <button className="dropdown-toggle" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            <span className="dropdown-current">{getActiveTabData().icon}<span>{getActiveTabData().label}</span></span>
                            <ChevronDown size={16} className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                        </button>
                        {isDropdownOpen && <div className="dropdown-menu">{tabs.map(tab => (<button key={tab.id} className={`dropdown-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => handleTabChange(tab.id)}>{tab.icon}<span>{tab.label}</span></button>))}</div>}
                    </div>
                ) : (
                    <div className="tabs">{tabs.map(tab => (<button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.icon}<span>{tab.label}</span></button>))}</div>
                )}
                
                {activeTab === "table" && (
                    <>
                        <div className="filters-container">
                            <div className="search-and-year-container">
                                <div className="search-container">
                                    <input type="text" className="search-input" placeholder="Search by student name..." value={searchTerm} onChange={handleSearchChange} style={{ paddingLeft: 36 }} />
                                    <span className="search-icon"><svg width="18" height="18" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                                </div>
                            </div>
                            <div className="filter-group">
                                <Filter size={16} />
                                <select value={`${selectedYear}`} onChange={handleYearChange} className="filter-select">{yearOptions.map((year) => (<option key={year} value={year}>{year}</option>))}</select>
                                <select value={selectedGrade} onChange={handleGradeChange} className="filter-select">
                                    <option value="">All Grades</option><option value="Kinder">Kinder</option><option value="1">Grade 1</option><option value="2">Grade 2</option><option value="3">Grade 3</option><option value="4">Grade 4</option><option value="5">Grade 5</option><option value="6">Grade 6</option><option value="7">Grade 7</option><option value="8">Grade 8</option><option value="9">Grade 9</option><option value="10">Grade 10</option><option value="11">Grade 11</option><option value="12">Grade 12</option>
                                </select>
                                <select value={selectedStrand} onChange={handleStrandChange} className="filter-select"><option value="">All Strands</option><option value="ABM">ABM</option><option value="STEM">STEM</option><option value="HUMSS">HUMSS</option></select>
                                <select value={selectedType} onChange={handleTypeChange} className="filter-select"><option value="">All Types</option><option value="new">New</option><option value="old">Old</option></select>
                            </div>
                        </div>
                        {renderTable()}
                    </>
                )}
                {activeTab === "expected" && <ExpectedStudents />}
                {activeTab === "reports" && <ViewReports studentData={preRegistrations || []} totalRecords={totalRecords} />}
                {activeTab === "enrolled" && <EnrolledStudents studentData={preRegistrations || []} />}
            </div>
            
            <DeleteConfirmationDialog />
            <ConfirmationDialog />
            <DeleteStudentDialog />
            <EnrollmentConfirmationDialog />
            <ToastContainer />
        </div>
    );
}

export default ManagePreRegistration;