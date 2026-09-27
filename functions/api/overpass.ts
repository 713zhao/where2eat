// Cloudflare Pages Function: proxies Overpass API queries server-side, from
// Cloudflare's own network, so visitors whose local ISP/network can't reach
// overpass-api.de or overpass.kumi.systems directly can still get live data -
// their browser only ever talks to this same-origin endpoint.
//
// Deployed automatically by Cloudflare Pages' build (file-based routing: this
// file becomes POST /api/overpass). Not part of the Vite/tsc build for src/.

const OVERPASS_ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const REQUEST_TIMEOUT_MS = 8000;

async function queryEndpoint(endpoint: string, query: string): Promise<string> {
  const host = new URL(endpoint).hostname;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`${host}: status ${response.status}`);
    }
    return await response.text();
  } catch (err) {
    if (err instanceof Error && err.message.startsWith(`${host}: `)) {
      throw err; // already formatted above (the non-ok-status case)
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`${host}: timed out`);
    }
    throw new Error(`${host}: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timeout);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onRequestPost = async (context: any): Promise<Response> => {
  let query: string | undefined;
  try {
    const body = await context.request.json();
    query = typeof body?.query === 'string' ? body.query : undefined;
  } catch {
    // fall through to the missing-query response below
  }

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing "query" in request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const text = await Promise.any(OVERPASS_ENDPOINTS.map((endpoint) => queryEndpoint(endpoint, query!)));
    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const detail =
      err instanceof AggregateError
        ? err.errors.map((e: unknown) => (e instanceof Error ? e.message : String(e))).join(' | ')
        : String(err);
    return new Response(JSON.stringify({ error: detail }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
