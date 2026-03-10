const assert = require("node:assert/strict");
const app = require("../src/app");

function startServer() {
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function run() {
  const server = await startServer();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.match(body.db, /^(connected|in-memory-fallback)$/);
    console.log("health.test: passed");
  } finally {
    await stopServer(server);
  }
}

run().catch((error) => {
  console.error("health.test: failed");
  console.error(error);
  process.exitCode = 1;
});
