const express = require("express");
const multer = require("multer");
const { analyzeFrame } = require("../controllers/analyze.controller");
const { maxUploadMb } = require("../config/env");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadMb * 1024 * 1024,
  },
});

router.post("/analyze-frame", upload.single("frame"), analyzeFrame);
router.post("/analyze", upload.single("frame"), analyzeFrame);

module.exports = router;
