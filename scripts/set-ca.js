#!/usr/bin/env node
// The one command to run on launch day. Paste in the real contract address
// and it's live on hoodrich.bond immediately — no git push, no Cloudflare
// Pages rebuild. It works by calling the /admin/set-ca Pages Function,
// which writes the address to KV; a request-time Function
// (functions/_middleware.js) reads that KV value and injects it into the
// page on every request from then on.
//
// Requires ADMIN_SECRET to match whatever was set as a secret on the
// hoodrich Pages project (Settings > Variables and secrets). Ask whoever
// set that up if you don't have it — it is NOT stored in this repo.
//
// Usage:
//   ADMIN_SECRET=... node scripts/set-ca.js 0xYourRealTokenAddress [baseUrl]

async function main() {
  const ca = process.argv[2];
  const baseUrl = process.argv[3] || "https://hoodrich.bond";
  const secret = process.env.ADMIN_SECRET;

  if (!ca) {
    console.error("Usage: ADMIN_SECRET=... node scripts/set-ca.js 0xYourRealTokenAddress [baseUrl]");
    process.exit(1);
  }
  if (!secret) {
    console.error("Missing ADMIN_SECRET env var — this must match the secret set on the hoodrich Pages project.");
    process.exit(1);
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(ca)) {
    console.error(`"${ca}" doesn't look like a valid contract address (expected 0x + 40 hex chars).`);
    process.exit(1);
  }

  console.log(`Setting CA on ${baseUrl} to ${ca} ...`);
  const res = await fetch(`${baseUrl}/admin/set-ca`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-admin-secret": secret },
    body: JSON.stringify({ ca }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`FAILED (${res.status}): ${text}`);
    process.exit(1);
  }

  console.log(`Done: ${text}`);
  console.log("Check hoodrich.bond now — it should already show the real contract address.");
}

main();
