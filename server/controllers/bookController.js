const bookModel = require("../models/Book.js");
const preRegistrationModel = require("../models/PreRegistration.js");

// Helper: Get filled count for each slot for the next 7 days
async function getFilledCountsForSlots() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(today.getDate() + 7);

    const bookings = await preRegistrationModel.find({
        appointment_date: { $gte: today, $lt: end },
        preferred_time: { $ne: null }
    });

    const filledMap = {};
    bookings.forEach(b => {
        if (!b.appointment_date || !b.preferred_time) return;
        const dateStr = b.appointment_date instanceof Date
            ? b.appointment_date.toISOString().split('T')[0]
            : (typeof b.appointment_date === 'string' && b.appointment_date.includes('T')
                ? b.appointment_date.split('T')[0]
                : b.appointment_date);
        if (!filledMap[dateStr]) filledMap[dateStr] = {};
        const slotTime = typeof b.preferred_time === 'object' && b.preferred_time.time ? b.preferred_time.time : b.preferred_time;
        filledMap[dateStr][slotTime] = (filledMap[dateStr][slotTime] || 0) + 1;
    });
    return filledMap;
}

// Fetch all booking availabilities with filled counts for each slot for the next 7 days
const getBookingAvailability = async (req, res) => {
    try {
        const filledCounts = await getFilledCountsForSlots();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const dateStr = date.toISOString().split('T')[0];
            // Get all bookModel entries (should be only one, but support multiple)
            const books = await bookModel.find();
            let slots = [];
            books.forEach(book => {
                if (book.availability && book.availability[dayName]) {
                    book.availability[dayName].forEach(slot => {
                        const slotTime = slot.time;
                        const max = typeof slot.max === 'number' ? slot.max : 3;
                        const filled = (filledCounts[dateStr] && filledCounts[dateStr][slotTime]) || 0;
                        slots.push({ time: slotTime, max, filled });
                    });
                }
            });
            // Remove duplicate slots by time (keep the first occurrence)
            const seen = new Set();
            slots = slots.filter(slot => {
                if (seen.has(slot.time)) return false;
                seen.add(slot.time);
                return true;
            });
            result.push({ date: dateStr, day: dayName, slots });
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// Add new booking availability
const addBookingAvailability = async (req, res) => {
    try {
        const { availability, limits } = req.body;

        const newAvailability = new bookModel({ availability, limits });

        await newAvailability.save();

        res.status(201).json({ message: "Availability added", data: newAvailability });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// Edit (or delete) booking availability
const editBookingAvailability = async (req, res) => {
    try {
        const { availability, limits } = req.body;
        const updateFields = { availability };
        if (limits !== undefined) updateFields.limits = limits;
        const updatedAvailability = await bookModel.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
        );

        if (!updatedAvailability) {
            return res.status(404).json({ error: "Availability not found" });
        }

        res.json({ message: "Availability updated", data: updatedAvailability });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { getBookingAvailability, addBookingAvailability, editBookingAvailability };
