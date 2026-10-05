const url = new URL("/health", process.env.RELAY_URL);
if (url.protocol !== "https:")
  throw new Error("Production/staging health requires HTTPS.");
const response = await fetch(url, {
  signal: AbortSignal.timeout(30000),
  redirect: "error",
});
const health = await response.json();
if (
  !response.ok ||
  health.status !== "ok" ||
  health.service !== "agent-gateway-relay" ||
  health.sourceAccessEnabled !== false ||
  health.revision !== process.env.EXPECTED_REVISION ||
  health.environment !== process.env.EXPECTED_ENVIRONMENT
) {
  throw new Error(
    "Deployed health response does not match the tested release.",
  );
}
console.log(
  `Verified ${health.environment} relay at revision ${health.revision}`,
);
