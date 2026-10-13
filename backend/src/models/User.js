const mongoose = require('mongoose');
const { isValidEmail } = require('../utils/validators');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
    validate: { validator: isValidEmail, message: 'Enter a valid email address' }
  },
  passwordHash: { type: String, required: true, select: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
