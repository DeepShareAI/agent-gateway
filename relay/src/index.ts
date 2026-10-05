export interface RelayEnvironment {
  ENVIRONMENT?: string;
  RELEASE_SHA?: string;
}

// Day 1 intentionally exposes health only. No source access, routing, or secrets.
export default {
  async fetch(request: Request, env: RelayEnvironment): Promise<Response> {
    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    if (new URL(request.url).pathname !== "/health") {
      return Response.json({ error: "not_found" }, { status: 404, headers });
    }
    if (request.method !== "GET") {
      return Response.json(
        { error: "method_not_allowed" },
        { status: 405, headers: { ...headers, Allow: "GET" } },
      );
    }
    return Response.json(
      {
        status: "ok",
        service: "agent-gateway-relay",
        environment: env.ENVIRONMENT ?? "local",
        revision: env.RELEASE_SHA ?? "local",
        sourceAccessEnabled: false,
      },
      { headers },
    );
  },
};
