// Runs on every request before the static asset is served. Reads the real
// contract address out of KV (if one has been set) and rewrites the same
// two placeholder strings scripts/set-ca.js used to edit by hand — but now
// at request time, so setting the CA takes effect on the next page load
// instead of requiring a git push + Pages rebuild.
//
// Requires a KV namespace bound as CA_KV in the Pages project settings
// (Settings > Functions > KV namespace bindings). Falls through untouched
// if the binding is missing, so the site still works before that's set up.

const PLACEHOLDER_CA = "0x0000000000000000000000000000000000000000";
const SCHEMA_DEFAULT = 'default&quot;:&quot;#&quot;';
const JS_FALLBACK = '?? \\"#\\"';

export async function onRequest(context) {
  const response = await context.next();

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") || !context.env.CA_KV) {
    return response;
  }

  const ca = await context.env.CA_KV.get("contract");
  if (!ca) {
    return response;
  }

  let html = await response.text();
  const buyUrl = `https://www.ponsfamily.com/launchpad/${ca}`;

  html = html.split(PLACEHOLDER_CA).join(ca);
  html = html.replace(SCHEMA_DEFAULT, `default&quot;:&quot;${buyUrl}&quot;`);
  html = html.replace(JS_FALLBACK, `?? \\"${buyUrl}\\"`);

  const headers = new Headers(response.headers);
  headers.set("content-length", String(new TextEncoder().encode(html).length));
  return new Response(html, { status: response.status, headers });
}
