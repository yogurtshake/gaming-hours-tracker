const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  iconUrl:  { type: String },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Game', gameSchema);