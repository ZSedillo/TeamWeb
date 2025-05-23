const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  availability: {
    Monday: [{
      time: String,
      max: { type: Number, default: 3 }, // default max bookings per slot
    }],
    Tuesday: [{ time: String, max: { type: Number, default: 3 } }],
    Wednesday: [{ time: String, max: { type: Number, default: 3 } }],
    Thursday: [{ time: String, max: { type: Number, default: 3 } }],
    Friday: [{ time: String, max: { type: Number, default: 3 } }],
    Saturday: [{ time: String, max: { type: Number, default: 3 } }],
    Sunday: [{ time: String, max: { type: Number, default: 3 } }],
  },
});

const bookModel = mongoose.model("book", bookSchema);

module.exports = bookModel;

