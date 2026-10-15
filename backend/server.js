
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check for Railway
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "TokenGenerate API",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// API routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tokens", require("./routes/tokenRoutes"));

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected successfully");

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Application startup failed:", err.message);
  process.exit(1);
});
