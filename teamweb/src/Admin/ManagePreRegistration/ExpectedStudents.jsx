import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReportData } from '../../_actions/preRegistration.actions';
import './ExpectedStudents.css';

const ExpectedStudents = () => {
    const dispatch = useDispatch();
    const { reportData, loading, error } = useSelector(state => state.preRegistration);
    
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [availableYears, setAvailableYears] = useState([]);
    const [gradeData, setGradeData] = useState([]);

    useEffect(() => {
        const years = [];
        for (let year = 2020; year <= currentYear; year++) years.push(year);
        setAvailableYears(years);
    }, [currentYear]);

    useEffect(() => {
        dispatch(fetchReportData(selectedYear));
    }, [dispatch, selectedYear]);

    useEffect(() => {
        if (reportData && Array.isArray(reportData)) {
            setGradeData(processPreRegistrationData(reportData));
        }
    }, [reportData]);

    // Data Processing logic (Keep as is)
    const predefinedGrades = ["Kinder", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
    const gradeNameMap = { "Kinder": "Kinder", "1": "Grade 1", "2": "Grade 2", "3": "Grade 3", "4": "Grade 4", "5": "Grade 5", "6": "Grade 6", "7": "Grade 7", "8": "Grade 8", "9": "Grade 9", "10": "Grade 10", "11": "Grade 11", "12": "Grade 12" };

    const processPreRegistrationData = (data) => {
        const actualDataMap = {};
        data.forEach(student => {
            const { grade_level, strand, status } = student;
            const isApproved = status === 'approved';
            const formattedGrade = gradeNameMap[grade_level] || grade_level;

            if (!actualDataMap[formattedGrade]) {
                actualDataMap[formattedGrade] = { grade: formattedGrade, approvedCount: 0, pendingCount: 0, strands: {} };
            }

            if (strand) {
                if (!actualDataMap[formattedGrade].strands[strand]) {
                    actualDataMap[formattedGrade].strands[strand] = { name: strand, approvedCount: 0, pendingCount: 0 };
                }
                isApproved ? actualDataMap[formattedGrade].strands[strand].approvedCount++ : actualDataMap[formattedGrade].strands[strand].pendingCount++;
            } else {
                isApproved ? actualDataMap[formattedGrade].approvedCount++ : actualDataMap[formattedGrade].pendingCount++;
            }
        });

        return predefinedGrades.map(gradeName => {
            if (actualDataMap[gradeName]) {
                return { ...actualDataMap[gradeName], strands: Object.values(actualDataMap[gradeName].strands) };
            }
            return { grade: gradeName, approvedCount: 0, pendingCount: 0, strands: [] };
        });
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="content-container">
            <div className="page-header">
                <h1>Students Overview</h1>
                <div className="filters">
                    <div className="year-filter">
                        <label>School Year:</label>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                            {availableYears.map(year => <option key={year} value={year}>{year} - {year + 1}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <div className="data-table-container">
                <div className="table-wrapper">
                    <table className="expected-students-table">
                        <thead><tr><th>Grade</th><th>Strand</th><th>Approved</th><th>Pending</th><th>Total</th><th>Status</th></tr></thead>
                        <tbody>
                            {gradeData.map((grade) => {
                                if (grade.strands.length > 0) {
                                    return grade.strands.map((strand, index) => (
                                        <tr key={`${grade.grade}-${strand.name}`}>
                                            {index === 0 && <td rowSpan={grade.strands.length}>{grade.grade}</td>}
                                            <td>{strand.name}</td><td>{strand.approvedCount}</td><td>{strand.pendingCount}</td>
                                            <td>{strand.approvedCount + strand.pendingCount}</td>
                                            <td>{(strand.approvedCount + strand.pendingCount) > 0 ? 'Active' : 'Empty'}</td>
                                        </tr>
                                    ));
                                }
                                return (
                                    <tr key={grade.grade}>
                                        <td>{grade.grade}</td><td>-</td><td>{grade.approvedCount}</td><td>{grade.pendingCount}</td>
                                        <td>{grade.approvedCount + grade.pendingCount}</td>
                                        <td>{(grade.approvedCount + grade.pendingCount) > 0 ? 'Active' : 'Empty'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default ExpectedStudents;