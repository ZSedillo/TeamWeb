const mongoose = require('mongoose');

const preRegistrationSchema = new mongoose.Schema({
    name: String,
    phone_number: Number,
    age: Number,
    gender: {
        type: String,
        enum: ['Male', 'Female'],
        required: true
    },
    birthdate: { type: Date, required: true },
    strand: { type: String, default: null }, // Optional strand
    grade_level: { type: String, required: true },
    email: { type: String, unique: true },
    nationality: String,
    parent_guardian_name: String,
    parent_guardian_number: Number,
    isNewStudent: {
        type: String,
        enum: ['new', 'old'], // Only "new" or "old" allowed
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    appointment_date: { type: Date, default: null },
    preferred_time: { type: String, default: null },
    purpose_of_visit: { type: String, default: null },
    enrollment: { type: Boolean, default: false },
    registration_year: { 
        type: String, 
        required: true,
        default: function() {
            return new Date().getFullYear().toString();
        }
    }
}, { timestamps: false });

const preRegistrationModel = mongoose.model('preRegistration', preRegistrationSchema);
module.exports = preRegistrationModel;