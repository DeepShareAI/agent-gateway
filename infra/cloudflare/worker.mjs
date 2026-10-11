// Day 1 exposes only the public liveness route. Expand alongside API security.
export async function handleRequest(request, env, fetchBackend = fetch) {
  const url = new URL(request.url);
  if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
    return env.ASSETS.fetch(request);
  }
  const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
  if (url.pathname !== '/api/health' || !['GET', 'HEAD'].includes(request.method)) {
    return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404, headers });
  }
  try {
    const origin = new URL(env.BACKEND_ORIGIN);
    if (origin.protocol !== 'https:' || !origin.hostname.endsWith('.run.app') ||
        origin.username || origin.password || origin.port || origin.pathname !== '/' ||
        origin.search || origin.hash) throw new Error('Invalid backend origin');
    const upstream = new URL('/health', origin);
    upstream.search = url.search;
    const response = await fetchBackend(upstream, {
      method: request.method,
      headers: { Accept: 'application/json' },
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
      // Cloudflare must never cache API responses.
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    if (![200, 400].includes(response.status)) throw new Error('Backend unavailable');
    return new Response(request.method === 'HEAD' ? null : response.body, {
      status: response.status, headers,
    });
  } catch {
    return new Response(JSON.stringify({ message: 'Backend unavailable' }), { status: 502, headers });
  }
}

export default { fetch: (request, env) => handleRequest(request, env) };
