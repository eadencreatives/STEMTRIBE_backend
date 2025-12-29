const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: false, unique: true, sparse: true },
  password: { type: String },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  provider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
  providerId: { type: String },
  avatar: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
