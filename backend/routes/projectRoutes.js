const express = require("express");
const {
  createProject,
  getProjects,
  getProjectById,
  pasteCodeToProject,
} = require("../controllers/projectController");
const {
  listProjectVersions,
  getProjectVersionById,
  compareProjectVersions,
} = require("../controllers/versionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createProject);
router.get("/", protect, getProjects);
router.post("/:id/paste", protect, pasteCodeToProject);
router.get("/:id/versions", protect, listProjectVersions);
router.get("/:id/versions/compare", protect, compareProjectVersions);
router.get("/:id/versions/:versionId", protect, getProjectVersionById);
router.get("/:id", protect, getProjectById);

module.exports = router;
