const mongoose = require("mongoose");
const { mongoUri } = require("./env");

async function connectDb() {
  if (!mongoUri) {
    console.warn("[db] MONGO_URI not set. Using in-memory storage fallback.");
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    console.log("[db] Connected to MongoDB.");
    return true;
  } catch (error) {
    console.warn("[db] MongoDB connection failed. Falling back to in-memory storage.");
    console.warn(`[db] ${error.message}`);
    return false;
  }
}

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectDb,
  isDbConnected,
};
