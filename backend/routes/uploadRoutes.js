const express = require("express");
const { uploadCodeFiles } = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", protect, upload.array("files", 20), uploadCodeFiles);

module.exports = router;
