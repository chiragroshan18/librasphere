/**
 * LibraSphere - Cloud-Ready Library Management & Discovery System
 * Cloud Computing - Project 7
 */
const express = require("express");
const path = require("path");

const bookRoutes = require("./routes/bookRoutes");
const memberRoutes = require("./routes/memberRoutes");
const loanRoutes = require("./routes/loanRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const activityRoutes = require("./routes/activityRoutes");
const dataRoutes = require("./routes/dataRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for development & audit
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== "test") {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Static assets
app.use(express.static(path.join(__dirname, "public")));

// REST API Routers
app.use("/api/books", bookRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/data", dataRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    project: "LibraSphere",
    version: "1.0.0",
    cloudArchitecture: "Cloud-Ready Stateless Client-Server",
    timestamp: new Date().toISOString()
  });
});

// 404 for API requests
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `API Route '${req.originalUrl}' not found`,
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for root or unknown static routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error occurred",
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  📚 LibraSphere Library Management System is running! `);
    console.log(`  🌐 Local Access:   http://localhost:${PORT}          `);
    console.log(`  ☁️ Architecture:   Cloud-Ready REST API + In-Memory  `);
    console.log(`=======================================================`);
  });
}

module.exports = app;
