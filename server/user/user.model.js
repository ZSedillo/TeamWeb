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
    enum: ['head_admin', 'admin'], // Roles: One head_admin, multiple admins, default user
    default: 'admin'
  }
});

// Ensure only one Head Admin exists
userSchema.pre('save', async function (next) {
  if (this.role === 'head_admin') {
    const existingHeadAdmin = await mongoose.model('User').findOne({ role: 'head_admin' });
    if (existingHeadAdmin) {
      throw new Error('There can only be one Head Admin.');
    }
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
