/**
 * LibraSphere - Activity Log Routes
 */
const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { successResponse, errorResponse } = require("../utils/helpers");

/**
 * GET /api/activity
 * List recent operational and circulation activities
 */
router.get("/", (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const activities = (store.activities || []).slice(0, limit);
    return res.json(successResponse(activities, `Retrieved ${activities.length} activity entries`));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to fetch activity log", 500, err.message));
  }
});

module.exports = router;
