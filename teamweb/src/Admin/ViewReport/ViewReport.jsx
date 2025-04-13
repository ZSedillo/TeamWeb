import React, { useEffect, useState } from "react";
import AdminHeader from "../Component/AdminHeader.jsx";
import "./ViewReport.css";

function ViewReport() {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState({
        username: "",
        month: "",
        year: "",
        time: ""
    });
    const reportsPerPage = 20;

    useEffect(() => {
        fetchReports();
    }, []);

    // Apply filters whenever reports or search query changes
    useEffect(() => {
        filterReports();
    }, [reports, searchQuery]);

    const fetchReports = () => {
        setLoading(true);
        fetch("https://teamweb-kera.onrender.com/report/view-report")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch reports");
                }
                return response.json();
            })
            .then((data) => {
                setReports(data);
                setFilteredReports(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching reports:", error);
                setError("Failed to load reports");
                setLoading(false);
            });
    };

    // Function to handle search input changes
    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchQuery(prev => ({
            ...prev,
            [name]: value
        }));
        setCurrentPage(1); // Reset to first page when search changes
    };

    // Function to filter reports based on search criteria
    const filterReports = () => {
        let filtered = [...reports];

        // Filter by username
        if (searchQuery.username) {
            filtered = filtered.filter(report => 
                report.username.toLowerCase().includes(searchQuery.username.toLowerCase())
            );
        }

        // Filter by year
        if (searchQuery.year) {
            const yearNumber = parseInt(searchQuery.year, 10);
            if (!isNaN(yearNumber)) {
                filtered = filtered.filter(report => {
                    const reportDate = new Date(report.time);
                    return reportDate.getFullYear() === yearNumber;
                });
            }
        }

        // Filter by month
        if (searchQuery.month) {
            const monthNumber = parseInt(searchQuery.month, 10);
            if (!isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
                filtered = filtered.filter(report => {
                    const reportDate = new Date(report.time);
                    return reportDate.getMonth() + 1 === monthNumber; // getMonth() is 0-indexed
                });
            }
        }

        // Filter by time (hour of day)
        if (searchQuery.time) {
            const timePattern = /^([01]?[0-9]|2[0-3])$/; // Match hours 0-23
            if (timePattern.test(searchQuery.time)) {
                const hour = parseInt(searchQuery.time, 10);
                filtered = filtered.filter(report => {
                    const reportDate = new Date(report.time);
                    return reportDate.getHours() === hour;
                });
            }
        }

        setFilteredReports(filtered);
    };

    // Function to clear all filters
    const clearFilters = () => {
        setSearchQuery({
            username: "",
            month: "",
            year: "",
            time: ""
        });
        setCurrentPage(1);
    };

    // Function to delete all logs
    const handleDeleteLogs = () => {
        if (!window.confirm("Are you sure you want to delete all logs? This action cannot be undone.")) {
            return;
        }

        setDeleting(true);
        fetch("https://teamweb-kera.onrender.com/report/delete-reports", { method: "DELETE" })
            .then((response) => response.json())
            .then((data) => {
                alert(data.message);
                fetchReports(); // Refresh reports after deletion
            })
            .catch((error) => {
                console.error("Error deleting reports:", error);
                alert("Failed to delete logs.");
            })
            .finally(() => {
                setDeleting(false);
            });
    };

    // Sort reports by latest time first
    const sortedReports = [...filteredReports].sort((a, b) => new Date(b.time) - new Date(a.time));

    // Apply pagination
    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = sortedReports.slice(indexOfFirstReport, indexOfLastReport);
    const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

    // Generate year options for the dropdown
    // Get current year and provide options for the past 5 years
    const currentYear = new Date().getFullYear();
    const yearOptions = [
        { value: "", label: "All Years" },
        ...Array.from({ length: 6 }, (_, i) => ({
            value: (currentYear - i).toString(),
            label: (currentYear - i).toString()
        }))
    ];

    // Generate month options for the dropdown
    const monthOptions = [
        { value: "", label: "All Months" },
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" }
    ];

    // Generate hour options for the dropdown
    const hourOptions = [
        { value: "", label: "All Hours" },
        ...Array.from({ length: 24 }, (_, i) => ({
            value: i.toString(),
            label: i === 0 ? "12 AM" : i === 12 ? "12 PM" : i < 12 ? `${i} AM` : `${i - 12} PM`
        }))
    ];

    return (
        <>
            <AdminHeader />
            <div className="content-container-admin-logs">
                <div className="page-header">
                    <h1>View Admin Logs</h1>
                    <p>Audit admin activities and maintain security.</p>
                </div>

                <div className="report-container">
                    <div className="search-controls-container">
                        <div className="search-row">
                            <div className="search-field">
                                <label htmlFor="username-search">Username:</label>
                                <input
                                    id="username-search"
                                    type="text"
                                    name="username"
                                    value={searchQuery.username}
                                    onChange={handleSearchChange}
                                    placeholder="Search by username"
                                    className="search-input"
                                />
                            </div>
                            
                            <div className="search-field">
                                <label htmlFor="year-search">Year:</label>
                                <select
                                    id="year-search"
                                    name="year"
                                    value={searchQuery.year}
                                    onChange={handleSearchChange}
                                    className="search-select"
                                >
                                    {yearOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="search-field">
                                <label htmlFor="month-search">Month:</label>
                                <select
                                    id="month-search"
                                    name="month"
                                    value={searchQuery.month}
                                    onChange={handleSearchChange}
                                    className="search-select"
                                >
                                    {monthOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="search-field">
                                <label htmlFor="time-search">Hour:</label>
                                <select
                                    id="time-search"
                                    name="time"
                                    value={searchQuery.time}
                                    onChange={handleSearchChange}
                                    className="search-select"
                                >
                                    {hourOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="button-row">
                            <button 
                                className="clear-filters-button"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </button>
                            
                            <button 
                                className="delete-logs-button"
                                onClick={handleDeleteLogs}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete Logs"}
                            </button>
                        </div>
                        
                        <div className="search-results-info">
                            <p>
                                Showing {filteredReports.length} of {reports.length} logs
                                {(searchQuery.username || searchQuery.month || searchQuery.year || searchQuery.time) && " (filtered)"}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Loading reports...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <p>{error}</p>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="empty-state">
                            {reports.length === 0 ? (
                                <p>No reports available.</p>
                            ) : (
                                <p>No reports match your search criteria.</p>
                            )}
                        </div>
                    ) : (
                        <>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Activity Log</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentReports.map((report, index) => (
                                        <tr key={index}>
                                            <td>{report.username}</td>
                                            <td>{report.activityLog}</td>
                                            <td>{new Date(report.time).toLocaleDateString("en-US", { 
                                                weekday: "long", 
                                                year: "numeric", 
                                                month: "long", 
                                                day: "numeric" 
                                            })}</td>
                                            <td>{new Date(report.time).toLocaleTimeString("en-US", { 
                                                hour: "2-digit", 
                                                minute: "2-digit", 
                                                second: "2-digit", 
                                                hour12: true 
                                            })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            <div className="pagination-container">
                                <button
                                    className="pagination-button"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    &laquo; Prev
                                </button>

                                {totalPages <= 7 ? (
                                    // Show all pages if there are 7 or fewer
                                    Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i + 1}
                                            className={`pagination-button ${currentPage === i + 1 ? "active" : ""}`}
                                            onClick={() => setCurrentPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))
                                ) : (
                                    // Show limited pages with ellipsis for many pages
                                    <>
                                        {/* First page */}
                                        <button
                                            className={`pagination-button ${currentPage === 1 ? "active" : ""}`}
                                            onClick={() => setCurrentPage(1)}
                                        >
                                            1
                                        </button>
                                        
                                        {/* Ellipsis if needed */}
                                        {currentPage > 3 && <span className="pagination-ellipsis">...</span>}
                                        
                                        {/* Pages around current page */}
                                        {Array.from(
                                            { length: Math.min(3, totalPages) },
                                            (_, i) => {
                                                const pageNum = Math.max(2, currentPage - 1) + i;
                                                return pageNum < totalPages ? (
                                                    <button
                                                        key={pageNum}
                                                        className={`pagination-button ${currentPage === pageNum ? "active" : ""}`}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                ) : null;
                                            }
                                        ).filter(Boolean)}
                                        
                                        {/* Ellipsis if needed */}
                                        {currentPage < totalPages - 2 && <span className="pagination-ellipsis">...</span>}
                                        
                                        {/* Last page */}
                                        <button
                                            className={`pagination-button ${currentPage === totalPages ? "active" : ""}`}
                                            onClick={() => setCurrentPage(totalPages)}
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}

                                <button
                                    className="pagination-button"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next &raquo;
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default ViewReport;