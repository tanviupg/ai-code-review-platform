const express = require("express");
const {
  createComment,
  getCommentsByReviewId,
} = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createComment);
router.get("/:reviewId", protect, getCommentsByReviewId);

module.exports = router;
