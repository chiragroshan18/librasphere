/**
 * LibraSphere - Member Management Routes
 */
const express = require("express");
const router = express.Router();
const store = require("../data/store");
const {
  successResponse,
  errorResponse,
  logActivity,
  validateMember,
  calculateMemberProfile
} = require("../utils/helpers");

const DEFAULT_AVATARS = ["👩‍🔬", "👨‍💻", "👩‍💼", "👨‍🎓", "👩‍🏫", "🧑‍🔬", "👨‍🚀", "👩‍🎨"];

/**
 * GET /api/members
 * List all members with optional query search
 */
router.get("/", (req, res) => {
  try {
    let result = [...store.members];
    const { search, tier, status } = req.query;

    if (search) {
      const q = search.trim().toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.department && m.department.toLowerCase().includes(q)) ||
        (m.id && m.id.toLowerCase().includes(q))
      );
    }

    if (tier && tier !== "All") {
      result = result.filter(m => m.tier.toLowerCase() === tier.toLowerCase());
    }

    if (status && status !== "All") {
      result = result.filter(m => m.status.toLowerCase() === status.toLowerCase());
    }

    // Attach quick active loans count to each member
    const enriched = result.map(m => {
      const activeCount = store.loans.filter(l => l.memberId === m.id && l.status !== "Returned").length;
      return {
        ...m,
        activeLoansCount: activeCount
      };
    });

    return res.json(successResponse(enriched, `Retrieved ${enriched.length} member(s)`));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to fetch members", 500, err.message));
  }
});

/**
 * GET /api/members/:id
 * Full reading profile, active loans, history, and personalized recommendations
 */
router.get("/:id", (req, res) => {
  try {
    const profile = calculateMemberProfile(req.params.id, store);
    if (!profile) {
      return res.status(404).json(errorResponse(`Member with ID '${req.params.id}' not found`, 404));
    }

    return res.json(successResponse(profile, `Reading profile loaded for ${profile.member.name}`));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to fetch member profile", 500, err.message));
  }
});

/**
 * POST /api/members
 * Register a new member
 */
router.post("/", (req, res) => {
  try {
    const validationErrors = validateMember(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json(errorResponse("Validation failed", 400, validationErrors));
    }

    // Check email uniqueness
    const emailExists = store.members.some(m => m.email.toLowerCase() === req.body.email.trim().toLowerCase());
    if (emailExists) {
      return res.status(400).json(errorResponse(`Email '${req.body.email}' is already registered`, 400));
    }

    const newId = `MBR-${(store.members.length + 101).toString()}`;
    const avatar = req.body.avatar || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];

    let favoriteCategories = [];
    if (Array.isArray(req.body.favoriteCategories)) {
      favoriteCategories = req.body.favoriteCategories;
    } else if (typeof req.body.favoriteCategories === "string") {
      favoriteCategories = req.body.favoriteCategories.split(",").map(c => c.trim()).filter(Boolean);
    }

    const newMember = {
      id: newId,
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      tier: req.body.tier || "Standard",
      department: req.body.department ? req.body.department.trim() : "General Reader",
      avatar,
      joinDate: new Date().toISOString().split("T")[0],
      favoriteCategories: favoriteCategories.length > 0 ? favoriteCategories : ["Computer Science", "Cloud Computing"],
      status: "Active"
    };

    store.members.unshift(newMember);
    logActivity(store, "MEMBER_REGISTERED", `New member enrolled: ${newMember.name} (Tier: ${newMember.tier}, ID: ${newMember.id})`);

    return res.status(201).json(successResponse(newMember, "Member registered successfully"));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to register member", 500, err.message));
  }
});

/**
 * PUT /api/members/:id
 * Update member details
 */
router.put("/:id", (req, res) => {
  try {
    const memberIndex = store.members.findIndex(m => m.id === req.params.id);
    if (memberIndex === -1) {
      return res.status(404).json(errorResponse(`Member with ID '${req.params.id}' not found`, 404));
    }

    const validationErrors = validateMember(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json(errorResponse("Validation failed", 400, validationErrors));
    }

    const currentMember = store.members[memberIndex];

    // If changing email, ensure no collision
    if (req.body.email && req.body.email.trim().toLowerCase() !== currentMember.email.toLowerCase()) {
      const emailExists = store.members.some(
        m => m.id !== currentMember.id && m.email.toLowerCase() === req.body.email.trim().toLowerCase()
      );
      if (emailExists) {
        return res.status(400).json(errorResponse(`Email '${req.body.email}' is already in use by another member`, 400));
      }
    }

    let favoriteCategories = currentMember.favoriteCategories;
    if (Array.isArray(req.body.favoriteCategories)) {
      favoriteCategories = req.body.favoriteCategories;
    } else if (typeof req.body.favoriteCategories === "string") {
      favoriteCategories = req.body.favoriteCategories.split(",").map(c => c.trim()).filter(Boolean);
    }

    const updatedMember = {
      ...currentMember,
      name: req.body.name !== undefined ? req.body.name.trim() : currentMember.name,
      email: req.body.email !== undefined ? req.body.email.trim().toLowerCase() : currentMember.email,
      tier: req.body.tier !== undefined ? req.body.tier : currentMember.tier,
      department: req.body.department !== undefined ? req.body.department.trim() : currentMember.department,
      avatar: req.body.avatar !== undefined ? req.body.avatar : currentMember.avatar,
      favoriteCategories,
      status: req.body.status !== undefined ? req.body.status : currentMember.status
    };

    store.members[memberIndex] = updatedMember;
    logActivity(store, "MEMBER_UPDATED", `Member details updated: ${updatedMember.name} (${updatedMember.id})`);

    return res.json(successResponse(updatedMember, "Member updated successfully"));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to update member", 500, err.message));
  }
});

/**
 * DELETE /api/members/:id
 * Delete member if no active loans
 */
router.delete("/:id", (req, res) => {
  try {
    const memberIndex = store.members.findIndex(m => m.id === req.params.id);
    if (memberIndex === -1) {
      return res.status(404).json(errorResponse(`Member with ID '${req.params.id}' not found`, 404));
    }

    const activeLoans = store.loans.filter(l => l.memberId === req.params.id && l.status !== "Returned");
    if (activeLoans.length > 0) {
      return res.status(400).json(errorResponse(
        `Cannot remove member '${store.members[memberIndex].name}' because they have ${activeLoans.length} active loan(s).`,
        400
      ));
    }

    const removed = store.members.splice(memberIndex, 1)[0];
    logActivity(store, "MEMBER_REMOVED", `Member record deleted: ${removed.name} (${removed.id})`);

    return res.json(successResponse(removed, `Member '${removed.name}' removed successfully`));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to delete member", 500, err.message));
  }
});

module.exports = router;
