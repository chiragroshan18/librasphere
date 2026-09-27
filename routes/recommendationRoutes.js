/**
 * LibraSphere - Recommendation Engine Routes
 */
const express = require("express");
const router = express.Router();
const store = require("../data/store");
const {
  successResponse,
  errorResponse,
  calculateRecommendations
} = require("../utils/helpers");

/**
 * GET /api/recommendations/:memberId
 * Returns personalized recommendations for a specific member
 */
router.get("/:memberId", (req, res) => {
  try {
    const member = store.members.find(m => m.id === req.params.memberId);
    if (!member) {
      return res.status(404).json(errorResponse(`Member with ID '${req.params.memberId}' not found`, 404));
    }

    const limit = parseInt(req.query.limit, 10) || 6;
    const recommendations = calculateRecommendations(req.params.memberId, store, limit);

    return res.json(successResponse(recommendations, `Generated ${recommendations.length} recommendation(s) for ${member.name}`, {
      memberId: member.id,
      memberName: member.name,
      favoriteCategories: member.favoriteCategories
    }));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to generate recommendations", 500, err.message));
  }
});

/**
 * GET /api/recommendations
 * Fallback to default/first member or top-rated books
 */
router.get("/", (req, res) => {
  try {
    const defaultMember = store.members[0];
    if (!defaultMember) {
      return res.json(successResponse([], "No members registered for recommendations"));
    }

    const limit = parseInt(req.query.limit, 10) || 6;
    const recommendations = calculateRecommendations(defaultMember.id, store, limit);

    return res.json(successResponse(recommendations, `Recommendations based on default reader profile (${defaultMember.name})`, {
      memberId: defaultMember.id,
      memberName: defaultMember.name
    }));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to generate recommendations", 500, err.message));
  }
});

module.exports = router;
