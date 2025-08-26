const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const lowerUsername = username.toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username: lowerUsername, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created', userId: user._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already taken.' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const lowerUsername = username.toLowerCase();
    const user = await User.findOne({ username: lowerUsername });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    res.json({ message: 'Login successful', userId: user._id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/email', async (req, res) => {
  try {
    const { userId, email } = req.body;
    const user = await User.findByIdAndUpdate(userId, { email }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Email updated', email: user.email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/username', async (req, res) => {
  try {
    const { userId, newUsername } = req.body;
    const existing = await User.findOne({ username: newUsername });
    if (existing) return res.status(400).json({ error: 'Username already taken.' });
    const user = await User.findByIdAndUpdate(userId, { username: newUsername }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Username updated', username: user.username });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/password', async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Old password is incorrect.' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:userId/goal', async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ goalPerDay: user.goalPerDay || 1 });
});

router.put('/:userId/goal', async (req, res) => {
  const { goalPerDay } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { goalPerDay },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ goalPerDay: user.goalPerDay });
});

router.get('/:userId/favourites', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('favourites');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.favourites);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:userId/favourites', async (req, res) => {
  const { gameId, action } = req.body;
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (action === 'add') {
      if (!user.favourites.includes(gameId)) user.favourites.push(gameId);
    } else if (action === 'remove') {
      user.favourites = user.favourites.filter(id => id.toString() !== gameId);
    }
    await user.save();
    const populatedUser = await User.findById(req.params.userId).populate('favourites');
    res.json(populatedUser.favourites);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;