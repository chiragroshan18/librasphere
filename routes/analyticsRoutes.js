/**
 * LibraSphere - Analytics & Visualization Routes
 */
const express = require("express");
const router = express.Router();
const store = require("../data/store");
const {
  successResponse,
  errorResponse,
  calculateAnalytics
} = require("../utils/helpers");

/**
 * GET /api/analytics
 * Provides data aggregates for vector SVG charts and distribution analysis
 */
router.get("/", (req, res) => {
  try {
    const analytics = calculateAnalytics(store);
    return res.json(successResponse(analytics, "Analytics aggregated successfully"));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to compute analytics", 500, err.message));
  }
});

module.exports = router;
