const preRegistrationModel = require('./preRegistration.model');
const { sendApprovalEmail } = require('../service/emailService');
const bookModel = require('../book/book.model');

// Helper: Get filled count for a specific date and slot
async function getFilledCountForSlot(dateStr, slotTime) {
    const bookings = await preRegistrationModel.find({
        appointment_date: new Date(dateStr),
        preferred_time: slotTime
    });
    return bookings.length;
}

// GET all Pre-Registrations (Used for Reports & Main Table)
const getPreRegistrations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        // If limit is not provided, return ALL records (useful for reports)
        const limit = req.query.limit ? parseInt(req.query.limit) : null; 
        const skip = limit ? (page - 1) * limit : 0;

        let filterQuery = {};

        // Search Filter
        if (req.query.search) {
            filterQuery.$or = [
                { firstName: { $regex: req.query.search, $options: 'i' } },
                { lastName: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        // Year Filter (Default to current year if not specified, unless specifically asking for all)
        const currentYear = new Date().getFullYear().toString();
        if (req.query.registration_year) {
             filterQuery.registration_year = req.query.registration_year;
        } else if (!req.query.page) {
            // Logic: If fetching for reports (no pagination), default to current year
            filterQuery.registration_year = currentYear;
        }

        // Specific Filters
        if (req.query.grade) filterQuery.grade_level = req.query.grade;
        if (req.query.strand) filterQuery.strand = req.query.strand;
        if (req.query.type) filterQuery.isNewStudent = req.query.type;

        // Sorting
        let sortObject = { createdAt: -1 };
        if (req.query.search) sortObject = { lastName: 1, firstName: 1 };

        // Build Query
        let query = preRegistrationModel.find(filterQuery).sort(sortObject).skip(skip);
        if (limit) query = query.limit(limit);

        const records = await query;
        const totalRecords = await preRegistrationModel.countDocuments(filterQuery);

        res.json({
            totalRecords,
            totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
            currentPage: page,
            preregistration: records, // This array feeds the frontend
        });

    } catch (error) {
        console.error("Get PreRegistrations Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET - Get all Pre-Registrations with enrollment status as true (For Enrolled Page)
const getEnrolledPreRegistrations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const skip = (page - 1) * limit;

        let filterQuery = {};
        
        // Enrollment Filter
        if (req.query.enrollment === 'false') filterQuery.enrollment = false;
        else filterQuery.enrollment = true; // Default to true

        if (req.query.search) {
            filterQuery.$or = [
                { firstName: { $regex: req.query.search, $options: 'i' } },
                { lastName: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        if (req.query.grade) filterQuery.grade_level = req.query.grade;
        if (req.query.strand) filterQuery.strand = req.query.strand;
        if (req.query.year) filterQuery.registration_year = req.query.year;

        const records = await preRegistrationModel.find(filterQuery)
            .sort({ lastName: 1, firstName: 1 })
            .skip(skip)
            .limit(limit);

        const totalRecords = await preRegistrationModel.countDocuments(filterQuery);

        res.json({
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page,
            preregistration: records,
        });

    } catch (error) {
        console.error("Get Enrolled Error:", error);
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
    if (!firstName || !lastName) return res.status(400).json({ error: "Name is required." });

    if (!registration_year) {
        registration_year = new Date().getFullYear().toString();
    }

    try {
        const existingPreRegistration = await preRegistrationModel.findOne({ email });
        let preRegistrationData;

        // Common data object
        const studentData = {
            firstName, lastName, phone_number, age, gender, 
            birthdate: new Date(birthdate), strand, grade_level, 
            nationality, parent_guardian_name, parent_guardian_number, 
            isNewStudent, status: status ? status.toLowerCase() : 'pending',
            appointment_date, preferred_time, purpose_of_visit, 
            address, registration_year
        };

        if (existingPreRegistration) {
            preRegistrationData = await preRegistrationModel.findOneAndUpdate(
                { email },
                studentData,
                { new: true }
            );
        } else {
            preRegistrationData = new preRegistrationModel({
                ...studentData,
                email,
                enrollment: false
            });
            await preRegistrationData.save();
        }

        res.status(201).json({ message: "Pre-registration processed successfully", preregistration: preRegistrationData });
    } catch (error) {
        console.error("Add PreReg Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// PUT - Update Pre-Registration Status (Approved/Rejected)
const updatePreRegistrationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedRecord = await preRegistrationModel.findByIdAndUpdate(
            id, 
            { status: status.toLowerCase() }, 
            { new: true }
        );
        
        if (!updatedRecord) return res.status(404).json({ error: "Record not found" });

        if (status === 'approved') await sendApprovalEmail(updatedRecord);

        res.json({ message: "Status updated successfully", preregistration: updatedRecord });
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// PUT - Update Enrollment Status
const updatePreregistrationEnrollmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { enrollment } = req.body;

        const updatedRecord = await preRegistrationModel.findByIdAndUpdate(
            id,
            { enrollment },
            { new: true }
        );

        if (!updatedRecord) return res.status(404).json({ error: "Record not found" });

        res.json({ 
            message: "Enrollment updated successfully", 
            preregistration: updatedRecord 
        });
    } catch (error) {
        console.error("Update Enrollment Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// DELETE - Delete all Pre-Registrations
const deletePreRegistration = async (req, res) => {
    try {
        await preRegistrationModel.deleteMany({});
        res.status(200).json({ message: "All records deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// DELETE - Delete One
const deletePreRegistrationById = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRecord = await preRegistrationModel.findByIdAndDelete(id);
        if (!deletedRecord) return res.status(404).json({ error: "Record not found." });
        res.status(200).json({ message: "Record deleted successfully.", preregistration: deletedRecord });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// POST - Add Booking
const addBooking = async (req, res) => {
    const { email, appointment_date, preferred_time, purpose_of_visit } = req.body;
    
    if (!email || !appointment_date || !preferred_time) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    let bookingDate = new Date(appointment_date);
    if (isNaN(bookingDate.getTime())) return res.status(400).json({ error: "Invalid date." });
    
    bookingDate.setHours(0, 0, 0, 0);
    const dateStr = bookingDate.toISOString().split('T')[0];
    const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'long' });

    const session = await preRegistrationModel.startSession();
    session.startTransaction();
    
    try {
        const bookAvailability = await bookModel.findOne({}).session(session);
        let maxAllowed = 3; 
        if (bookAvailability?.availability?.[dayOfWeek]) {
            const slot = bookAvailability.availability[dayOfWeek].find(s => s.time === preferred_time);
            if (slot?.max) maxAllowed = slot.max;
        }

        const filled = await getFilledCountForSlot(dateStr, preferred_time);
        if (filled >= maxAllowed) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: `Time slot ${preferred_time} is full.` });
        }

        let user = await preRegistrationModel.findOne({ email }).session(session);
        if (!user) {
            user = new preRegistrationModel({
                email, appointment_date: bookingDate, preferred_time, purpose_of_visit,
                status: 'pending', enrollment: false
            });
            await user.save({ session });
        } else {
            user.appointment_date = bookingDate;
            user.preferred_time = preferred_time;
            if(purpose_of_visit) user.purpose_of_visit = purpose_of_visit;
            await user.save({ session });
        }
        
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ message: "Booking successful", user });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Booking Error:", error);
        res.status(500).json({ error: "Server error during booking." });
    }
};

module.exports = { 
    getPreRegistrations, 
    addPreRegistration, 
    updatePreRegistrationStatus, 
    updatePreregistrationEnrollmentStatus, 
    getEnrolledPreRegistrations, 
    addBooking, 
    deletePreRegistration, 
    deletePreRegistrationById 
};