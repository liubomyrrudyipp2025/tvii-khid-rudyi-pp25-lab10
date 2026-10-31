/** Public artifacts are an explicit allowlist; never copy workspace evidence. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const site = path.resolve(__dirname, "..");
const dist = path.join(site, "dist");
const files = [
  "index.html",
  "CREDITS.md",
  "js/theme.js",
  "favicon.ico",
  "_headers",
  "css/tailwind.css",
  "css/custom-styles.css",
  "js/demo.js",
  "js/hero-media.js",
  "js/validation.js",
  "js/media-components.js",
  "css/media-components.css",
  "widgets/clock.shtml",
  "widgets/clock.js",
];
for (const file of files)
  if (!fs.statSync(path.join(site, file)).isFile())
    throw new Error("Missing public file: " + file);
const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
if (/cdn\.tailwindcss\.com/.test(html))
  throw new Error("Production cannot depend on Play CDN");
const assets = path.join(site, "assets");
if (!fs.statSync(assets).isDirectory()) throw new Error("Missing local assets");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist);
for (const file of files) {
  const target = path.join(dist, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(site, file), target);
}
fs.cpSync(assets, path.join(dist, "assets"), {
  recursive: true,
  dereference: false,
  filter: (source) => {
    if (fs.lstatSync(source).isSymbolicLink())
      throw new Error("Refusing asset symlink: " + source);
    return true;
  },
});
const manifest = [];
const walk = (directory) => {
  for (const entry of fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else
      manifest.push({
        path: path.relative(dist, target).replaceAll("\\", "/"),
        bytes: fs.statSync(target).size,
        sha256: crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex"),
      });
  }
};
walk(dist);
// Verification manifest goes to stdout, never inside the public distribution.
console.log(JSON.stringify({ dist, files: manifest }, null, 2));
