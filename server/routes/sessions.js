const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// Create a new session
router.post('/', async (req, res) => {
  try {
    const { user, game, startTime, endTime } = req.body;
    const duration = (new Date(endTime) - new Date(startTime)) / 60000; // minutes
    const session = new Session({ user, game, startTime, endTime, duration });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all sessions for a user
router.get('/:userId', async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.params.userId }).populate('game');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a session
router.put('/:id', async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a session
router.delete('/:id', async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;