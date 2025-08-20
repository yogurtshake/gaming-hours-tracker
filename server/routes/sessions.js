const express = require("express");
const router = express.Router();
const Session = require("../models/Session");

router.post("/", async (req, res) => {
  try {
    const { user, game, startTime, endTime } = req.body;
    const duration = (new Date(endTime) - new Date(startTime)) / 60000;
    const session = new Session({ user, game, startTime, endTime, duration });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.params.userId }).populate(
      "game"
    );
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:userId/stats', async (req, res) => {
  const { userId } = req.params;
  const { range } = req.query;

  const now = new Date();
  let fromDate = new Date(now);
  switch (range) {
    case 'day':
      fromDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      fromDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      fromDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      fromDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      fromDate = null;
  }

  const match = { user: userId };
  if (fromDate) match.startTime = { $gte: fromDate };

  try {
    const stats = await Session.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$startTime" },
            month: { $month: "$startTime" },
            day: { $dayOfMonth: "$startTime" }
          },
          totalMinutes: { $sum: "$duration" },
          sessions: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    const total = stats.reduce((sum, s) => sum + s.totalMinutes, 0);
    res.json({ stats, totalMinutes: total });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:userId/game-stats', async (req, res) => {
  const { userId } = req.params;
  const { range } = req.query;

  const now = new Date();
  let fromDate = new Date(now);
  switch (range) {
    case 'day':
      fromDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      fromDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      fromDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      fromDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      fromDate = null;
  }

  const match = { user: userId };
  if (fromDate) match.startTime = { $gte: fromDate };

  try {
    const stats = await Session.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$game",
          totalMinutes: { $sum: "$duration" },
          sessions: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "games",
          localField: "_id",
          foreignField: "_id",
          as: "game"
        }
      },
      { $unwind: "$game" },
      { $sort: { totalMinutes: -1 } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { game, startTime, endTime } = req.body;
    const duration = (new Date(endTime) - new Date(startTime)) / 60000;
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { game, startTime, endTime, duration },
      { new: true }
    ).populate("game");
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
