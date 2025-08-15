const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  title:    { type: String, required: true, unique: true },
  iconUrl:  { type: String },
});

module.exports = mongoose.model('Game', gameSchema);