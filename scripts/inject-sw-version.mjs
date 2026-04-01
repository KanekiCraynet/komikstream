/**
 * Post-build script: injects the Next.js BUILD_ID into the service worker
 * so that each deploy gets a unique cache name and old caches are evicted.
 *
 * Runs after `next build` in the Azure standalone pipeline.
 * Reads .next/BUILD_ID and replaces the __BUILD_ID__ placeholder
 * in .next/standalone/public/sw.js.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BUILD_ID_PATH = resolve(".next/BUILD_ID");
const SW_PATH = resolve(".next/standalone/public/sw.js");
const PLACEHOLDER = "__BUILD_ID__";

if (!existsSync(BUILD_ID_PATH)) {
  console.error("[inject-sw-version] .next/BUILD_ID not found — skipping.");
  process.exit(0);
}

if (!existsSync(SW_PATH)) {
  console.error("[inject-sw-version] .next/standalone/public/sw.js not found — skipping.");
  process.exit(0);
}

const buildId = readFileSync(BUILD_ID_PATH, "utf8").trim();
const sw = readFileSync(SW_PATH, "utf8");

if (!sw.includes(PLACEHOLDER)) {
  console.warn(
    `[inject-sw-version] Placeholder "${PLACEHOLDER}" not found in sw.js — already injected?`
  );
  process.exit(0);
}

const patched = sw.replace(PLACEHOLDER, buildId);
writeFileSync(SW_PATH, patched, "utf8");

console.log(`[inject-sw-version] Injected BUILD_ID "${buildId}" into sw.js`);
console.log(`[inject-sw-version] Cache name: kuromanga-${buildId}`);
