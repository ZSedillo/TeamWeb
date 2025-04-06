import React, { useEffect, useState } from "react";
import AdminHeader from "../Component/AdminHeader.jsx";
import "./ViewReport.css";

function ViewReport() {
    const [reports, setReports] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const reportsPerPage = 20;

    useEffect(() => {
        fetchReports();
    }, []);

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
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching reports:", error);
                setError("Failed to load reports");
                setLoading(false);
            });
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
    const sortedReports = [...reports].sort((a, b) => new Date(b.time) - new Date(a.time));

    // Apply pagination
    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = sortedReports.slice(indexOfFirstReport, indexOfLastReport);
    const totalPages = Math.ceil(reports.length / reportsPerPage);

    return (
        <>
            <AdminHeader />
            <div className="content-container">
                <div className="page-header">
                    <h1>View Admin Logs</h1>
                    <p>Audit admin activities and maintain security.</p>
                </div>

                <div className="report-container">
                    <button 
                        className="delete-logs-button"
                        onClick={handleDeleteLogs}
                        disabled={deleting}
                    >
                        {deleting ? "Deleting..." : "Delete Logs"}
                    </button>

                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Loading reports...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <p>{error}</p>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="empty-state">
                            <p>No reports available.</p>
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

                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`pagination-button ${currentPage === i + 1 ? "active" : ""}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

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
