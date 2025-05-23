const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  time: { 
    type: String, 
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // Validates HH:MM format
  },
  capacity: { 
    type: Number, 
    required: true,
    min: 1,
    max: 50,
    default: 3 
  },
  booked: {
    type: Number,
    default: 0,
    min: 0
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
});

const dayAvailabilitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true // For faster querying
  },
  slots: [timeSlotSchema],
  purpose: {
    type: String,
    default: "Student Registration"
  }
});

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
  
  // Specific dated appointments (primary data)
  appointments: [dayAvailabilitySchema],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add a virtual for slotFilledCount
bookSchema.virtual('slotFilledCount').get(function() {
  // This is a placeholder. Actual counting should be done in the controller using the PreRegistration model.
  // You can remove this if you want to keep logic in the controller only.
  return null;
});

const bookModel = mongoose.model("book", bookSchema);

module.exports = bookModel;
