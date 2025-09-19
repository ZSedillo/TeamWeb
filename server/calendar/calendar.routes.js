const express = require("express");
const { 
    getAllCalendarEntries, 
    addCalendarEntry, 
    editCalendarEntry, 
    deleteCalendarEntry,
    deletePreviousYearEntries
} = require("./calendar.controller");
const authenticate = require('../middleware/authMiddleware'); // Import the middleware

const router = express.Router();

// Routes
router.get("/", getAllCalendarEntries);
router.post("/add", authenticate, addCalendarEntry);
router.put("/edit/:id", authenticate, editCalendarEntry);
router.delete("/delete/:id", authenticate, deleteCalendarEntry);
router.delete("/delete-previous-year", authenticate, deletePreviousYearEntries); // New route to delete previous year

module.exports = router;
