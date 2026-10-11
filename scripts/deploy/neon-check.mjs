import pg from 'pg';
import { pathToFileURL } from 'node:url';

export function connectionOptions(value) {
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
      !url.hostname.endsWith('.neon.tech') || !url.username || !url.password ||
      url.pathname.length < 2 || (url.port && url.port !== '5432')) {
    throw new Error('Expected a Neon PostgreSQL connection string');
  }
  // Do not allow URL parameters to override certificate verification.
  return {
    host: url.hostname, port: 5432,
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 15000, query_timeout: 10000,
    application_name: 'agent-gateway-deployment-check',
  };
}

export async function checkNeon(value) {
  const client = new pg.Client(connectionOptions(value));
  try {
    await client.connect();
    const result = await client.query('SELECT 1 AS connected');
    if (result.rows[0]?.connected !== 1) throw new Error('Unexpected result');
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkNeon(process.env.NEON_DATABASE_URL).then(() => {
    console.log('Neon TLS connectivity passed (no schema changes).');
  }).catch(() => {
    console.error('Neon connectivity failed. Check the production secret, network, and database status.');
    process.exitCode = 1;
  });
}
