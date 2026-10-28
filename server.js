const path = require('node:path');
try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch {
  // .env is optional; npm scripts also pass --env-file-if-exists.
}

const { createApplication, startApplication } = require('./backend/dist/application.js');

let applicationPromise;

function createServer() {
  if (!applicationPromise) applicationPromise = createApplication();
  return applicationPromise;
}

async function main() {
  await startApplication();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Application startup failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { createServer };
