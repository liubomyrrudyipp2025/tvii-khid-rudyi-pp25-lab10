/** Reproducible Tailwind 3 build; local pinned dependencies only. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const site = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const index = args.indexOf("--toolchain-root");
const toolchain = index >= 0 ? path.resolve(args[index + 1]) : site;
const cli = require.resolve("tailwindcss/lib/cli.js", { paths: [toolchain] });
const version = require(
  require.resolve("tailwindcss/package.json", { paths: [toolchain] }),
).version;
if (version !== "3.4.17")
  throw new Error("Expected pinned Tailwind 3.4.17, found " + version);
for (const file of [
  "index.html",
  "tailwind.config.cjs",
  "css/input.css",
  "css/custom-styles.css",
  "js/demo.js",
  "js/media-components.js",
  "css/media-components.css",
]) {
  if (!fs.statSync(path.join(site, file)).isFile())
    throw new Error("Missing build input: " + file);
}
const result = spawnSync(
  process.execPath,
  [
    cli,
    "-c",
    "tailwind.config.cjs",
    "-i",
    "css/input.css",
    "-o",
    "css/tailwind.css",
    "--minify",
  ],
  { cwd: site, stdio: "inherit" },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
const output = fs.readFileSync(path.join(site, "css/tailwind.css"), "utf8");
if (!output.includes(".grid") || output.includes("@tailwind"))
  throw new Error("Compiled utilities missing");
console.log(
  JSON.stringify({ site, tailwind: version, cssBytes: Buffer.byteLength(output) }),
);
