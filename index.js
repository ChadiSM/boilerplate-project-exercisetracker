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
  .connect(process.env.MONGO_URI || "mongodb://localhost/exercise-tracker", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
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

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
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
    const users = await User.find({}).select("username _id");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add exercise
app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  let { description, duration, date } = req.body;

  // Validations
  if (!description)
    return res.status(400).json({ error: "Description is required" });
  if (!duration) return res.status(400).json({ error: "Duration is required" });

  duration = parseInt(duration);
  if (isNaN(duration))
    return res.status(400).json({ error: "Duration must be a number" });

  date = date ? new Date(date) : new Date();
  if (isNaN(date.getTime()))
    return res.status(400).json({ error: "Invalid date" });

  try {
    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const exercise = new Exercise({
      userId: _id,
      description,
      duration,
      date,
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
    res.status(400).json({ error: err.message });
  }
});

// Get exercise log
app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  let { from, to, limit } = req.query;

  try {
    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Date filtering
    let dateFilter = {};
    if (from) {
      from = new Date(from);
      if (isNaN(from.getTime()))
        return res.status(400).json({ error: "Invalid from date" });
      dateFilter.$gte = from;
    }
    if (to) {
      to = new Date(to);
      if (isNaN(to.getTime()))
        return res.status(400).json({ error: "Invalid to date" });
      dateFilter.$lte = to;
    }

    let query = { userId: _id };
    if (from || to) query.date = dateFilter;

    // Limit
    let limitNumber;
    if (limit) {
      limitNumber = parseInt(limit);
      if (isNaN(limitNumber))
        return res.status(400).json({ error: "Limit must be a number" });
    }

    let exercisesQuery = Exercise.find(query)
      .select("description duration date -_id")
      .sort({ date: 1 });

    if (limitNumber) exercisesQuery = exercisesQuery.limit(limitNumber);

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

// Start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
