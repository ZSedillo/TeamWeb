import React, { useState, useEffect } from 'react';
import { Search, Filter, User, Calendar, Phone, Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import './EnrolledStudents.css';

function EnrolledStudents() {
    // State for enrollment processing
    const [processingEnrollment, setProcessingEnrollment] = useState(null);
    const [showEnrollmentConfirmation, setShowEnrollmentConfirmation] = useState(false);
    const [studentToEnroll, setStudentToEnroll] = useState(null);

    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filter and search states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGrade, setSelectedGrade] = useState("");
    const [selectedStrand, setSelectedStrand] = useState("");
    const [expandedRow, setExpandedRow] = useState(null);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [limit] = useState(10);

    // Fetch data from API
    const fetchStudentData = async () => {
        try {
            setLoading(true);
            
            // Construct query parameters based on active filters
            let queryParams = new URLSearchParams({
                page: currentPage,
                limit: limit,
                enrollment: true // Only fetch enrolled students
            });
            
            // Add filters to query parameters if they exist
            if (searchTerm) queryParams.append('search', searchTerm);
            if (selectedGrade) queryParams.append('grade', selectedGrade);
            if (selectedStrand) queryParams.append('strand', selectedStrand);
            
            const response = await fetch(
                `https://teamweb-kera.onrender.com/preregistration/enrolled?${queryParams.toString()}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            setEnrolledStudents(data.preregistration);
            setTotalPages(data.totalPages);
            setTotalRecords(data.totalRecords);
        } catch (err) {
            setError('Failed to fetch enrolled students data: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on initial load and when filters or pagination changes
    useEffect(() => {
        fetchStudentData();
    }, [searchTerm, selectedGrade, selectedStrand, currentPage, limit]);

    // Event handlers
    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const toggleRow = (index) => {
        setExpandedRow(expandedRow === index ? null : index);
    };

    const getActiveFiltersText = () => {
        const filters = [];
        if (searchTerm) filters.push(`Name: "${searchTerm}"`);
        if (selectedGrade) filters.push(`Grade: ${selectedGrade}`);
        if (selectedStrand) filters.push(`Strand: ${selectedStrand}`);
        return filters.length > 0 ? `Filtered by: ${filters.join(', ')}` : 'Showing all enrolled students';
    };

    if (loading) return (
        <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading enrolled students data...</p>
        </div>
    );

    if (error) return (
        <div className="error-state">
            <AlertCircle size={24} />
            <p>{error}</p>
        </div>
    );

    // Add enrollment handling functions
    const confirmEnrollmentChange = (studentId, currentEnrollmentStatus) => {
        const student = enrolledStudents.find(s => s._id === studentId);
        setStudentToEnroll({
            id: studentId,
            currentStatus: currentEnrollmentStatus,
            name: student?.name || "this student"
        });
        setShowEnrollmentConfirmation(true);
    };

    const handleEnrollmentChange = async () => {
        try {
            if (!studentToEnroll) return;
            
            setShowEnrollmentConfirmation(false);
            setProcessingEnrollment(studentToEnroll.id);
            
            const newStatus = !studentToEnroll.currentStatus;
            
            const response = await fetch(`https://teamweb-kera.onrender.com/preregistration/enrollment/${studentToEnroll.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ enrollment: newStatus }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // Refresh the data after updating enrollment status
            fetchStudentData();
            
            // Log the activity
            try {
                const username = localStorage.getItem('username') || 'Admin';
                await fetch("https://teamweb-kera.onrender.com/report/add-report", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: username,
                        activityLog: `[Manage Pre-Registration] Updated enrollment status for ${studentToEnroll.name} to ${newStatus ? "Enrolled" : "Not Enrolled"}`,
                    }),
                });
            } catch (logError) {
                console.error('Failed to log activity:', logError);
            }
            
            toast.success(
                <div>
                    <p><strong>Enrollment Status Updated</strong></p>
                    <p>Student is now {newStatus ? "Enrolled" : "Not Enrolled"}</p>
                </div>,
                {
                    position: "top-center",
                    autoClose: 3000,
                }
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

    // Add the EnrollmentConfirmationDialog component
    const EnrollmentConfirmationDialog = () => {
        if (!showEnrollmentConfirmation) return null;
        
        const newStatus = !studentToEnroll?.currentStatus;
        const actionText = studentToEnroll?.currentStatus ? "mark as not enrolled" : "enroll";
        
        return (
            <div className="confirmation-overlay">
                <div className="confirmation-dialog">
                    <div className="confirmation-header">
                        <h3>Confirm Enrollment Change</h3>
                    </div>
                    <div className="confirmation-content">
                        <p>Are you sure you want to {actionText} <strong>{studentToEnroll?.name}</strong>?</p>
                    </div>
                    <div className="confirmation-actions">
                        <button 
                            className="btn-cancel"
                            onClick={() => {
                                setShowEnrollmentConfirmation(false);
                                setStudentToEnroll(null);
                            }}
                        >
                            Cancel
                        </button>
                        <button 
                            className={`btn-confirm ${studentToEnroll?.currentStatus ? "notenrolled" : "enrolled"}`}
                            onClick={handleEnrollmentChange}
                        >
                            {studentToEnroll?.currentStatus ? 
                                "Mark as Not Enrolled" : 
                                "Mark as Enrolled"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleExport = () => {
        if (!Array.isArray(enrolledStudents) || enrolledStudents.length === 0) {
            toast.error('No data available to export', {
                position: "top-center",
                autoClose: 3000,
            });
            return;
        }
        
        // Create CSV content with added enrollment status column
        const csvRows = [
            ['Name', 'Gender', 'Grade Level', 'Strand', 'Email', 'Phone Number', 'Student Type', 'Registration Date', 'Enrollment Status']
        ];
    
        enrolledStudents.forEach(student => {
            csvRows.push([
                student.name || '',
                student.gender || '',
                student.grade_level || '',
                student.strand || 'N/A',
                student.email || '',
                student.phone_number || '',
                student.isNewStudent === 'new' ? 'New Student' : 'Returning Student',
                student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '',
                student.enrollment ? "Enrolled" : "Not Enrolled" // Fixed to use boolean value
            ]);
        });
    
        // Rest of the export functionality remains the same
        const csvContent = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `enrolled_students_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    
        // Log the export activity
        const username = localStorage.getItem('username') || 'Admin';
        fetch("https://teamweb-kera.onrender.com/report/add-report", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username,
                activityLog: `[Enrolled Students] Exported enrolled students data with enrollment status as CSV on ${new Date().toLocaleString()}`
            }),
        });
    
        toast.success('Successfully exported enrolled students data', {
            position: "top-center",
            autoClose: 3000,
        });
    };
    
    const handleRefresh = () => {
        fetchStudentData();
        toast.success('Data refreshed successfully', {
            position: "top-center",
            autoClose: 2000,
        });
    };

    return (
        <div className="enrolled-students">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-title">
                        <h2>Enrolled Students Overview</h2>
                        <p>View and manage currently enrolled students</p>
                    </div>
                </div>
            </div>

            <div className="filters-container">
                <div className="search-container">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by student name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-group">
                    <Filter size={16} />
                    <select 
                        value={selectedGrade} 
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Grades</option>
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

                    <select 
                        value={selectedStrand} 
                        onChange={(e) => setSelectedStrand(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Strands</option>
                        <option value="ABM">ABM</option>
                        <option value="STEM">STEM</option>
                        <option value="HUMSS">HUMSS</option>
                    </select>
                </div>
            </div>

            <div className="data-table-container">
                <div className="active-filters">
                    <div className="filters-left">
                        <span>{getActiveFiltersText()}</span>
                        {(searchTerm || selectedGrade || selectedStrand) && (
                            <button 
                                className="clear-filters-btn"
                                onClick={() => {
                                    setSearchTerm("");
                                    setSelectedGrade("");
                                    setSelectedStrand("");
                                    setCurrentPage(1);
                                }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                    <div className="filters-right">
                        <button className="btn btn-export" onClick={handleExport}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Export
                        </button>
                        <button className="btn btn-refresh" onClick={handleRefresh}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 4v6h-6"/>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>

                {enrolledStudents.length === 0 ? (
                    <div className="empty-state">
                        <User size={48} />
                        <h3>No Enrolled Students Found</h3>
                        <p>No enrolled students match your filter criteria.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Gender</th>
                                    <th>Grade Level</th>
                                    <th>Strand</th>
                                    <th>Email Address</th>
                                    <th>Phone Number</th>
                                    <th>Details</th>
                                    <th>Enrollment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrolledStudents.map((student, index) => (
                                    <React.Fragment key={student._id}>
                                        <tr className={expandedRow === index ? 'row-expanded' : ''}>
                                            <td className="cell-name">{student.name}</td>
                                            <td className="cell-center">{student.gender}</td>
                                            <td className="cell-center">{student.grade_level}</td>
                                            <td className="cell-center">{student.strand || "N/A"}</td>
                                            <td className="cell-email">
                                                <div className="email-container">
                                                    <Mail size={14} />
                                                    <span>{student.email}</span>
                                                </div>
                                            </td>
                                            <td className="cell-phone">
                                                <div className="phone-container">
                                                    <Phone size={14} />
                                                    <span>{student.phone_number}</span>
                                                </div>
                                            </td>
                                            <td className="cell-action">
                                                <button
                                                    className="btn-details"
                                                    onClick={() => toggleRow(index)}
                                                >
                                                    <Clock size={14} />
                                                    {expandedRow === index ? 'Hide' : 'View'}
                                                </button>
                                            </td>
                                            <td className="cell-status">
                                                <button
                                                    className={`btn-enrollment ${
                                                        processingEnrollment === student._id 
                                                            ? 'processing' 
                                                            : student.enrollment ? 'enrolled' : 'notenrolled'
                                                    }`}
                                                    onClick={() => confirmEnrollmentChange(student._id, student.enrollment)}
                                                    disabled={processingEnrollment === student._id}
                                                >
                                                    {processingEnrollment === student._id ? (
                                                        <>
                                                            <span className="status-loading"></span>
                                                            Processing...
                                                        </>
                                                    ) : student.enrollment ? (
                                                        <><CheckCircle size={14} /> Enrolled</>
                                                    ) : (
                                                        <><AlertCircle size={14} /> Not Enrolled</>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRow === index && (
                                            <tr className="details-row">
                                                <td colSpan="8">
                                                    <div className="details-content">
                                                        <div className="details-section">
                                                            <h4>Additional Information</h4>
                                                            <div className="details-grid">
                                                                <div className="details-item">
                                                                    <span className="details-label">Student Type:</span>
                                                                    <span className="details-value">{student.isNewStudent}</span>
                                                                </div>
                                                                <div className="details-item">
                                                                    <span className="details-label">Date of Birth:</span>
                                                                    <span className="details-value">
                                                                        {new Date(student.birthdate).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <div className="details-item">
                                                                    <span className="details-label">Registration Date:</span>
                                                                    <span className="details-value">
                                                                        {new Date(student.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="pagination">
                    <button 
                        className="btn-page"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span className="page-info">
                        Page {currentPage} of {totalPages} ({totalRecords} total)
                    </span>
                    <button 
                        className="btn-page"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>
            
            {/* Add the enrollment confirmation dialog */}
            <EnrollmentConfirmationDialog />
        </div>
    );
}

export default EnrolledStudents;