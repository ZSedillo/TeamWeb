const reportModel = require('./report.model');

// Get all reports
const viewReports = async (req, res) => {
    try {
        const reports = await reportModel.find({});
        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Search reports with filters
const searchReports = async (req, res) => {
    try {
        const { username, year, month, time } = req.query;
        
        // Build query object
        const query = {};
        
        // Add username filter if provided
        if (username) {
            query.username = { $regex: username, $options: 'i' }; // Case-insensitive search
        }
        
        // Add year filter if provided
        if (year) {
            const yearNum = parseInt(year, 10);
            if (!isNaN(yearNum)) {
                query.time = {
                    $expr: {
                        $eq: [{ $year: "$time" }, yearNum]
                    }
                };
            }
        }
        
        // Add month filter if provided
        if (month) {
            const monthNum = parseInt(month, 10);
            if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
                // If we already have a time query for year, we need to add month to it
                if (query.time) {
                    query.time.$expr = {
                        $and: [
                            query.time.$expr,
                            { $eq: [{ $month: "$time" }, monthNum] }
                        ]
                    };
                } else {
                    query.time = {
                        $expr: {
                            $eq: [{ $month: "$time" }, monthNum]
                        }
                    };
                }
            }
        }
        
        // Add time (hour) filter if provided
        if (time) {
            const hourNum = parseInt(time, 10);
            if (!isNaN(hourNum) && hourNum >= 0 && hourNum <= 23) {
                // If we already have a time query, we need to add hour to it
                if (query.time) {
                    const existingExpr = query.time.$expr;
                    // Check if we already have an $and operator
                    if (existingExpr.$and) {
                        existingExpr.$and.push({ $eq: [{ $hour: "$time" }, hourNum] });
                    } else {
                        query.time.$expr = {
                            $and: [
                                existingExpr,
                                { $eq: [{ $hour: "$time" }, hourNum] }
                            ]
                        };
                    }
                } else {
                    query.time = {
                        $expr: {
                            $eq: [{ $hour: "$time" }, hourNum]
                        }
                    };
                }
            }
        }
        
        const reports = await reportModel.find(query).sort({ time: -1 });
        res.status(200).json(reports);
    } catch (error) {
        console.error('Error searching reports:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Add a new report
const addReport = async (req, res) => {
    try {
        const { username, activityLog } = req.body;
        
        if (!username || !activityLog) {
            return res.status(400).json({ error: 'Username and activityLog are required' });
        }
        
        const newReport = new reportModel({ username, activityLog });
        await newReport.save();
        
        res.status(201).json({ message: 'Report added successfully', report: newReport });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete all reports
const deleteReports = async (req, res) => {
    try {
        await reportModel.deleteMany({});
        res.status(200).json({ message: 'All reports deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    viewReports,
    searchReports,
    addReport,
    deleteReports
};