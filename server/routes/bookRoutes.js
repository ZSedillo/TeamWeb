const express = require("express");
const { getBookingAvailability, addBookingAvailability, editBookingAvailability, getAllBookings } = require("../controllers/bookController");

const router = express.Router();

router.get("/bookingAvailability", getBookingAvailability);
router.post("/addBookingAvailability", addBookingAvailability);
router.put("/editBookingAvailability/:id", editBookingAvailability);
router.get("/getBookings", getAllBookings);

module.exports = router;
