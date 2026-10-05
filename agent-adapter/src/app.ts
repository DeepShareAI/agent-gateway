import type { IncomingMessage, ServerResponse } from "node:http";

export function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
): void {
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "GET" && request.url === "/health") {
    response.end(
      JSON.stringify({
        status: "ok",
        service: "demo-agent",
        callbackEnabled: false,
      }),
    );
    return;
  }
  // No unauthenticated callback or retained request bodies in the foundation.
  response.statusCode = 404;
  response.end(JSON.stringify({ error: "not_found" }));
}
