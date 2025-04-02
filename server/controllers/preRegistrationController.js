const preRegistrationModel = require('../models/PreRegistration');
const { sendApprovalEmail } = require('../service/emailService');

// GET all Pre-Registrations (with pagination & filters)
const getPreRegistrations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : null; // No default limit
        const skip = limit ? (page - 1) * limit : 0;

        let filterQuery = {};

        if (req.query.search) {
            filterQuery.name = { $regex: req.query.search, $options: 'i' };
        }
        if (req.query.grade) filterQuery.grade_level = req.query.grade;
        if (req.query.strand) filterQuery.strand = req.query.strand;
        if (req.query.type) filterQuery.isNewStudent = req.query.type;

        let sortObject = { createdAt: -1 };
        if (req.query.search) sortObject = { name: 1 };
        else if (req.query.grade) sortObject = { grade_level: 1, name: 1 };
        else if (req.query.strand) sortObject = { strand: 1, name: 1 };
        else if (req.query.type) sortObject = { isNewStudent: 1, name: 1 };

        if (req.query.grade) {
            const aggregationPipeline = [
                { $match: filterQuery },
                {
                    $addFields: {
                        gradeOrder: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$grade_level", "Nursery"] }, then: -3 },
                                    { case: { $eq: ["$grade_level", "Kinder 1"] }, then: -2 },
                                    { case: { $eq: ["$grade_level", "Kinder 2"] }, then: -1 },
                                    { case: { $eq: ["$grade_level", "1"] }, then: 1 },
                                    { case: { $eq: ["$grade_level", "12"] }, then: 12 }
                                ],
                                default: 100
                            }
                        }
                    }
                },
                { $sort: { gradeOrder: 1, name: 1 } },
                { $skip: skip },
                ...(limit ? [{ $limit: limit }] : []) // Apply limit only if specified
            ];

            const records = await preRegistrationModel.aggregate(aggregationPipeline);
            const totalRecords = await preRegistrationModel.countDocuments(filterQuery);

            return res.json({
                totalRecords,
                totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
                currentPage: page,
                preregistration: records,
            });
        }

        let query = preRegistrationModel.find(filterQuery).sort(sortObject).skip(skip);
        if (limit) query = query.limit(limit); // Apply limit only if specified

        const records = await query;
        const totalRecords = await preRegistrationModel.countDocuments(filterQuery);

        res.json({
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page,
            preregistration: records,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};


// POST - Add a new Pre-Registration
const addPreRegistration = async (req, res) => {
    let {
        name, phone_number, age, gender, birthdate, strand, grade_level, email,
        status, appointment_date, nationality, parent_guardian_name, parent_guardian_number,
        preferred_time, purpose_of_visit, isNewStudent
    } = req.body;

    if (!grade_level) return res.status(400).json({ error: "Grade level is required." });
    if (!isNewStudent || !['new', 'old'].includes(isNewStudent)) return res.status(400).json({ error: "isNewStudent must be 'new' or 'old'." });
    if (!gender || !['Male', 'Female'].includes(gender)) return res.status(400).json({ error: "Gender must be 'Male' or 'Female'." });
    if (!birthdate || isNaN(Date.parse(birthdate))) return res.status(400).json({ error: "Invalid birthdate format." });

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (status && !validStatuses.includes(status.toLowerCase())) return res.status(400).json({ error: `Invalid status value.` });

    try {
        const existingPreRegistration = await preRegistrationModel.findOne({ email });
        let preRegistrationData;

        if (existingPreRegistration) {
            preRegistrationData = await preRegistrationModel.findOneAndUpdate(
                { email },
                { name, phone_number, age, gender, birthdate: new Date(birthdate), strand, grade_level, nationality,
                  parent_guardian_name, parent_guardian_number, isNewStudent, status: status ? status.toLowerCase() : 'pending',
                  appointment_date, preferred_time, purpose_of_visit },
                { new: true }
            );
        } else {
            preRegistrationData = new preRegistrationModel({
                name, phone_number, age, gender, birthdate: new Date(birthdate), strand, grade_level, email,
                nationality, parent_guardian_name, parent_guardian_number, isNewStudent,
                status: status ? status.toLowerCase() : 'pending', appointment_date, preferred_time, purpose_of_visit
            });

            await preRegistrationData.save();
        }

        res.status(201).json({ message: "Pre-registration processed successfully", preregistration: preRegistrationData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// PUT - Update Pre-Registration Status
const updatePreRegistrationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.status) {
            const validStatuses = ['pending', 'approved', 'rejected'];
            if (!validStatuses.includes(updateData.status.toLowerCase())) {
                return res.status(400).json({ error: `Invalid status value.` });
            }
            updateData.status = updateData.status.toLowerCase();
        }

        const updatedRecord = await preRegistrationModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedRecord) return res.status(404).json({ error: "Pre-registration record not found" });

        if (updateData.status === 'approved') await sendApprovalEmail(updatedRecord);

        res.json({ message: "Pre-registration updated successfully", preregistration: updatedRecord });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// POST - Add Booking
const addBooking = async (req, res) => {
    const { email, appointment_date, preferred_time, purpose_of_visit } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required to update the booking." });

    try {
        const user = await preRegistrationModel.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found. Please register first." });

        user.appointment_date = appointment_date || user.appointment_date;
        user.preferred_time = preferred_time || user.preferred_time;
        user.purpose_of_visit = purpose_of_visit || user.purpose_of_visit;

        await user.save();
        res.status(200).json({ message: "Appointment updated successfully", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { getPreRegistrations, addPreRegistration, updatePreRegistrationStatus, addBooking };
