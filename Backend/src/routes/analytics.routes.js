const express = require("express");
const { getLiveAnalytics } = require("../controllers/analytics.controller");

const router = express.Router();

router.get("/analytics/live", getLiveAnalytics);

module.exports = router;
