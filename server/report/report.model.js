const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    activityLog: {
        type: String,
    },
    time: {
        type: Date,
        default: Date.now // Automatically sets the current time
    }
});

const Report = mongoose.model('report', reportSchema);

module.exports = Report;
