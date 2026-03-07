const express = require("express");
const {
  reviewProjectCode,
  getReviewsByProjectId,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/project/:projectId", protect, getReviewsByProjectId);
router.post("/:projectId", protect, reviewProjectCode);

module.exports = router;
