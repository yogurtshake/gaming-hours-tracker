const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  email:    { type: String },
  createdAt: { type: Date, default: Date.now },
  goalPerDay: { type: Number, default: 1 },
  favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }]
});

module.exports = mongoose.model('User', userSchema);