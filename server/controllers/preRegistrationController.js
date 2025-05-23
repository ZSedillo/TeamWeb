const preRegistrationModel = require('../models/PreRegistration');
const { sendApprovalEmail } = require('../service/emailService');
const bookModel = require('../models/Book');

// Helper: Get filled count for a specific date and slot
async function getFilledCountForSlot(dateStr, slotTime) {
    // dateStr: 'YYYY-MM-DD', slotTime: 'HH:mm'
    const bookings = await preRegistrationModel.find({
        appointment_date: new Date(dateStr),
        preferred_time: slotTime
    });
    return bookings.length;
}

// GET all Pre-Registrations (with pagination & filters)
const getPreRegistrations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : null; // No default limit
        const skip = limit ? (page - 1) * limit : 0;

        let filterQuery = {};

        if (req.query.search) {
            filterQuery.$or = [
                { firstName: { $regex: req.query.search, $options: 'i' } },
                { lastName: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        // Check if the user has provided a registration year, otherwise set it to the current year
        const currentYear = new Date().getFullYear().toString();
        if (req.query.registration_year) {
             filterQuery.registration_year = req.query.registration_year;
        } else {
            filterQuery.registration_year = currentYear; // Default to current year
        }
        if (req.query.grade) filterQuery.grade_level = req.query.grade;
        if (req.query.strand) filterQuery.strand = req.query.strand;
        if (req.query.type) filterQuery.isNewStudent = req.query.type;

        let sortObject = { createdAt: -1 };
        if (req.query.search) sortObject = { name: 1 };
        else if (req.query.grade) sortObject = { grade_level: 1, name: 1 };
        else if (req.query.strand) sortObject = { strand: 1, name: 1 };
        else if (req.query.type) sortObject = { isNewStudent: 1, name: 1 };

        console.log('Received year:', req.query.year);

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
        firstName, lastName, phone_number, age, gender, birthdate, strand, grade_level, email,
        status, appointment_date, nationality, parent_guardian_name, parent_guardian_number,
        preferred_time, purpose_of_visit, isNewStudent, address, registration_year
    } = req.body;

    if (!grade_level) return res.status(400).json({ error: "Grade level is required." });
    if (!isNewStudent || !['new', 'old'].includes(isNewStudent)) return res.status(400).json({ error: "isNewStudent must be 'new' or 'old'." });
    if (!gender || !['Male', 'Female'].includes(gender)) return res.status(400).json({ error: "Gender must be 'Male' or 'Female'." });
    if (!birthdate || isNaN(Date.parse(birthdate))) return res.status(400).json({ error: "Invalid birthdate format." });
    if (!firstName) return res.status(400).json({ error: "First name is required." });
    if (!lastName) return res.status(400).json({ error: "Last name is required." });

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (status && !validStatuses.includes(status.toLowerCase())) return res.status(400).json({ error: `Invalid status value.` });

    // Set default registration year if not provided
    if (!registration_year) {
        registration_year = new Date().getFullYear().toString();
    }

    try {
        const existingPreRegistration = await preRegistrationModel.findOne({ email });
        let preRegistrationData;

        if (existingPreRegistration) {
            preRegistrationData = await preRegistrationModel.findOneAndUpdate(
                { email },
                { 
                    firstName,
                    lastName,
                    phone_number, 
                    age, 
                    gender, 
                    birthdate: new Date(birthdate), 
                    strand, 
                    grade_level, 
                    nationality,
                    parent_guardian_name, 
                    parent_guardian_number, 
                    isNewStudent, 
                    status: status ? status.toLowerCase() : 'pending',
                    appointment_date, 
                    preferred_time, 
                    purpose_of_visit, 
                    address,
                    registration_year
                },
                { new: true }
            );
        } else {
            preRegistrationData = new preRegistrationModel({
                firstName,
                lastName,
                phone_number, 
                age, 
                gender, 
                birthdate: new Date(birthdate), 
                strand, 
                grade_level, 
                email,
                nationality, 
                parent_guardian_name, 
                parent_guardian_number, 
                isNewStudent,
                status: status ? status.toLowerCase() : 'pending', 
                appointment_date, 
                preferred_time, 
                purpose_of_visit,
                enrollment: false, // Ensure enrollment is explicitly set to false
                registration_year, // Now defined and initialized above
                address
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

// Update Enrollment Status for Pre-Registration Record
const updatePreregistrationEnrollmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { enrollment } = req.body;
        console.log("Incoming enrollment update:", { id, enrollment });

        const updatedRecord = await preRegistrationModel.findByIdAndUpdate(
            id,
            { enrollment },
            { new: true }
        );

        if (!updatedRecord) {
            return res.status(404).json({ error: "Pre-registration record not found" });
        }

        res.json({
            message: "Enrollment status updated successfully",
            preregistration: updatedRecord
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// GET - Get all Pre-Registrations with enrollment status as true
const getEnrolledPreRegistrations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const skip = limit ? (page - 1) * limit : 0;

        // Filter to get only enrolled students (or specified by query param)
        let filterQuery = {};
        
        // Handle the enrollment filter explicitly
        if (req.query.enrollment === 'true') {
            filterQuery.enrollment = true;
        } else if (req.query.enrollment === 'false') {
            filterQuery.enrollment = false;
        } else {
            // Default behavior - show all enrolled students
            filterQuery.enrollment = true;
        }

        // Apply search filter if provided
        if (req.query.search) {
            // Search in both firstName and lastName fields
            filterQuery.$or = [
                { firstName: { $regex: req.query.search, $options: 'i' } },
                { lastName: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        // Apply grade filter if provided
        if (req.query.grade) {
            filterQuery.grade_level = req.query.grade;
        }
        
        // Apply strand filter if provided
        if (req.query.strand) {
            filterQuery.strand = req.query.strand;
        }
        
        // Apply year filter if provided
        if (req.query.year) {
            filterQuery.registration_year = req.query.year;
        }

        let sortObject = { createdAt: -1 }; // Default sort by most recent
        
        // If grade was applied as a filter, sort appropriately
        if (req.query.grade) {
            const aggregationPipeline = [
                { $match: filterQuery },
                {
                    $addFields: {
                        gradeOrder: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$grade_level", "Kinder"] }, then: 0 },
                                    { case: { $eq: ["$grade_level", "1"] }, then: 1 },
                                    { case: { $eq: ["$grade_level", "2"] }, then: 2 },
                                    { case: { $eq: ["$grade_level", "3"] }, then: 3 },
                                    { case: { $eq: ["$grade_level", "4"] }, then: 4 },
                                    { case: { $eq: ["$grade_level", "5"] }, then: 5 },
                                    { case: { $eq: ["$grade_level", "6"] }, then: 6 },
                                    { case: { $eq: ["$grade_level", "7"] }, then: 7 },
                                    { case: { $eq: ["$grade_level", "8"] }, then: 8 },
                                    { case: { $eq: ["$grade_level", "9"] }, then: 9 },
                                    { case: { $eq: ["$grade_level", "10"] }, then: 10 },
                                    { case: { $eq: ["$grade_level", "11"] }, then: 11 },
                                    { case: { $eq: ["$grade_level", "12"] }, then: 12 }
                                ],
                                default: 100
                            }
                        },
                        // Add computed fullName for sorting
                        fullName: { $concat: ["$lastName", " ", "$firstName"] }
                    }
                },
                { $sort: { gradeOrder: 1, fullName: 1 } },
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

        // For other queries, use the standard find operation with name sorting
        let query = preRegistrationModel.find(filterQuery)
            .sort({ lastName: 1, firstName: 1 }) // Sort by last name then first name
            .skip(skip);
            
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

// DELETE - Delete all Pre-Registrations
const deletePreRegistration = async (req, res) => {
    try {
        // Delete all pre-registration records
        const result = await preRegistrationModel.deleteMany({});

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "No pre-registration records found to delete." });
        }

        res.status(200).json({ message: "All pre-registration records deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// DELETE - Delete a specific Pre-Registration by ID
const deletePreRegistrationById = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRecord = await preRegistrationModel.findByIdAndDelete(id);

        if (!deletedRecord) {
            return res.status(404).json({ error: "Pre-registration record not found." });
        }

        res.status(200).json({ message: "Pre-registration record deleted successfully.", preregistration: deletedRecord });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};


// POST - Add Booking
const addBooking = async (req, res) => {
    const { email, appointment_date, preferred_time, purpose_of_visit } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required to update the booking." });
    if (!appointment_date) return res.status(400).json({ error: "Appointment date is required." });
    if (!preferred_time) return res.status(400).json({ error: "Preferred time is required." });

    // Normalize appointment_date to date-only (midnight)
    let bookingDate = new Date(appointment_date);
    if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ error: "Invalid appointment date format." });
    }
    bookingDate.setHours(0, 0, 0, 0); // Normalize to midnight
    const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'long' });
    const timeSlot = preferred_time;
    const dateStr = bookingDate.toISOString().split('T')[0];

    const session = await preRegistrationModel.startSession();
    session.startTransaction();
    try {
        // Get max allowed for this slot from Book model
        const bookAvailability = await bookModel.findOne({}).session(session);
        let maxAllowed = 3; // default
        if (bookAvailability && bookAvailability.availability && bookAvailability.availability[dayOfWeek]) {
            const slot = bookAvailability.availability[dayOfWeek].find(s => s.time === timeSlot);
            if (slot && slot.max) maxAllowed = slot.max;
        }

        // Use the new filled count logic
        const filled = await getFilledCountForSlot(dateStr, timeSlot);
        if (filled >= maxAllowed) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: `Time slot ${timeSlot} is already full.` });
        }

        let user = await preRegistrationModel.findOne({ email }).session(session);
        if (!user) {
            // Create a new pre-registration record with minimal info
            user = new preRegistrationModel({
                email,
                appointment_date: bookingDate,
                preferred_time: timeSlot,
                purpose_of_visit,
                status: 'pending',
                enrollment: false
            });
            await user.save({ session });
        } else {
            user.appointment_date = bookingDate;
            user.preferred_time = timeSlot;
            user.purpose_of_visit = purpose_of_visit || user.purpose_of_visit;
            await user.save({ session });
        }
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ message: "Appointment updated successfully", user });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Booking error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Server error during booking. Please check your input and try again." });
    }
};

module.exports = { getPreRegistrations, addPreRegistration, updatePreRegistrationStatus, updatePreregistrationEnrollmentStatus, getEnrolledPreRegistrations, addBooking, deletePreRegistration, deletePreRegistrationById };
