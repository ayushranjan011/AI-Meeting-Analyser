const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { isDbConnected } = require("./config/db");
const analyzeRoutes = require("./routes/analyze.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    db: isDbConnected() ? "connected" : "in-memory-fallback",
  });
});

app.use("/api", analyzeRoutes);
app.use("/api", analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
