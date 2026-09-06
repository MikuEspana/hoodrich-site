#!/usr/bin/env node
// The one command to run on launch day. Paste in the real contract address
// and it rewrites index.html, commits, and pushes — Cloudflare Pages picks
// up the push and redeploys automatically. The buy link is always
// https://www.ponsfamily.com/launchpad/<CA>, so it's derived, not typed.
//
// This site is a compiled Claude Design bundle, not hand-written HTML: the
// contract address and buy links live as ONE shared default value baked into
// a component's schema + fallback code (`0x000...000` and `"#"`), each
// appearing in exactly one place in the file. That's what this script edits.
// If you ever regenerate index.html from Claude Design, re-verify these
// match counts still hold before trusting this script again.
//
// Usage:
//   node scripts/set-ca.js 0xYourRealTokenAddress

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const INDEX_PATH = path.join(__dirname, "..", "index.html");
const PLACEHOLDER_CA = "0x0000000000000000000000000000000000000000";

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function main() {
  const ca = process.argv[2];

  if (!ca) {
    fail("Usage: node scripts/set-ca.js 0xYourRealTokenAddress");
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(ca)) {
    fail(`"${ca}" doesn't look like a valid contract address (expected 0x + 40 hex chars).`);
  }
  const buyUrl = `https://www.ponsfamily.com/launchpad/${ca}`;

  let html = fs.readFileSync(INDEX_PATH, "utf8");

  const caCount = html.split(PLACEHOLDER_CA).length - 1;
  if (caCount === 0) {
    fail("Placeholder contract address not found — has index.html already been updated, or changed shape?");
  }
  html = html.split(PLACEHOLDER_CA).join(ca);

  // These two exact substrings are the schema default and the JS fallback
  // for the buyUrl prop. Verified to occur exactly once each in the bundle
  // as shipped — if that ever changes, this will silently under- or
  // over-replace, so the counts are checked before touching anything.
  const schemaDefault = 'default&quot;:&quot;#&quot;';
  const jsFallback = '?? \\"#\\"';

  const schemaCount = html.split(schemaDefault).length - 1;
  const jsCount = html.split(jsFallback).length - 1;
  if (schemaCount !== 1 || jsCount !== 1) {
    fail(
      `Expected exactly 1 buyUrl schema default and 1 JS fallback, found ${schemaCount} and ${jsCount}. ` +
        "The bundle shape changed — stop and check index.html by hand before rerunning."
    );
  }

  html = html.replace(schemaDefault, `default&quot;:&quot;${buyUrl}&quot;`);
  html = html.replace(jsFallback, `?? \\"${buyUrl}\\"`);

  fs.writeFileSync(INDEX_PATH, html);
  console.log(`Set contract address (${caCount} occurrence${caCount === 1 ? "" : "s"}) to ${ca}`);
  console.log(`Set buy URL to ${buyUrl}`);

  const cwd = path.join(__dirname, "..");
  execFileSync("git", ["add", "index.html"], { cwd, stdio: "inherit" });
  execFileSync(
    "git",
    [
      "commit",
      "-m",
      `Set launch contract address and buy link\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`,
    ],
    { cwd, stdio: "inherit" }
  );
  execFileSync("git", ["push"], { cwd, stdio: "inherit" });

  console.log("\nPushed. Cloudflare Pages will redeploy automatically — check hoodrich.bond in a minute or two.");
}

main();
