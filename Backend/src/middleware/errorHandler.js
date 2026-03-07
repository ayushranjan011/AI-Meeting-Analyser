const multer = require("multer");

function errorHandler(error, _req, res, _next) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "File too large. Reduce image size and retry.",
      });
    }

    return res.status(400).json({
      error: "Upload error",
      details: error.message,
    });
  }

  console.error(error);
  return res.status(500).json({
    error: "Internal server error",
    details: error.message,
  });
}

module.exports = {
  errorHandler,
};
