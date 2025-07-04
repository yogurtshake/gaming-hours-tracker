const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  game:      { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  startTime: { type: Date, required: true },
  endTime:   { type: Date, required: true },
  duration:  { type: Number } // in minutes or seconds
});

module.exports = mongoose.model('Session', sessionSchema);