import React, { useState, useEffect } from 'react';
import { Search, Filter, User, Phone, Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEnrolledStudents, updatePreRegistrationEnrollment } from '../../_actions/preRegistration.actions';
import './EnrolledStudents.css';

function EnrolledStudents() {
    const dispatch = useDispatch();
    
    // 1. Get State from Redux
    const { enrolledStudents, loading, error, totalPages, totalRecords } = useSelector(state => state.preRegistration);
    
    // 2. Get User from Redux (Correctly grab username)
    const { user } = useSelector(state => state.user);
    const currentUsername = user?.username || "Admin"; 

    // Local State
    const [processingEnrollment, setProcessingEnrollment] = useState(null);
    const [showEnrollmentConfirmation, setShowEnrollmentConfirmation] = useState(false);
    const [studentToEnroll, setStudentToEnroll] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGrade, setSelectedGrade] = useState("");
    const [selectedStrand, setSelectedStrand] = useState("");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [expandedRow, setExpandedRow] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);

    const availableYears = Array.from({ length: 6 }, (_, i) => (2020 + i).toString());

    function getStudentDisplayName(student) {
        if (student.lastName && student.firstName) {
            const formattedFirstName = student.firstName
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            return `${student.lastName.toUpperCase()}, ${formattedFirstName}`;
        }
        return student.name || '';
    }

    const loadData = () => {
        const queryParams = {
            page: currentPage,
            limit: limit,
            enrollment: true,
            year: selectedYear
        };
        if (searchTerm) queryParams.search = searchTerm;
        if (selectedGrade) queryParams.grade = selectedGrade;
        if (selectedStrand) queryParams.strand = selectedStrand;

        dispatch(fetchEnrolledStudents(queryParams));
    };

    useEffect(() => {
        loadData();
    }, [dispatch, searchTerm, selectedGrade, selectedStrand, selectedYear, currentPage, limit]);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
    };

    const toggleRow = (index) => setExpandedRow(expandedRow === index ? null : index);

    const getActiveFiltersText = () => {
        const filters = [];
        if (searchTerm) filters.push(`Name: "${searchTerm}"`);
        if (selectedGrade) filters.push(`Grade: ${selectedGrade}`);
        if (selectedStrand) filters.push(`Strand: ${selectedStrand}`);
        if (selectedYear) filters.push(`Year: ${selectedYear}`);
        return filters.length > 0 ? `Filtered by: ${filters.join(', ')}` : 'Showing all enrolled students';
    };

    const confirmEnrollmentChange = (studentId, currentEnrollmentStatus) => {
        const student = enrolledStudents.find(s => s._id === studentId);
        setStudentToEnroll({
            id: studentId,
            currentStatus: currentEnrollmentStatus,
            name: student ? getStudentDisplayName(student) : "this student"
        });
        setShowEnrollmentConfirmation(true);
    };

    const handleEnrollmentChange = async () => {
        if (!studentToEnroll) return;
        
        setShowEnrollmentConfirmation(false);
        setProcessingEnrollment(studentToEnroll.id);
        const newStatus = !studentToEnroll.currentStatus;

        // ✅ Use currentUsername
        await dispatch(updatePreRegistrationEnrollment(
            studentToEnroll.id, 
            newStatus, 
            studentToEnroll.name, 
            currentUsername 
        ));

        // Refresh data
        loadData();
        setProcessingEnrollment(null);
        setStudentToEnroll(null);
        
        toast.success(`Student is now ${newStatus ? "Enrolled" : "Not Enrolled"}`);
    };

    const handleExport = () => {
        if (!Array.isArray(enrolledStudents) || enrolledStudents.length === 0) {
            toast.error('No data to export');
            return;
        }
        
        const csvRows = [['Name', 'Gender', 'Grade Level', 'Strand', 'Email', 'Phone Number', 'Student Type', 'Registration Year', 'Registration Date', 'Enrollment Status']];
    
        enrolledStudents.forEach(student => {
            csvRows.push([
                getStudentDisplayName(student),
                student.gender || '',
                student.grade_level || '',
                student.strand || 'N/A',
                student.email || '',
                student.phone_number || '',
                student.isNewStudent === 'new' ? 'New Student' : 'Returning Student',
                student.registration_year || new Date().getFullYear().toString(),
                student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '',
                student.enrollment ? "Enrolled" : "Not Enrolled"
            ]);
        });
    
        const csvContent = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `enrolled_students_${selectedYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    
        // ✅ Log export activity using currentUsername and HTTP-Only Cookie
        fetch("https://teamweb-kera.onrender.com/report/add-report", {
            method: "POST",
            credentials: "include", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: currentUsername, // Correct username
                activityLog: `[Enrolled Students] Exported data for ${selectedYear}`
            }),
        });
        toast.success("Export successful");
    };

    const handleRefresh = () => { loadData(); toast.info('Refreshed'); };
    const clearAllFilters = () => { setSearchTerm(""); setSelectedGrade(""); setSelectedStrand(""); setSelectedYear(new Date().getFullYear().toString()); setCurrentPage(1); };

    // --- Render ---
    if (error) return <div className="error-state"><AlertCircle size={24} /><p>{error}</p><button onClick={loadData}>Try Again</button></div>;

    return (
        <div className="enrolled-students">
            <div className="page-header">
                <div className="header-content">
                    <h2>Enrolled Students Overview</h2>
                    <p>View and manage currently enrolled students</p>
                </div>
            </div>

            <div className="filters-container">
                <div className="search-container enrolled-search-container">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                </div>
                <div className="filter-group">
                    <Filter size={16} />
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="filter-select year-select">
                        {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                    <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="filter-select">
                        <option value="">All Grades</option>
                        <option value="Kinder">Kinder</option>
                        <option value="1">Grade 1</option>
                        <option value="7">Grade 7</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                    </select>
                    <select value={selectedStrand} onChange={(e) => setSelectedStrand(e.target.value)} className="filter-select">
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
                        {(searchTerm || selectedGrade || selectedStrand || selectedYear !== new Date().getFullYear().toString()) && <button className="clear-filters-btn" onClick={clearAllFilters}>Clear Filters</button>}
                    </div>
                    <div className="filters-right">
                        <button className="btn btn-export" onClick={handleExport}>Export</button>
                        <button className="btn btn-refresh" onClick={handleRefresh}>Refresh</button>
                    </div>
                </div>

                {loading ? <div className="loading-state">Loading...</div> : enrolledStudents.length === 0 ? <div className="empty-state">No Enrolled Students Found</div> : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr><th>Name</th><th>Gender</th><th>Grade</th><th>Strand</th><th>Email</th><th>Phone</th><th>Details</th><th>Enrollment</th></tr>
                            </thead>
                            <tbody>
                                {enrolledStudents.map((student, index) => (
                                    <React.Fragment key={student._id}>
                                        <tr className={expandedRow === index ? 'row-expanded' : ''}>
                                            <td className="cell-name">{getStudentDisplayName(student)}</td>
                                            <td className="cell-center">{student.gender}</td>
                                            <td className="cell-center">{student.grade_level}</td>
                                            <td className="cell-center">{student.strand || "N/A"}</td>
                                            <td className="cell-email"><Mail size={14} /> {student.email}</td>
                                            <td className="cell-phone"><Phone size={14} /> {student.phone_number}</td>
                                            <td className="cell-action"><button className="btn-details" onClick={() => toggleRow(index)}><Clock size={14} /> {expandedRow === index ? 'Hide' : 'View'}</button></td>
                                            <td className="cell-status">
                                                <button
                                                    className={`btn-enrollment ${processingEnrollment === student._id ? 'processing' : student.enrollment ? 'enrolled' : 'notenrolled'}`}
                                                    onClick={() => confirmEnrollmentChange(student._id, student.enrollment)}
                                                    disabled={processingEnrollment === student._id}
                                                >
                                                    {processingEnrollment === student._id ? 'Processing...' : student.enrollment ? 'Enrolled' : 'Not Enrolled'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRow === index && (
                                            <tr className="details-row">
                                                <td colSpan="8">
                                                    <div className="details-content">
                                                        <p><strong>Status:</strong> {student.isNewStudent === 'new' ? 'New' : 'Returning'}</p>
                                                        <p><strong>Registration Date:</strong> {new Date(student.createdAt).toLocaleDateString()}</p>
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
                    <button className="btn-page" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                    <span className="page-info">Page {currentPage} of {totalPages}</span>
                    <button className="btn-page" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                </div>
            </div>

            {showEnrollmentConfirmation && (
                <div className="confirmation-overlay">
                    <div className="confirmation-dialog">
                        <h3>Confirm Change</h3>
                        <p>Change enrollment for <strong>{studentToEnroll?.name}</strong>?</p>
                        <div className="confirmation-actions">
                            <button className="btn-cancel" onClick={() => setShowEnrollmentConfirmation(false)}>Cancel</button>
                            <button className="btn-confirm" onClick={handleEnrollmentChange}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default EnrolledStudents;