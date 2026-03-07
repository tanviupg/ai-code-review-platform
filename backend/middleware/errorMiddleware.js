const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not found - ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (Number.isInteger(err?.statusCode)) {
    statusCode = err.statusCode;
  }
  if (err?.name === "MulterError") {
    statusCode = 400;
  }
  if (typeof err?.message === "string" && err.message.startsWith("Unsupported file type:")) {
    statusCode = 400;
  }
  if (typeof err?.message === "string" && err.message.startsWith("CORS blocked for origin:")) {
    statusCode = 403;
  }

  // Centralized server-side error log to speed up debugging in dev and staging.
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${statusCode}`);
  if (err?.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
