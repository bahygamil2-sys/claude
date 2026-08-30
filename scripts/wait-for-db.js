const { execSync } = require("node:child_process");

const MAX_ATTEMPTS = 30;
const DELAY_MS = 1000;

function isReady() {
  try {
    execSync("docker compose exec -T postgres pg_isready -U bsd -d bsd", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (isReady()) {
      console.log("Postgres is ready.");
      return;
    }
    console.log(`Waiting for Postgres... (${attempt}/${MAX_ATTEMPTS})`);
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }
  console.error("Postgres did not become ready in time.");
  process.exit(1);
}

main();
