import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReportData } from '../../_actions/preRegistration.actions';
import './ViewReports.css';

const ViewReports = () => {
  const dispatch = useDispatch();
  
  // ✅ 1. Get state from Redux (instead of local state)
  const { reportData, loading: isLoading, error } = useSelector(state => state.preRegistration);
  const { user } = useSelector(state => state.user); // Get current admin user
  
  // Local state for UI calculations
  const [gradesData, setGradesData] = useState([]);
  const [totalApproved, setTotalApproved] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [reportView, setReportView] = useState('byGrade');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

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
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // ✅ 2. Fetch Data using Redux Action
  useEffect(() => {
    dispatch(fetchReportData(selectedYear));
  }, [dispatch, selectedYear]);

  // ✅ 3. Process Data when Redux state changes
  useEffect(() => {
    // Ensure reportData is an array before processing
    const dataToProcess = Array.isArray(reportData) ? reportData : [];
    
    if (dataToProcess.length >= 0) {
      setLastUpdated(new Date());
      const processedData = [];
      let totalStudents = 0;
      let earlyChildhoodCount = 0;
      let elementaryCount = 0;
      let juniorHighCount = 0;
      let seniorHighCount = 0;
      
      // Count early childhood students
      gradeLevels.earlyChildhood.forEach(grade => {
        const count = dataToProcess.filter(student => student.grade_level === grade && student.status === 'approved').length;
        processedData.push({ 
          grade: grade === 'Kinder1' ? 'Kinder 1' : grade === 'Kinder2' ? 'Kinder 2' : grade, 
          approved: count 
        });
        earlyChildhoodCount += count;
        totalStudents += count;
      });
      
      // Count elementary students
      gradeLevels.elementary.forEach(grade => {
        const count = dataToProcess.filter(student => student.grade_level === grade && student.status === 'approved').length;
        processedData.push({ grade: `Grade ${grade}`, approved: count });
        elementaryCount += count;
        totalStudents += count;
      });
      
      // Count junior high students
      gradeLevels.juniorHigh.forEach(grade => {
        const count = dataToProcess.filter(student => student.grade_level === grade && student.status === 'approved').length;
        processedData.push({ grade: `Grade ${grade}`, approved: count });
        juniorHighCount += count;
        totalStudents += count;
      });
      
      // Count senior high students
      ['11', '12'].forEach(gradeLevel => {
        gradeLevels.seniorHigh[gradeLevel].forEach(strand => {
          const count = dataToProcess.filter(
            student => student.grade_level === gradeLevel && student.strand === strand && student.status === 'approved'
          ).length;
          processedData.push({ grade: `Grade ${gradeLevel} - ${strand}`, approved: count });
          seniorHighCount += count;
          totalStudents += count;
        });
      });
      
      setGradesData(processedData);
      setTotalApproved(totalStudents);
    }
  }, [reportData]); // Depend on Redux state

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

  const handleRefresh = () => {
    dispatch(fetchReportData(selectedYear));
  };

  // ✅ 4. Export Functionality (Fixed Auth)
  const handleExport = () => {
    const dataToExport = Array.isArray(reportData) ? reportData : [];

    if (dataToExport.length === 0) {
      alert("No data available to export");
      return;
    }

    // Create CSV content
    const csvRows = [
      ['Name', 'Phone Number', 'Grade Level', 'Strand', 'Gender', 'Email', 'Student Type', 'Status', 'Registration Date']
    ];

    dataToExport.forEach(student => {
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

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `registration_report_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // ✅ Log Activity using HTTP-Only Cookie
    fetch("https://teamweb-kera.onrender.com/report/add-report", {
      method: "POST",
      credentials: "include", // <--- CRITICAL FIX
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: user?.username || 'Admin',
        activityLog: `[Manage Pre-Registration: Reports] Registration data for ${selectedYear} exported as CSV`
      }),
    });
  };

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
                    {safeFilter(Array.isArray(reportData) ? reportData : [], s => s.isNewStudent === 'new' && s.status === 'approved').length}
                  </span>
                </div>
                <div className="grade-level-item">
                  <span className="grade-level-item-label">Returning Students</span>
                  <span className="grade-level-item-count">
                    {safeFilter(Array.isArray(reportData) ? reportData : [], s => s.isNewStudent === 'old' && s.status === 'approved').length}
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
                    Array.isArray(reportData) ? reportData : [], 
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