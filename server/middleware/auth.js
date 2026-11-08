const jwt = require("jsonwebtoken");
const User = require("../models/User");
exports.auth = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) return res.status(500).json({ message: "Server authentication is not configured." });
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "Please log in." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-passwordHash");
    if (!req.user || !req.user.isActive) return res.status(401).json({ message: "Your session is invalid or your account is inactive." });
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
};
exports.admin = (req, res, next) => req.user?.role === "admin"
  ? next()
  : res.status(403).json({ message: "Administrator access required." });
