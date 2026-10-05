import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

test("health identifies tested release without enabling private-data access", async () => {
  const result = await worker.fetch(new Request("https://relay.test/health"), {
    ENVIRONMENT: "production",
    RELEASE_SHA: "test-sha",
  });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.deepEqual(await result.json(), {
    status: "ok",
    service: "agent-gateway-relay",
    environment: "production",
    revision: "test-sha",
    sourceAccessEnabled: false,
  });
});

test("all unfinished private-data and transport routes fail closed", async () => {
  for (const path of ["/v1/requests", "/v1/results", "/connect/gmail", "/"]) {
    const result = await worker.fetch(
      new Request(`https://relay.test${path}`, {
        method: "POST",
        body: "private input",
      }),
      {},
    );
    assert.equal(result.status, 404);
    assert.deepEqual(await result.json(), { error: "not_found" });
  }
});

test("health rejects mutating methods", async () => {
  const result = await worker.fetch(
    new Request("https://relay.test/health", { method: "POST" }),
    {},
  );
  assert.equal(result.status, 405);
  assert.equal(result.headers.get("allow"), "GET");
});
