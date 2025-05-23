// const mongoose = require('mongoose');
//
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
// });

// const bookModel = mongoose.model("book", bookSchema);

// module.exports = bookModel;

const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  availability: {
    Monday: [String],
    Tuesday: [String],
    Wednesday: [String],
    Thursday: [String],
    Friday: [String],
    Saturday: [String],
    Sunday: [String],
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

const bookModel = mongoose.model("book", bookSchema);

module.exports = bookModel;
