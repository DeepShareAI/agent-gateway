import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { handleRequest } from './worker.mjs';

const env = { BACKEND_ORIGIN: 'https://gateway.example.run.app', ASSETS: { fetch: () => new Response('dashboard') } };

test('non-API routes use static assets, including the default Worker entry point', async () => {
  const response = await worker.fetch(new Request('https://gateway.example/settings'), env, {});
  assert.equal(await response.text(), 'dashboard');
});

test('health forwards query and method without cookies or authorization, never caches', async () => {
  const request = new Request('https://gateway.example/api/health?unexpected=1', {
    headers: { Cookie: 'private=value', Authorization: 'Bearer secret' },
  });
  const response = await handleRequest(request, env, async (url, options) => {
    assert.equal(url.href, 'https://gateway.example.run.app/health?unexpected=1');
    assert.deepEqual(options.headers, { Accept: 'application/json' });
    assert.equal(options.redirect, 'manual');
    assert.equal(options.cf.cacheTtl, 0);
    return new Response('{"message":"Request validation failed"}', { status: 400 });
  });
  assert.equal(response.status, 400);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('unknown API routes and mutation do not reach origin or SPA', async () => {
  for (const [path, method] of [['/api', 'GET'], ['/api/private', 'GET'], ['/api/health', 'POST'], ['/api//evil.example', 'GET']]) {
    const response = await handleRequest(new Request(`https://gateway.example${path}`, { method }), env,
      () => assert.fail('must not contact backend'));
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
});

test('HEAD health has no body', async () => {
  const response = await handleRequest(new Request('https://gateway.example/api/health', { method: 'HEAD' }), env,
    async () => new Response(null));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
});

test('invalid origins, redirects, and network failures produce generic uncached errors', async () => {
  for (const origin of ['http://gateway.run.app', 'https://evil.example', 'https://gateway.run.app/other', 'https://user:secret@gateway.run.app']) {
    const response = await handleRequest(new Request('https://gateway.example/api/health'), { ...env, BACKEND_ORIGIN: origin },
      () => assert.fail('invalid origin must not be fetched'));
    assert.equal(response.status, 502);
  }
  for (const fetcher of [async () => Response.redirect('https://evil.example'), async () => { throw new Error('secret'); }]) {
    const response = await handleRequest(new Request('https://gateway.example/api/health'), env, fetcher);
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { message: 'Backend unavailable' });
  }
});
