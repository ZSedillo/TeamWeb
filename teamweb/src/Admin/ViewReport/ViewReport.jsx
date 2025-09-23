import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminHeader from "../Component/AdminHeader.jsx";
import { fetchReports, deleteReports } from "../../_actions/report.actions.js";
import "./ViewReport.css";

function ViewReport() {
  const dispatch = useDispatch();
  const { reports, loading, error, deleting } = useSelector(state => state.report);

  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState({ username: "", month: "", year: "", time: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 20;

  useEffect(() => { dispatch(fetchReports()); }, [dispatch]);
  useEffect(() => { filterReports(); }, [reports, searchQuery]);

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchQuery(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const filterReports = () => {
    let filtered = [...reports];
    if (searchQuery.username) filtered = filtered.filter(r => r.username.toLowerCase().includes(searchQuery.username.toLowerCase()));
    if (searchQuery.year) filtered = filtered.filter(r => new Date(r.time).getFullYear() === parseInt(searchQuery.year,10));
    if (searchQuery.month) filtered = filtered.filter(r => new Date(r.time).getMonth() + 1 === parseInt(searchQuery.month,10));
    if (searchQuery.time) filtered = filtered.filter(r => new Date(r.time).getHours() === parseInt(searchQuery.time,10));
    setFilteredReports(filtered);
  };

  const clearFilters = () => { setSearchQuery({ username:"", month:"", year:"", time:"" }); setCurrentPage(1); };
  const handleDeleteLogs = () => { if(window.confirm("Are you sure?")) dispatch(deleteReports()); };

  const sortedReports = [...filteredReports].sort((a,b) => new Date(b.time) - new Date(a.time));
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = sortedReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  const currentYear = new Date().getFullYear();
  const yearOptions = [{ value: "", label: "All Years" }, ...Array.from({ length: 6 }, (_, i) => ({ value: (currentYear - i).toString(), label: (currentYear - i).toString() }))];
  const monthOptions = [{ value: "", label: "All Months" }, ...Array.from({ length: 12 }, (_, i) => ({ value: (i+1).toString(), label: new Date(0, i).toLocaleString("en-US",{ month:"long" }) }))];
  const hourOptions = [{ value: "", label: "All Hours" }, ...Array.from({ length: 24 }, (_, i) => ({ value:i.toString(), label: i===0?"12 AM":i===12?"12 PM":i<12?`${i} AM`:`${i-12} PM` }))];

  return (
    <>
      <AdminHeader />
      <div className="content-container-admin-logs">
        <div className="page-header">
          <h1>View Admin Logs</h1>
          <p>Audit admin activities and maintain security.</p>
        </div>

        <div className="report-container">
          {/* Search Filters */}
          <div className="search-controls-container">
            <div className="search-row">
              {["username","year","month","time"].map((field) => (
                <div key={field} className="search-field">
                  <label htmlFor={`${field}-search`}>{field.charAt(0).toUpperCase()+field.slice(1)}:</label>
                  {field === "username" ? (
                    <input id={`${field}-search`} name={field} value={searchQuery[field]} onChange={handleSearchChange} placeholder="Search by username" className="search-input" />
                  ) : (
                    <select id={`${field}-search`} name={field} value={searchQuery[field]} onChange={handleSearchChange} className="search-select">
                      {(field==="year"?yearOptions:field==="month"?monthOptions:hourOptions).map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <div className="button-row">
              <button className="clear-filters-button" onClick={clearFilters}>Clear Filters</button>
              <button className="delete-logs-button" onClick={handleDeleteLogs} disabled={deleting}>{deleting ? "Deleting..." : "Delete Logs"}</button>
            </div>

            <div className="search-results-info">
              <p>
                Showing {filteredReports.length} of {reports.length} logs
                {(searchQuery.username || searchQuery.month || searchQuery.year || searchQuery.time) && " (filtered)"}
              </p>
            </div>
          </div>

          {/* Report Table */}
          {loading ? (
            <div className="loading-state"><div className="loading-spinner"></div><p>Loading reports...</p></div>
          ) : error ? (
            <div className="error-state"><p>{error}</p></div>
          ) : filteredReports.length === 0 ? (
            <div className="empty-state"><p>No reports match your search criteria.</p></div>
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
                  {currentReports.map((r,i) => (
                    <tr key={i}>
                      <td>{r.username}</td>
                      <td>{r.activityLog}</td>
                      <td>{new Date(r.time).toLocaleDateString("en-US",{ weekday:"long", year:"numeric", month:"long", day:"numeric" })}</td>
                      <td>{new Date(r.time).toLocaleTimeString("en-US",{ hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination-container">
                <button onClick={()=>setCurrentPage(prev=>Math.max(prev-1,1))} disabled={currentPage===1}>&laquo; Prev</button>
                {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                  <button key={p} className={`pagination-button ${currentPage===p?"active":""}`} onClick={()=>setCurrentPage(p)}>{p}</button>
                ))}
                <button onClick={()=>setCurrentPage(prev=>Math.min(prev+1,totalPages))} disabled={currentPage===totalPages}>Next &raquo;</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ViewReport;
