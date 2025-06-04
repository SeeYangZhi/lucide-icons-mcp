#!/usr/bin/env node

import { startHttpServer } from "./http.js";
import { runStdioServer } from "./stdio.js";

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--stdio")) {
    await runStdioServer();
  } else {
    await startHttpServer();
  }
}

main().catch(() => {
  process.exit(1);
});
