for (const [port, service] of [
  [8787, "agent-gateway-relay"],
  [8788, "mock-providers"],
  [8789, "demo-agent"],
]) {
  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    signal: AbortSignal.timeout(10000),
  });
  const body = await response.json();
  if (!response.ok || body.status !== "ok" || body.service !== service)
    throw new Error(`${service} health failed`);
}
const privateRoute = await fetch("http://127.0.0.1:8787/v1/requests", {
  method: "POST",
});
if (privateRoute.status !== 404)
  throw new Error("Unfinished source access must remain disabled");
console.log("Local Compose foundation smoke checks passed");
