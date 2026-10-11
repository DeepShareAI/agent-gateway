import assert from 'node:assert/strict';

try {
  const base = new URL(process.env.PRODUCTION_URL);
  assert.equal(base.protocol, 'https:');
  assert.equal(base.pathname, '/');
  assert.equal(base.username + base.password + base.search + base.hash, '');
  const request = (path) => fetch(new URL(path, base), { redirect: 'error', signal: AbortSignal.timeout(15000) });
  const page = await request('/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<div id="root"><\/div>/);
  const health = await request('/api/health');
  assert.equal(health.status, 200);
  assert.match(health.headers.get('cache-control') ?? '', /no-store/);
  assert.deepEqual(await health.json(), { status: 'ok', service: 'agent-gateway' });
  assert.equal((await request('/api/health?unexpected=1')).status, 400);
  assert.equal((await request('/api/private')).status, 404);
  console.log('Production dashboard and API smoke checks passed.');
} catch {
  console.error('Production smoke checks failed. Inspect the deployment and rollback runbook.');
  process.exitCode = 1;
}
