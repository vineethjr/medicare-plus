const jwt = require("jsonwebtoken");
const db = require("../database");

function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. Please login first.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = db
      .prepare("SELECT id, name, email, role FROM users WHERE id = ?")
      .get(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User session expired or user account not found. Please log in again.",
        sessionExpired: true,
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

module.exports = protect;