import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(
  new URL("./codemagic-release.mjs", import.meta.url),
);
const revision = "b".repeat(40);
const buildId = "a".repeat(24);

for (const status of ["finished", "failed"]) {
  test(`iOS-only orchestration reports ${status} without starting Android`, async () => {
    const directory = await mkdtemp(join(tmpdir(), "gateway-delivery-"));
    const mock = `
      import assert from 'node:assert/strict';
      let triggers = 0;
      globalThis.fetch = async (url, options) => {
        assert.equal(options.headers['x-auth-token'], 'test-secret');
        if (options.method === 'POST') {
          assert.equal(++triggers, 1);
          const body = JSON.parse(options.body);
          assert.equal(body.workflow_id, 'ios-release');
          assert.equal(body.branch, 'relay-architecture');
          assert.deepEqual(body.environment.variables, {
            EXPECTED_REVISION: '${revision}',
            RELAY_URL: 'https://relay.test',
          });
          return Response.json({ data: { id: '${buildId}' } }, { status: 202 });
        }
        assert.equal(triggers, 1);
        assert.equal(url, 'https://codemagic.io/api/v3/builds/${buildId}');
        return Response.json({ data: {
          id: '${buildId}', app_id: 'test-app', workflow: { id: 'ios-release' },
          commit: { hash: '${revision}' }, status: '${status}',
          artifacts: [{ name: 'gateway.ipa', url: 'https://private-artifact.test' }],
          app_store_connect_status: 'finished',
        } });
      };
    `;
    try {
      const result = spawnSync(
        process.execPath,
        [
          "--import",
          `data:text/javascript,${encodeURIComponent(mock)}`,
          script,
        ],
        {
          cwd: directory,
          env: {
            ...process.env,
            CM_API_TOKEN: "test-secret",
            CM_APP_ID: "test-app",
            RELEASE_BRANCH: "relay-architecture",
            EXPECTED_REVISION: revision,
            RELAY_URL: "https://relay.test",
          },
          encoding: "utf8",
          timeout: 10000,
        },
      );
      assert.ifError(result.error);
      const raw = await readFile(
        join(directory, "delivery-report.json"),
        "utf8",
      );
      const report = JSON.parse(raw);
      assert.equal(report.length, 1);
      assert.equal(report[0].status, status);
      assert.equal(result.status, status === "finished" ? 0 : 1, result.stderr);
      if (status === "finished") {
        assert.equal(report[0].workflow, "ios-release");
        assert.equal(report[0].revision, revision);
        assert.equal(report[0].buildId, buildId);
        assert.equal(report[0].distribution, "testflight-processing-finished");
      } else {
        assert.match(result.stderr, /Mobile delivery failed/);
      }
      assert.ok(!raw.includes("test-secret"));
      assert.ok(!raw.includes("private-artifact.test"));
      assert.ok(!result.stdout.includes("android-release"));
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}
