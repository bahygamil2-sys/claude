import path from "node:path";

// Resolved from cwd (npm workspace scripts always run with cwd = backend/), so this
// is correct whether running via `tsx watch src/index.ts` or `node dist/index.js`.
export const UPLOADS_DIR = path.join(process.cwd(), "uploads");
