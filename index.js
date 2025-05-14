const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// Conexión a MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/exercisetracker", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Archivos estáticos
app.use("/public", express.static(path.join(__dirname, "public")));

// HTML principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Rutas
const userRoutes = require(path.join(__dirname, "routes", "userRoutes"));
app.use(userRoutes);

// Escuchar
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("App is listening on port " + listener.address().port);
});
