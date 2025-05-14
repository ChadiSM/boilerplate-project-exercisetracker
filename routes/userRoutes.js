const express = require("express");
const router = express.Router();
const User = require("../models/user");


router.post("/api/users", async (req, res) => {
  const { username } = req.body;
  try {
    const user = new User({ username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/api/users", async (req, res) => {
  const users = await User.find({}, "username _id");
  res.json(users);
});


router.post("/api/users/:_id/exercises", async (req, res) => {
  const { description, duration, date } = req.body;
  const { _id } = req.params;

  try {
    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const exerciseDate = date ? new Date(date) : new Date();

    const exercise = {
      description,
      duration: parseInt(duration),
      date: exerciseDate,
    };

    user.log.push(exercise);
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      date: exerciseDate.toDateString(),
      duration: parseInt(duration),
      description,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;
  const { _id } = req.params;

  try {
    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    let log = user.log.map((ex) => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString(),
    }));

    
    if (from) {
      const fromDate = new Date(from);
      log = log.filter((e) => new Date(e.date) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      log = log.filter((e) => new Date(e.date) <= toDate);
    }

    
    if (limit) {
      log = log.slice(0, parseInt(limit));
    }

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
