// filepath: d:\TeamWeb\server\controllers\bookController.js
const bookModel = require("./book.model");
const preRegistrationModel = require("../preregistration/preRegistration.model");

// Helper: Get filled count for each slot for the next 7 days
async function getFilledCountsForSlots(availability) {
    // Get all bookings for the next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(today.getDate() + 7);

    // Fetch all bookings in the next 7 days
    const bookings = await preRegistrationModel.find({
        appointment_date: { $gte: today, $lt: end },
        preferred_time: { $ne: null }
    });

    // Build a map: { 'YYYY-MM-DD': { '09:00': count, ... }, ... }
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
        const availabilityData = await bookModel.find();
        const filledCounts = await getFilledCountsForSlots();
        // For each bookModel, for each day, for each slot, add filled count for each of the next 7 days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = availabilityData.map(book => {
            const newAvailability = {};
            for (const day of Object.keys(book.availability)) {
                newAvailability[day] = book.availability[day].map(slot => {
                    // For each of the next 7 days, if the day matches, add filled count
                    const slotWithFilled = { ...slot._doc };
                    slotWithFilled.filled = 0; // default
                    for (let i = 0; i < 7; i++) {
                        const date = new Date(today);
                        date.setDate(today.getDate() + i);
                        if (date.toLocaleDateString('en-US', { weekday: 'long' }) === day) {
                            const dateStr = date.toISOString().split('T')[0];
                            slotWithFilled.filled = (filledCounts[dateStr] && filledCounts[dateStr][slot.time]) || 0;
                            break;
                        }
                    }
                    return slotWithFilled;
                });
            }
            return { ...book.toObject(), availability: newAvailability };
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// ...existing code for addBookingAvailability and editBookingAvailability...

module.exports = { getBookingAvailability, addBookingAvailability, editBookingAvailability };
