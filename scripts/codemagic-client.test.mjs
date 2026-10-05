import assert from "node:assert/strict";
import test from "node:test";
import { buildOutcome, runBuild } from "./codemagic-client.mjs";

const identity = { appId: "app", workflow: "ios-release", revision: "sha" };
const complete = {
  app_id: "app",
  workflow: { id: "ios-release" },
  commit: { hash: "sha" },
  status: "finished",
  artifacts: [{ name: "gateway.ipa" }],
  app_store_connect_status: "finished",
};

test("upload success alone cannot complete TestFlight delivery", () => {
  assert.equal(
    buildOutcome(
      { ...complete, app_store_connect_status: "processing" },
      identity,
    ),
    "pending",
  );
  assert.equal(
    buildOutcome({ ...complete, app_store_connect_status: null }, identity),
    "pending",
  );
  assert.equal(buildOutcome(complete, identity), "finished");
});

test("wrong revision, workflow, missing artifact and failed publishing fail release", () => {
  for (const change of [
    { commit: { hash: "other" } },
    { workflow: { id: "other" } },
    { artifacts: [] },
    { status: "failed" },
    { app_store_connect_status: "failed" },
  ]) {
    assert.throws(() => buildOutcome({ ...complete, ...change }, identity));
  }
});

test("trigger acceptance and temporary 404 are followed through to authenticated build completion", async () => {
  const id = "a".repeat(24);
  const replies = [
    new Response(JSON.stringify({ data: { id } }), { status: 202 }),
    new Response("", { status: 404 }),
    new Response(JSON.stringify({ data: { ...complete, id } })),
  ];
  let calls = 0;
  const result = await runBuild({
    ...identity,
    workflow: "ios-release",
    branch: "release",
    relayUrl: "https://relay.test",
    token: "test-token",
    sleep: async () => {},
    fetchImpl: async (url, options) => {
      assert.equal(options.headers["x-auth-token"], "test-token");
      assert.equal(options.redirect, "error");
      assert.ok(url.startsWith("https://codemagic.io/api/v3/"));
      calls++;
      return replies.shift();
    },
  });
  assert.equal(calls, 3);
  assert.equal(result.status, "finished");
});

test("queued build exhausts bounded polling instead of reporting success", async () => {
  const id = "a".repeat(24);
  let calls = 0;
  await assert.rejects(
    runBuild({
      ...identity,
      workflow: "ios-release",
      branch: "release",
      relayUrl: "https://relay.test",
      token: "test",
      attempts: 1,
      sleep: async () => {},
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            data:
              calls++ === 0 ? { id } : { ...complete, id, status: "queued" },
          }),
        ),
    }),
    /timed out/,
  );
});
