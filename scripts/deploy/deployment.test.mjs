import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOutcome, runBuild } from './codemagic.mjs';
import { connectionOptions } from './neon-check.mjs';

const config = { token: 'private-token', appId: 'a'.repeat(24), sha: 'b'.repeat(40), workflow: 'android-production', buildNumber: '101' };
const buildId = 'c'.repeat(24);
const json = (body) => new Response(JSON.stringify(body));

test('Neon check always verifies TLS, ignoring unsafe URL options', () => {
  const options = connectionOptions('postgresql://user:p%40ss@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=disable');
  assert.deepEqual(options.ssl, { rejectUnauthorized: true });
  assert.equal(options.password, 'p@ss');
  assert.equal(options.connectionTimeoutMillis, 15000);
  for (const url of ['postgres://user:pass@localhost/db', 'https://user:pass@foo.neon.tech/db', 'postgres://foo.neon.tech/db']) {
    assert.throws(() => connectionOptions(url));
  }
});

test('only finished succeeds; failed, skipped, malformed status fail closed', () => {
  assert.equal(buildOutcome({ data: { status: 'finished' } }), 'success');
  for (const status of ['failed', 'canceled', 'timeout', 'skipped']) {
    assert.equal(buildOutcome({ data: { status } }), 'failure');
  }
  assert.throws(() => buildOutcome({ status: 'finished' }));
  assert.throws(() => buildOutcome({ data: { status: 'unknown' } }));
});

test('Codemagic trigger pins expected source and waits for completion', async () => {
  let requests = 0;
  let sleeps = 0;
  const id = await runBuild(config, {
    request: async (url, options) => {
      requests++;
      if (requests === 1) {
        const body = JSON.parse(options.body);
        assert.equal(body.environment.variables.EXPECTED_COMMIT, config.sha);
        assert.equal(body.environment.variables.RELEASE_BUILD_NUMBER, '101');
        assert.equal(body.branch, 'main');
        assert.equal(options.headers['x-auth-token'], config.token);
        return json({ buildId });
      }
      assert.equal(url, `https://codemagic.io/api/v3/builds/${buildId}`);
      return json({ data: { status: requests === 2 ? 'building' : 'finished' } });
    },
    sleep: async () => { sleeps++; },
  });
  assert.equal(id, buildId);
  assert.equal(requests, 3);
  assert.equal(sleeps, 1);
});

test('failed build prevents deployment', async () => {
  let count = 0;
  await assert.rejects(runBuild(config, {
    request: async () => ++count === 1 ? json({ buildId }) : json({ data: { status: 'failed' } }),
  }), /did not succeed/);
});

test('polling timeout cancels unfinished remote build', async () => {
  const calls = [];
  await assert.rejects(runBuild(config, {
    timeout: 0,
    request: async (url) => { calls.push(url); return json({ buildId }); },
  }), /timed out/);
  assert.equal(calls.at(-1), `https://api.codemagic.io/builds/${buildId}/cancel`);
});

test('API errors omit provider response and credentials', async () => {
  await assert.rejects(runBuild(config, {
    request: async () => new Response('private-token', { status: 403 }),
  }), (error) => error.message === 'Codemagic API returned HTTP 403');
});
