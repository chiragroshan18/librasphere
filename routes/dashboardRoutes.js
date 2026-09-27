/**
 * LibraSphere - Dashboard Engine Routes
 */
const express = require("express");
const router = express.Router();
const store = require("../data/store");
const {
  successResponse,
  errorResponse,
  calculateDashboard
} = require("../utils/helpers");

/**
 * GET /api/dashboard
 * Aggregates real-time metrics, circulation stats, popular books, and activities
 */
router.get("/", (req, res) => {
  try {
    const dashboardData = calculateDashboard(store);
    return res.json(successResponse(dashboardData, "Dashboard metrics calculated successfully"));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to compute dashboard metrics", 500, err.message));
  }
});

module.exports = router;
