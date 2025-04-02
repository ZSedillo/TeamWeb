import React, { useEffect, useState } from 'react';
import './ExpectedStudents.css';

const ExpectedStudents = () => {
    const [gradeData, setGradeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3000/preregistration');
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const data = await response.json();
                
                // Transform data into required format
                const groupedData = processPreRegistrationData(data.preregistration);
                setGradeData(groupedData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const predefinedGrades = [
        "Nursery",
        "Kinder 1",
        "Kinder 2",
        "Grade 1", "Grade 2", "Grade 3", "Grade 4",
        "Grade 5", "Grade 6", "Grade 7", "Grade 8",
        "Grade 9", "Grade 10", "Grade 11", "Grade 12"
    ];
    
    const gradeNameMap = {
        "Nursery": "Nursery",
        "Kinder1": "Kinder 1",
        "Kinder2": "Kinder 2",
        "1": "Grade 1",
        "2": "Grade 2",
        "3": "Grade 3",
        "4": "Grade 4",
        "5": "Grade 5",
        "6": "Grade 6",
        "7": "Grade 7",
        "8": "Grade 8",
        "9": "Grade 9",
        "10": "Grade 10",
        "11": "Grade 11",
        "12": "Grade 12"
    };
    
    const processPreRegistrationData = (data) => {
        const actualDataMap = {};
    
        // Process actual data from the database
        data.forEach(student => {
            const { grade_level, strand, status } = student;
            const isApproved = status === 'approved';
    
            // Convert database format to correct format
            const formattedGrade = gradeNameMap[grade_level] || grade_level;
    
            if (!actualDataMap[formattedGrade]) {
                actualDataMap[formattedGrade] = { 
                    grade: formattedGrade, 
                    approvedCount: 0, 
                    pendingCount: 0, 
                    strands: {} 
                };
            }
    
            if (strand) {
                if (!actualDataMap[formattedGrade].strands[strand]) {
                    actualDataMap[formattedGrade].strands[strand] = { 
                        name: strand, 
                        approvedCount: 0, 
                        pendingCount: 0 
                    };
                }
                isApproved ? actualDataMap[formattedGrade].strands[strand].approvedCount++ 
                           : actualDataMap[formattedGrade].strands[strand].pendingCount++;
            } else {
                isApproved ? actualDataMap[formattedGrade].approvedCount++ 
                           : actualDataMap[formattedGrade].pendingCount++;
            }
        });
    
        // Ensure all predefined grades exist, but don't override actual data
        const result = predefinedGrades.map(gradeName => {
            if (actualDataMap[gradeName]) {
                return {
                    ...actualDataMap[gradeName],
                    strands: Object.values(actualDataMap[gradeName].strands)
                };
            }
            // If grade doesn't exist in the database, add it with 0 values
            return {
                grade: gradeName,
                approvedCount: 0,
                pendingCount: 0,
                strands: []
            };
        });
    
        return result;
    };
    
    
    
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="content-container">
            <div className="page-header">
                <h1>Students Overview</h1>
                <p>Track approved and pending students per grade level</p>
            </div>

            <div className="data-table-container">
                <div className="table-wrapper">
                    <table className="expected-students-table">
                        <thead>
                            <tr>
                                <th>Grade Level</th>
                                <th>Strand</th>
                                <th>Approved</th>
                                <th>Pending</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                        {gradeData.map((grade) => {
                            if (grade.strands.length > 0) {
                                return grade.strands.map((strand, index) => {
                                    const total = strand.approvedCount + strand.pendingCount;
                                    // Check if both counts are 0
                                    const status = total === 0 ? 'Processing' : (strand.pendingCount > 0 ? 'Processing' : 'Complete');
                                    return (
                                        <tr key={`${grade.grade}-${strand.name}`}>
                                            {index === 0 && (
                                                <td rowSpan={grade.strands.length}>{grade.grade}</td>
                                            )}
                                            <td>{strand.name}</td>
                                            <td>{strand.approvedCount}</td>
                                            <td>{strand.pendingCount}</td>
                                            <td>{total}</td>
                                            <td>
                                                <button className={`btn-status ${status === 'Processing' ? 'pending' : 'approved'}`}>
                                                    {status}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                });
                            } else {
                                const total = grade.approvedCount + grade.pendingCount;
                                // Check if both counts are 0
                                const status = total === 0 ? 'Processing' : (grade.pendingCount > 0 ? 'Processing' : 'Complete');
                                return (
                                    <tr key={grade.grade}>
                                        <td>{grade.grade}</td>
                                        <td>-</td>
                                        <td>{grade.approvedCount}</td>
                                        <td>{grade.pendingCount}</td>
                                        <td>{total}</td>
                                        <td>
                                            <button className={`btn-status ${status === 'Processing' ? 'pending' : 'approved'}`}>
                                                {status}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }
                        })}
                    </tbody>

                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExpectedStudents;