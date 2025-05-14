const express = require("express");
const User = require("../models/user");

const router = express.Router();

router.post("/", async (req, res) => {
  const { username } = req.body;
  try {
    const user = new User({ username });
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "No se pudo crear el usuario." });
  }
});

module.exports = router;
