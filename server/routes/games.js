const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

router.post('/', async (req, res) => {
  try {
    const { title, iconUrl } = req.body;
    const game = new Game({ title, iconUrl });
    await game.save();
    res.status(201).json(game);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Game title must be unique.' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const games = await Game.find();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, iconUrl } = req.body;
    const game = await Game.findByIdAndUpdate(
      req.params.id,
      { title, iconUrl },
      { new: true, runValidators: true }
    );
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Game title must be unique.' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Game.findByIdAndDelete(req.params.id);
    res.json({ message: 'Game deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;