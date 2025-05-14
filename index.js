require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Database connection (usando la URI de FCC)
mongoose.connect(
  process.env.MONGO_URI || "mongodb://localhost/exercise-tracker",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
);

// Schemas
const userSchema = new mongoose.Schema({
  username: String,
});

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now },
});

// Models
const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

// Routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Create user
app.post("/api/users", async (req, res) => {
  const username = req.body.username;

  try {
    const user = new User({ username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ error: "ID de usuario inválido" });
    }

    if (!description || !duration) {
      return res
        .status(400)
        .json({ error: "Description y duration son requeridos" });
    }

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const exercise = new Exercise({
      userId: _id,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date(),
    });

    await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get exercise log
app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  let { from, to, limit } = req.query;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Build date filter
    let dateFilter = {};
    if (from) {
      from = new Date(from);
      if (isNaN(from.getTime())) {
        return res.status(400).json({ error: "Invalid from date" });
      }
      dateFilter.$gte = from;
    }
    if (to) {
      to = new Date(to);
      if (isNaN(to.getTime())) {
        return res.status(400).json({ error: "Invalid to date" });
      }
      dateFilter.$lte = to;
    }

    // Build query
    let query = { userId: _id };
    if (from || to) {
      query.date = dateFilter;
    }

    // Apply limit
    let exercisesQuery = Exercise.find(query).select(
      "description duration date -_id",
    );

    if (limit) {
      limit = parseInt(limit);
      if (!isNaN(limit)) {
        exercisesQuery = exercisesQuery.limit(limit);
      }
    }

    const exercises = await exercisesQuery.exec();

    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises.map((ex) => ({
        description: ex.description,
        duration: ex.duration,
        date: ex.date.toDateString(),
      })),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listen
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
