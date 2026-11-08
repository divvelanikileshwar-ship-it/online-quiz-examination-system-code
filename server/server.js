require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const api = require("./routes/api");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be set to a random value of at least 32 characters.");
  process.exit(1);
}
const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.get("/api/health", (req, res) => res.json({ success: true, message: "QuizSphere API is running" }));
app.use("/api", api);
app.use((req, res) => res.status(404).json({ message: "API route not found." }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ message: "A record with that value already exists." });
  if (err.name === "ValidationError" || err.name === "CastError") return res.status(400).json({ message: err.message });
  return res.status(500).json({ message: "An unexpected server error occurred." });
});
const port = process.env.PORT || 5000;
connectDB().then(() => app.listen(port, () => console.log(`API running at http://localhost:${port}`)))
  .catch(error => { console.error("Database connection failed:", error.message); process.exit(1); });
