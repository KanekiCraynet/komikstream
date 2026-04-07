/**
 * Deno Deploy — Thin API Proxy for sankavollerei.com
 *
 * Deployed to Deno Deploy to bypass the CF Worker / Azure IP ban
 * on sankavollerei.com (Plana AI Detector).
 *
 * Routes:
 *   GET /api-proxy/{path}?{qs}  →  https://www.sankavollerei.com/{path}?{qs}
 *
 * Auth: x-api-proxy-token header must match API_PROXY_TOKEN env var.
 * Env vars: API_PROXY_TOKEN (required)
 */

const TARGET = "https://www.sankavollerei.com";

// Browser-like headers required to pass Plana AI Detector
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: "https://www.sankavollerei.com/",
  "sec-ch-ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
};

Deno.serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  // Health check — unauthenticated, for uptime monitors
  if (url.pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only handle /api-proxy/* routes
  if (!url.pathname.startsWith("/api-proxy/")) {
    return new Response("Not Found", { status: 404 });
  }

  // Token auth — prevent open-relay abuse
  const token = req.headers.get("x-api-proxy-token");
  const expected = Deno.env.get("API_PROXY_TOKEN");
  if (!expected || token !== expected) {
    return new Response("Not Found", { status: 404 });
  }

  // Strip /api-proxy prefix, forward rest of path + query to target
  const apiPath = url.pathname.slice("/api-proxy".length);
  const targetUrl = `${TARGET}${apiPath}${url.search}`;

  try {
    const upstream = await fetch(targetUrl, { headers: BROWSER_HEADERS });

    const respHeaders = new Headers();
    respHeaders.set("Content-Type", upstream.headers.get("Content-Type") ?? "application/json");
    respHeaders.set("Cache-Control", "no-store");
    respHeaders.set("X-Content-Type-Options", "nosniff");

    return new Response(upstream.body, {
      status: upstream.status,
      headers: respHeaders,
    });
  } catch {
    return new Response(JSON.stringify({ error: "upstream_error" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
});
