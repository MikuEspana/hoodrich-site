// POST /admin/set-ca  { "ca": "0x..." }  header x-admin-secret: <ADMIN_SECRET>
//
// Writes the real contract address to KV. Takes effect on the very next
// page load — no git push, no Pages rebuild. Requires ADMIN_SECRET set as
// a Pages secret (Settings > Variables and secrets) and a KV namespace
// bound as CA_KV (Settings > Functions > KV namespace bindings).
//
// Can only set the CA once per deployment, same rule as btc-desk's
// set-ca: a mistake needs a human fix, not a silent overwrite of an
// address people may have already copied. Delete the KV key by hand if
// you genuinely need to change it.

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.CA_KV) {
    return new Response("CA_KV namespace is not bound to this Pages project.", { status: 500 });
  }
  if (!env.ADMIN_SECRET) {
    return new Response("ADMIN_SECRET is not set on this Pages project.", { status: 500 });
  }
  if (request.headers.get("x-admin-secret") !== env.ADMIN_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Expected JSON body: { \"ca\": \"0x...\" }", { status: 400 });
  }

  const ca = body.ca;
  if (typeof ca !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(ca)) {
    return new Response(`"${ca}" doesn't look like a valid contract address.`, { status: 400 });
  }

  const existing = await env.CA_KV.get("contract");
  if (existing) {
    return new Response(
      `Contract address is already set to ${existing}. Refusing to overwrite — delete the KV key by hand if this is intentional.`,
      { status: 409 }
    );
  }

  await env.CA_KV.put("contract", ca);
  return new Response(`Set contract address to ${ca}. It's live now.`, { status: 200 });
}
