// const express = require("express");
// const { getBookingAvailability, addBookingAvailability, editBookingAvailability } = require("../controllers/bookController");

// const router = express.Router();

// router.get("/bookingAvailability", getBookingAvailability);
// router.post("/addBookingAvailability", addBookingAvailability);
// router.put("/editBookingAvailability/:id", editBookingAvailability);

// module.exports = router;


const express = require("express");
const {
  getBookingAvailability,
  getAvailabilityByDate,
  addBookingAvailability,
  editBookingAvailability,
  bookStudent,
  getSlotAvailability,
  cancelBooking
} = require("../controllers/bookController");

const router = express.Router();

// Get all availability data
router.get("/bookingAvailability", getBookingAvailability);

// Get availability for specific date
router.get("/availability/:date", getAvailabilityByDate);

// Get specific slot availability
router.get("/availability/:date/:time", getSlotAvailability);

// Add new availability (with capacity)
router.post("/addBookingAvailability", addBookingAvailability);

// Update existing availability
router.put("/editBookingAvailability/:id", editBookingAvailability);

// Book a student into a slot
router.post("/book", bookStudent);

// Cancel a booking
router.delete("/cancel/:appointmentId/:slotTime/:studentId", cancelBooking);

module.exports = router;  