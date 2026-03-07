const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const commentRoutes = require("./routes/commentRoutes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

const configuredOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173,http://localhost:5174,http://localhost:5184,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5184")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalDevOrigin =
        typeof origin === "string" &&
        /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin);

      if (!origin || configuredOrigins.includes(origin) || isLocalDevOrigin) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// static folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// test route
app.get("/", (req, res) => {
  res.json({ success: true, message: "AI Code Review API is running" });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/comments", commentRoutes);

// middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const validateEnvironment = () => {
  const missing = [];
  if (!process.env.MONGO_URI) missing.push("MONGO_URI");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};

const startServer = async () => {
  validateEnvironment();
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
