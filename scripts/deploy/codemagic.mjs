import { appendFileSync, writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const active = new Set(['initializing', 'queued', 'preparing', 'fetching', 'testing', 'building', 'publishing', 'finishing']);
export function buildOutcome(payload) {
  const status = payload?.data?.status;
  if (status === 'finished') return 'success';
  if (active.has(status)) return 'pending';
  if (['failed', 'canceled', 'timeout', 'skipped'].includes(status)) return 'failure';
  throw new Error('Unrecognized Codemagic status');
}

export async function runBuild({ token, appId, sha, workflow, buildNumber }, {
  request = fetch, sleep = delay, now = Date.now, onStart = () => {}, timeout = 90 * 60 * 1000,
} = {}) {
  if (!token || !/^[a-f0-9]{24}$/.test(appId ?? '') || !/^[a-f0-9]{40}$/.test(sha ?? '') ||
      !['android-production', 'ios-production'].includes(workflow) || !/^\d+$/.test(buildNumber ?? '')) {
    throw new Error('Missing or invalid Codemagic configuration');
  }
  const api = async (url, method = 'GET', body) => {
    const response = await request(url, {
      method, headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30000), redirect: 'error',
    });
    if (!response.ok) throw new Error(`Codemagic API returned HTTP ${response.status}`);
    return response;
  };
  const started = await (await api('https://api.codemagic.io/builds', 'POST', {
    appId, workflowId: workflow, branch: 'main',
    environment: { variables: { EXPECTED_COMMIT: sha, RELEASE_BUILD_NUMBER: buildNumber } },
  })).json();
  const id = started.buildId;
  if (!/^[a-f0-9]{24}$/.test(id ?? '')) throw new Error('Missing Codemagic build ID');
  onStart(id);
  let finished = false;
  try {
    const deadline = now() + timeout;
    while (now() < deadline) {
      const outcome = buildOutcome(await (await api(`https://codemagic.io/api/v3/builds/${id}`)).json());
      if (outcome === 'success') { finished = true; return id; }
      if (outcome === 'failure') { finished = true; throw new Error('Codemagic build did not succeed'); }
      await sleep(20000);
    }
    throw new Error('Codemagic build timed out');
  } finally {
    if (!finished) {
      await api(`https://api.codemagic.io/builds/${id}/cancel`, 'POST').catch(() => {});
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const workflow = process.env.CODEMAGIC_WORKFLOW;
  runBuild({
    token: process.env.CODEMAGIC_API_TOKEN, appId: process.env.CODEMAGIC_APP_ID,
    sha: process.env.GITHUB_SHA, workflow, buildNumber: process.env.RELEASE_BUILD_NUMBER,
  }, {
    onStart: (id) => {
      console.log(`Codemagic build started: ${id}`);
      if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        `\nCodemagic ${workflow}: [${id}](https://codemagic.io/app/${process.env.CODEMAGIC_APP_ID}/build/${id})\n`);
    },
  }).then((id) => {
    writeFileSync(`codemagic-${workflow}.json`, JSON.stringify({ commit: process.env.GITHUB_SHA, workflow, buildId: id, status: 'finished' }, null, 2));
    console.log('Codemagic build finished successfully. Artifacts are available in the build dashboard.');
  }).catch(() => {
    console.error('Codemagic build failed or could not be verified. Review the linked build and configuration.');
    process.exitCode = 1;
  });
}
