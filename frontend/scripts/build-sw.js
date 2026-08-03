// Generated with Claude Code - CS 3660 Sprint 3
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";

const DIST = new URL("../dist/", import.meta.url).pathname;
const sha = (process.env.GITHUB_SHA ?? execSync("git rev-parse HEAD").toString()).trim().slice(0, 7);

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push("/" + relative(DIST, full).split("\\").join("/"));
  }
  return acc;
}

const precache = walk(DIST).filter(
  (p) => !p.endsWith("sw.js") && !p.startsWith("/icons/icon-maskable")
);

const template = readFileSync(join(DIST, "sw.js"), "utf8");
const output = template
  .replace("__CACHE_VERSION__", `v-${sha}`)
  .replace("__PRECACHE_MANIFEST__", JSON.stringify(precache, null, 2));

writeFileSync(join(DIST, "sw.js"), output);
console.log(JSON.stringify({ event: "sw.build", version: `v-${sha}`, assets: precache.length }));
