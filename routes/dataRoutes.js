/**
 * LibraSphere - System Data Management Routes
 */
const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { successResponse, errorResponse, logActivity } = require("../utils/helpers");

/**
 * POST /api/data/restore
 * Restores the sample curated dataset
 */
router.post("/restore", (req, res) => {
  try {
    store.restore();
    logActivity(store, "SYSTEM_RESTORE", "System restored to default curated sample dataset");
    return res.json(successResponse({
      booksCount: store.books.length,
      membersCount: store.members.length,
      loansCount: store.loans.length,
      categoriesCount: store.categories.length
    }, "Curated sample dataset restored successfully"));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to restore dataset", 500, err.message));
  }
});

/**
 * POST /api/data/clear
 * Clears in-memory data
 */
router.post("/clear", (req, res) => {
  try {
    store.clear();
    logActivity(store, "SYSTEM_CLEAR", "All books, members, loans, and activities cleared");
    return res.json(successResponse({
      booksCount: 0,
      membersCount: 0,
      loansCount: 0
    }, "Application state cleared successfully"));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to clear state", 500, err.message));
  }
});

module.exports = router;
