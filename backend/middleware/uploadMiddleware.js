const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { ALLOWED_EXTENSIONS } = require("../utils/codeUtils");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return cb(new Error(`Unsupported file type: ${extension}`), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 2,
    files: 20,
  },
});

module.exports = upload;
