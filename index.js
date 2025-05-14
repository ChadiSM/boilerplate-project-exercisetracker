const express = require("express");

const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

mongoose
  .connect("mongodb://localhost/exerciseTracker", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.log("Error de conexión a MongoDB:", err));

const app = express();
app.use(bodyParser.json());
app.use(express.static("public")); // Servir archivos estáticos (CSS, imágenes, JS)

const userRoutes = require(path.resolve(__dirname, "routes", "userRoutes"));
const exerciseRoutes = require(
  path.resolve(__dirname, "routes", "exerciseRoutes"),
);

app.use("/api/users", userRoutes);
app.use("/api/exercises", exerciseRoutes);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
