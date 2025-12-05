const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['head_admin', 'admin'], 
    default: 'admin'
  },
  // --- NEW FIELDS FOR OTP SECURITY ---
  resetPasswordOtp: {
      type: String
  },
  resetPasswordOtpExpire: {
      type: Date
  }
});

// Ensure only one Head Admin exists
userSchema.pre('save', async function (next) {
  if (this.role === 'head_admin') {
    // We only check this if the role is actually being modified or it's a new user
    // to prevent errors on simple updates
    if (this.isModified('role') || this.isNew) {
        const existingHeadAdmin = await mongoose.model('User').findOne({ role: 'head_admin' });
        // If an existing head admin exists and it is NOT this current document
        if (existingHeadAdmin && existingHeadAdmin._id.toString() !== this._id.toString()) {
            throw new Error('There can only be one Head Admin.');
        }
    }
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;