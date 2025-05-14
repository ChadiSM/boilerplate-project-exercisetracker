require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

// Middleware
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

// Create models
const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

// Routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Create a new user
app.post("/api/users", async (req, res) => {
  try {
    const { username } = req.body;
    const user = new User({ username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "username _id");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add exercise
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const { _id } = req.params;
    let { description, duration, date } = req.body;

    // Validate duration
    duration = parseInt(duration);
    if (isNaN(duration)) {
      throw new Error("Duration must be a number");
    }

    // Set date to current date if not provided
    date = date ? new Date(date) : new Date();

    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    // Find user
    const user = await User.findById(_id);
    if (!user) {
      throw new Error("User not found");
    }

    // Create exercise
    const exercise = new Exercise({
      userId: _id,
      description,
      duration,
      date,
    });
    await exercise.save();

    // Format response
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get exercise log
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    // Find user
    const user = await User.findById(_id);
    if (!user) {
      throw new Error("User not found");
    }

    // Build query
    let query = { userId: _id };
    let dateFilter = {};

    if (from) {
      dateFilter.$gte = new Date(from);
    }
    if (to) {
      dateFilter.$lte = new Date(to);
    }
    if (from || to) {
      query.date = dateFilter;
    }

    // Get exercises
    let exercisesQuery = Exercise.find(query, "description duration date -_id");

    if (limit) {
      exercisesQuery = exercisesQuery.limit(parseInt(limit));
    }

    const exercises = await exercisesQuery.exec();

    // Format response
    const log = exercises.map((ex) => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString(),
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
