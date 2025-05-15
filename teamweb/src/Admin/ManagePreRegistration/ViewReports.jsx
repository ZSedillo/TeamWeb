import React, { useState, useEffect } from 'react';
import './ViewReports.css';

const ViewReports = () => {
  // State for storing registration data
  const [registrationData, setRegistrationData] = useState([]);
  const [gradesData, setGradesData] = useState([]);
  const [totalApproved, setTotalApproved] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [sectionCounts, setSectionCounts] = useState({
    earlyChildhood: 0,
    elementary: 0,
    juniorHigh: 0,
    seniorHigh: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for report view
  const [reportView, setReportView] = useState('byGrade');
  
  // State for selected year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Generate years from 2020 to current year for the dropdown
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => (2020 + i).toString());

  // Grade levels configuration
  const gradeLevels = {
    earlyChildhood: ['Nursery', 'Kinder1', 'Kinder2'],
    elementary: ['1', '2', '3', '4', '5', '6'],
    juniorHigh: ['7', '8', '9', '10'],
    seniorHigh: {
      '11': ['ABM', 'STEM', 'HUMSS'],
      '12': ['ABM', 'STEM', 'HUMSS']
    }
  };
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch registration data with year parameter
  const fetchRegistrations = async (year = selectedYear) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://teamweb-kera.onrender.com/preregistration?registration_year=${year}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Ensure data is properly extracted from the response
      if (Array.isArray(data)) {
        setRegistrationData(data);
      } else if (data && typeof data === 'object') {
        // Check for preregistration array in response
        if (data.preregistration && Array.isArray(data.preregistration)) {
          setRegistrationData(data.preregistration);
        } else if (data.data && Array.isArray(data.data)) {
          // Sometimes APIs return data nested in a data property
          setRegistrationData(data.data);
        } else {
          console.error("API did not return data in expected format:", data);
          setError("Invalid data format received from API");
          setRegistrationData([]);
        }
      } else {
        console.error("API did not return valid data:", data);
        setError("Invalid data format received from API");
        setRegistrationData([]);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching registration data:", err);
      setError(err.message);
      setRegistrationData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle year change
  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    console.log("Year Selected" + year);
    fetchRegistrations(year);
  };

  // Export functionality
  const handleExport = () => {
    if (!Array.isArray(registrationData) || registrationData.length === 0) {
      alert("No data available to export");
      return;
    }
    
    // Create CSV content
    const csvRows = [
      ['Name', 'Phone Number', 'Grade Level', 'Strand', 'Gender', 'Email', 'Student Type', 'Status', 'Registration Date']
    ];

    registrationData.forEach(student => {
      csvRows.push([
        student.name || '',
        student.phone_number || '',
        student.grade_level || '',
        student.strand || 'N/A',
        student.gender || '',
        student.email || '',
        student.isNewStudent === 'new' ? 'New Student' : 'Returning Student',
        student.status || '',
        student.createdAt ? new Date(student.createdAt).toLocaleDateString() : ''
      ]);
    });

    // Convert to CSV string
    const csvContent = csvRows.map(e => e.join(",")).join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `registration_report_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // ✅ Call `/add-report` API
    fetch("https://teamweb-kera.onrender.com/report/add-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: localStorage.getItem('username') || 'user', // Get username from localStorage or use default
        activityLog: `[Manage Pre-Registration: Reports] Registration data for ${selectedYear} exported as CSV on ${new Date().toLocaleString()}`
      }),
    });
  };

  // Refresh functionality
  const handleRefresh = () => {
    fetchRegistrations(selectedYear);
  };

  // Initial data fetch
  useEffect(() => {
    fetchRegistrations();
  }, []);
  
  // Process registration data into grade counts
  useEffect(() => {
    if (Array.isArray(registrationData) && registrationData.length > 0) {
      const processedData = [];
      let totalStudents = 0;
      let earlyChildhoodCount = 0;
      let elementaryCount = 0;
      let juniorHighCount = 0;
      let seniorHighCount = 0;
      
      // Count early childhood students
      gradeLevels.earlyChildhood.forEach(grade => {
        const count = registrationData.filter(student => student.grade_level === grade && student.status === 'approved').length;
        processedData.push({ 
          grade: grade === 'Kinder1' ? 'Kinder 1' : grade === 'Kinder2' ? 'Kinder 2' : grade, 
          approved: count 
        });
        earlyChildhoodCount += count;
        totalStudents += count;
      });
      
      // Count elementary students
      gradeLevels.elementary.forEach(grade => {
        const count = registrationData.filter(student => student.grade_level === grade && student.status === 'approved').length;
        processedData.push({ grade: `Grade ${grade}`, approved: count });
        elementaryCount += count;
        totalStudents += count;
      });
      
      // Count junior high students
      gradeLevels.juniorHigh.forEach(grade => {
        const count = registrationData.filter(student => student.grade_level === grade && student.status === 'approved').length;
        processedData.push({ grade: `Grade ${grade}`, approved: count });
        juniorHighCount += count;
        totalStudents += count;
      });
      
      // Count senior high students
      ['11', '12'].forEach(gradeLevel => {
        gradeLevels.seniorHigh[gradeLevel].forEach(strand => {
          const count = registrationData.filter(
            student => student.grade_level === gradeLevel && student.strand === strand && student.status === 'approved'
          ).length;
          processedData.push({ grade: `Grade ${gradeLevel} - ${strand}`, approved: count });
          seniorHighCount += count;
          totalStudents += count;
        });
      });
      
      setGradesData(processedData);
      setTotalApproved(totalStudents);
      setSectionCounts({
        earlyChildhood: earlyChildhoodCount,
        elementary: elementaryCount,
        juniorHigh: juniorHighCount,
        seniorHigh: seniorHighCount
      });
    }
  }, [registrationData]);

  // Helper function to safely filter array data
  const safeFilter = (array, filterFn) => {
    if (!Array.isArray(array)) return [];
    return array.filter(filterFn);
  };

  return (
    <div className="registration-reports-container">
      <div className="reports-header">
        <h1>Registration Reports</h1>
        <div className="reports-header-actions">
          <div className="year-selector">
            <label htmlFor="year-select">Year:</label>
            <select
              id="year-select"
              className="year-dropdown"
              value={selectedYear}
              onChange={handleYearChange}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
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

      {isLoading ? (
        <div className="loading-indicator">Loading registration data...</div>
      ) : error ? (
        <div className="error-message">
          <p>Error fetching registration data: {error}</p>
          <p>Please check your connection and try again.</p>
        </div>
      ) : !Array.isArray(registrationData) ? (
        <div className="error-message">
          <p>Invalid data format received. Expected an array of registrations.</p>
          <p>Please check the API response and try again.</p>
        </div>
      ) : (
        <>
          {/* Total Students */}
          <div className="total-students-card">
            <div className="total-students-count">{totalApproved}</div>
            <div className="total-students-label">Pre-registered students for {selectedYear}</div>
          </div>

          {/* Report Tabs */}
          <div className="report-tabs">
            {['byGrade', 'newVsOld', 'byMonth'].map((view) => (
              <div 
                key={view} 
                className={`report-tab ${reportView === view ? 'active' : ''}`}
                onClick={() => setReportView(view)}
              >
                {view === 'byGrade' ? 'By Grade Level' : 
                 view === 'newVsOld' ? 'New vs. Returning' : 
                 'By Month'}
              </div>
            ))}
          </div>

          {/* By Grade View */}
          {reportView === 'byGrade' && (
            <>
              {/* Early Childhood */}
              <div className="grade-level-section">
                <div className="grade-level-section-header">Early Childhood Education</div>
                <div className="grade-level-section-content">
                  {gradesData.slice(0, 3).map((gradeInfo, index) => (
                    <div key={index} className="grade-level-item">
                      <span className="grade-level-item-label">{gradeInfo.grade}</span>
                      <span className="grade-level-item-count">Approved: {gradeInfo.approved}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Elementary */}
              <div className="grade-level-section">
                <div className="grade-level-section-header">Elementary</div>
                <div className="grade-level-section-content">
                  {gradesData.slice(3, 9).map((gradeInfo, index) => (
                    <div key={index} className="grade-level-item">
                      <span className="grade-level-item-label">{gradeInfo.grade}</span>
                      <span className="grade-level-item-count">Approved: {gradeInfo.approved}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Junior High */}
              <div className="grade-level-section">
                <div className="grade-level-section-header">Junior High School</div>
                <div className="grade-level-section-content">
                  {gradesData.slice(9, 13).map((gradeInfo, index) => (
                    <div key={index} className="grade-level-item">
                      <span className="grade-level-item-label">{gradeInfo.grade}</span>
                      <span className="grade-level-item-count">Approved: {gradeInfo.approved}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Senior High - Grade 11 */}
              <div className="grade-level-section">
                <div className="grade-level-section-header">Senior High School - Grade 11</div>
                <div className="grade-level-section-content">
                  {gradesData.slice(13, 16).map((gradeInfo, index) => (
                    <div key={index} className="grade-level-item">
                      <span className="grade-level-item-label">{gradeInfo.grade}</span>
                      <span className="grade-level-item-count">Approved: {gradeInfo.approved}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Senior High - Grade 12 */}
              <div className="grade-level-section">
                <div className="grade-level-section-header">Senior High School - Grade 12</div>
                <div className="grade-level-section-content">
                  {gradesData.slice(16).map((gradeInfo, index) => (
                    <div key={index} className="grade-level-item">
                      <span className="grade-level-item-label">{gradeInfo.grade}</span>
                      <span className="grade-level-item-count">Approved: {gradeInfo.approved}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* New vs Old Students View */}
          {reportView === 'newVsOld' && (
            <div className="grade-level-section">
              <div className="grade-level-section-header">New vs. Returning Students</div>
              <div className="grade-level-section-content">
                <div className="grade-level-item">
                  <span className="grade-level-item-label">New Students</span>
                  <span className="grade-level-item-count">
                    {safeFilter(registrationData, s => s.isNewStudent === 'new' && s.status === 'approved').length}
                  </span>
                </div>
                <div className="grade-level-item">
                  <span className="grade-level-item-label">Returning Students</span>
                  <span className="grade-level-item-count">
                    {safeFilter(registrationData, s => s.isNewStudent === 'old' && s.status === 'approved').length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* By Month View */}
          {reportView === 'byMonth' && (
            <div className="grade-level-section">
              <div className="grade-level-section-header">Monthly Registration Trends</div>
              <div className="grade-level-section-content">
                {months.map(month => {
                  const monthRegistrations = safeFilter(
                    registrationData, 
                    s => s.status === 'approved' && s.createdAt && new Date(s.createdAt).getMonth() === months.indexOf(month)
                  );
                  return (
                    <div key={month} className="grade-level-item">
                      <span className="grade-level-item-label">{month}</span>
                      <span className="grade-level-item-count">{monthRegistrations.length}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="last-updated">
            Last updated: {lastUpdated.toLocaleDateString()} at {lastUpdated.toLocaleTimeString()} | Academic Year: {selectedYear}-{parseInt(selectedYear) + 1}
          </div>
        </>
      )}
    </div>
  );
};

export default ViewReports;