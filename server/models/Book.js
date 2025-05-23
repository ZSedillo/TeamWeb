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
  limits: {
    Monday: { type: Map, of: Number },
    Tuesday: { type: Map, of: Number },
    Wednesday: { type: Map, of: Number },
    Thursday: { type: Map, of: Number },
    Friday: { type: Map, of: Number },
    Saturday: { type: Map, of: Number },
    Sunday: { type: Map, of: Number },
  },
});

// Add a virtual for slotFilledCount
bookSchema.virtual('slotFilledCount').get(function() {
  // This is a placeholder. Actual counting should be done in the controller using the PreRegistration model.
  // You can remove this if you want to keep logic in the controller only.
  return null;
});

const bookModel = mongoose.model("book", bookSchema);

module.exports = bookModel;