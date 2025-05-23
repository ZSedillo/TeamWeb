// // const mongoose = require('mongoose');

// // const bookSchema = new mongoose.Schema({
// //   availability: {
// //     Monday: [String],
// //     Tuesday: [String],
// //     Wednesday: [String],
// //     Thursday: [String],
// //     Friday: [String],
// //     Saturday: [String],
// //     Sunday: [String],
// //   },
// // });

// // const bookModel = mongoose.model("book", bookSchema);

// // module.exports = bookModel;

// const mongoose = require('mongoose');

// const bookSchema = new mongoose.Schema({
//   availability: {
//     Monday: [String],
//     Tuesday: [String],
//     Wednesday: [String],
//     Thursday: [String],
//     Friday: [String],
//     Saturday: [String],
//     Sunday: [String],
//   },
//   limits: {
//     Monday: { type: Map, of: Number },
//     Tuesday: { type: Map, of: Number },
//     Wednesday: { type: Map, of: Number },
//     Thursday: { type: Map, of: Number },
//     Friday: { type: Map, of: Number },
//     Saturday: { type: Map, of: Number },
//     Sunday: { type: Map, of: Number },
//   },
// });

// const bookModel = mongoose.model("book", bookSchema);

// module.exports = bookModel;

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
  // General availability template (optional)
  defaultAvailability: {
    Monday: [String],
    Tuesday: [String],
    Wednesday: [String],
    Thursday: [String],
    Friday: [String],
    Saturday: [String],
    Sunday: [String]
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

// Update timestamp on save
bookSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add compound index for faster date/slot queries
bookSchema.index({ 'appointments.date': 1, 'appointments.slots.time': 1 });

const bookModel = mongoose.model("book", bookSchema);

module.exports = bookModel;
