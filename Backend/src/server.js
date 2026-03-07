const app = require("./app");
const { connectDb } = require("./config/db");
const { port, aiServiceUrl, nodeEnv } = require("./config/env");

async function start() {
  await connectDb();

  app.listen(port, () => {
    console.log(`[server] Running in ${nodeEnv} mode on http://127.0.0.1:${port}`);
    console.log(`[server] AI service target: ${aiServiceUrl}`);
  });
}

start();
