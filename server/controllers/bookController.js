const Book = require("../models/Book.js");

// Get all booking availabilities with slots information
const getBookingAvailability = async (req, res) => {
    try {
        const availabilityData = await Book.find().populate('appointments.slots.students');
        res.json(availabilityData);
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
};

// Get availability for specific date
const getAvailabilityByDate = async (req, res) => {
    try {
        const date = new Date(req.params.date);
        const result = await Book.findOne({
            'appointments.date': {
                $gte: new Date(date.setHours(0, 0, 0)),
                $lt: new Date(date.setHours(23, 59, 59))
            }
        }).populate('appointments.slots.students');

        if (!result) {
            return res.status(404).json({ message: "No availability found for this date" });
        }

        res.json(result.appointments);
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
};

// Add new booking availability with capacity
const addBookingAvailability = async (req, res) => {
    try {
        const { date, slots, purpose = "Student Registration" } = req.body;

        // Validate slots
        if (!slots || !Array.isArray(slots)) {
            return res.status(400).json({ error: "Slots array is required" });
        }

        // Create enhanced slots with capacity tracking
        const enhancedSlots = slots.map(slot => ({
            time: slot.time,
            capacity: slot.capacity || 3, // Default capacity
            booked: 0,
            students: []
        }));

        // Check for existing appointment on this date
        const existingAppointment = await Book.findOne({
            'appointments.date': new Date(date)
        });

        if (existingAppointment) {
            return res.status(400).json({ error: "Availability already exists for this date" });
        }

        // Create or update the document
        const result = await Book.findOneAndUpdate(
            {},
            {
                $push: {
                    appointments: {
                        date: new Date(date),
                        slots: enhancedSlots,
                        purpose
                    }
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(201).json({
            message: "Availability added with capacity tracking",
            data: result
        });
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
};

// Update booking availability (including capacities)
const editBookingAvailability = async (req, res) => {
    try {
        const { date, slots } = req.body;
        const appointmentId = req.params.id;

        // Validate slots
        if (!slots || !Array.isArray(slots)) {
            return res.status(400).json({ error: "Slots array is required" });
        }

        // Prepare updated slots (preserve existing bookings)
        const updatedSlots = await Promise.all(slots.map(async slot => {
            // Find existing slot to preserve bookings
            const existingAppointment = await Book.findOne({
                'appointments._id': appointmentId
            });
            
            const existingSlot = existingAppointment?.appointments
                .find(a => a._id.equals(appointmentId))
                ?.slots.find(s => s.time === slot.time);

            return {
                time: slot.time,
                capacity: slot.capacity,
                booked: existingSlot?.booked || 0,
                students: existingSlot?.students || []
            };
        }));

        const updatedAvailability = await Book.findOneAndUpdate(
            { 'appointments._id': appointmentId },
            {
                $set: {
                    'appointments.$.slots': updatedSlots,
                    'appointments.$.updatedAt': new Date()
                }
            },
            { new: true }
        );

        if (!updatedAvailability) {
            return res.status(404).json({ error: "Availability not found" });
        }

        res.json({
            message: "Availability updated with capacity",
            data: updatedAvailability
        });
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
};

// Book a student into a specific slot
const bookStudent = async (req, res) => {
    try {
        const { appointmentId, slotTime, studentId } = req.body;

        // Find the appointment
        const book = await Book.findOne({
            'appointments._id': appointmentId
        });

        if (!book) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        // Find the specific slot
        const appointment = book.appointments.find(a => a._id.equals(appointmentId));
        const slot = appointment.slots.find(s => s.time === slotTime);

        if (!slot) {
            return res.status(404).json({ error: "Time slot not found" });
        }

        // Check capacity
        if (slot.booked >= slot.capacity) {
            return res.status(400).json({ error: "This slot is already full" });
        }

        // Add booking
        slot.booked += 1;
        slot.students.push(studentId);
        await book.save();

        res.json({
            message: "Student booked successfully",
            remainingCapacity: slot.capacity - slot.booked
        });
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
};

module.exports = {
    getBookingAvailability,
    getAvailabilityByDate,
    addBookingAvailability,
    editBookingAvailability,
    bookStudent
};