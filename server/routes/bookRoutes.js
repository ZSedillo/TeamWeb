const express = require("express");
const { getBookingAvailability, addBookingAvailability, editBookingAvailability, getAllBookings } = require("../controllers/bookController");
const authenticate = require('../middleware/authMiddleware'); // Import the middleware

const router = express.Router();

router.get("/getBookings", getAllBookings);

// Protected Routes (require login)
router.get("/bookingAvailability", authenticate, getBookingAvailability);
router.post("/addBookingAvailability", authenticate, addBookingAvailability);
router.put("/editBookingAvailability/:id", authenticate, editBookingAvailability);

module.exports = router;
