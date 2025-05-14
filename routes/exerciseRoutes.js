const express = require("express");
const Exercise = require("../models/user");

const router = express.Router();

router.post("/", async (req, res) => {
  const { userId, description, duration, date } = req.body;
  try {
    const exercise = new Exercise({
      userId,
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    });
    await exercise.save();
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: "Error al registrar ejercicio." });
  }
});

router.get("/:userId/log", async (req, res) => {
  const { userId } = req.params;
  const { from, to, limit } = req.query;
  try {
    const exercises = await Exercise.find({ userId })
      .where("date")
      .gte(from ? new Date(from) : 0)
      .lte(to ? new Date(to) : Date.now())
      .limit(limit ? parseInt(limit) : 100);

    const count = exercises.length;
    res.json({ username: userId, count, log: exercises });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener ejercicios." });
  }
});

module.exports = router;
