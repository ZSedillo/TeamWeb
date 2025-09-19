const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  title: String,
  date: Date,
  created_at: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ['event', 'holiday'], // Enforces that the type can only be "event" or "holiday"
    required: true,
  },
});

const calendarModel = mongoose.model('calendar', calendarSchema);

module.exports = calendarModel;
