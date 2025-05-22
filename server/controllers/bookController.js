const bookModel = require("../models/Book.js");

// Fetch all booking availabilities
const getBookingAvailability = async (req, res) => {
    try {
        const availabilityData = await bookModel.find();
        res.json(availabilityData);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// Add new booking availability
// const addBookingAvailability = async (req, res) => {
//     try {
//         const { availability } = req.body;
//         const newAvailability = new bookModel({ availability });
//         await newAvailability.save();

//         res.status(201).json({ message: "Availability added", data: newAvailability });
//     } catch (error) {
//         res.status(500).json({ error: "Server error" });
//     }
// };

const addBookingAvailability = async (req, res) => {
    try {
        const { availability, limits } = req.body;

        const newAvailability = new bookModel({ availability });

        // Optional: Add limits only if provided
        if (limits) {
            newAvailability.limits = limits;
        }

        await newAvailability.save();

        res.status(201).json({ message: "Availability added", data: newAvailability });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};


// Edit (or delete) booking availability
const editBookingAvailability = async (req, res) => {
    try {
        const { availability } = req.body;
        const updatedAvailability = await bookModel.findByIdAndUpdate(
            req.params.id,
            { availability },
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
