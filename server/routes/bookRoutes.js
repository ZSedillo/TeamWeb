const express = require("express");
const { getBookingAvailability, addBookingAvailability, editBookingAvailability } = require("../controllers/bookController");

const router = express.Router();

router.get("/bookingAvailability", getBookingAvailability);
router.post("/addBookingAvailability", addBookingAvailability);
router.put("/editBookingAvailability/:id", editBookingAvailability);

module.exports = router;