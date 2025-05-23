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

// Add new booking availability
const addBookingAvailability = async (req, res) => {
    try {
        const { availability, limits } = req.body;
        const newAvailability = new Book({ availability, limits });
        await newAvailability.save();
        res.json(newAvailability);
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
};

// Edit (or delete) booking availability
const editBookingAvailability = async (req, res) => {
    try {
        const { availability, limits } = req.body;
        const updateFields = { availability };
        if (limits !== undefined) updateFields.limits = limits;
        const updatedAvailability = await Book.findByIdAndUpdate(
            req.params.id,
            updateFields,
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
    addBookingAvailability,
    editBookingAvailability,
    bookStudent
};