import { createServer } from "node:http";

createServer((request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.method === "GET" && request.url === "/health") {
    response.end(
      JSON.stringify({
        status: "ok",
        service: "mock-providers",
        liveProvidersEnabled: false,
      }),
    );
  } else {
    response.statusCode = 501;
    response.end(JSON.stringify({ error: "provider_not_implemented" }));
  }
}).listen(8788, "0.0.0.0");
