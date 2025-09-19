const express = require("express");
const { getBookingAvailability, addBookingAvailability, editBookingAvailability, getAllBookings } = require("./book.controller");
const authenticate = require('../middleware/authMiddleware'); // Import the middleware

const router = express.Router();

router.get("/getBookings", getAllBookings);
router.get("/bookingAvailability", getBookingAvailability);

// Protected Routes (require login)
router.post("/addBookingAvailability", authenticate, addBookingAvailability);
router.put("/editBookingAvailability/:id", authenticate, editBookingAvailability);

module.exports = router;
