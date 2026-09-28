import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

try {
  writeFileSync(new URL('../.env', import.meta.url),
    `POSTGRES_USER=agent_gateway\nPOSTGRES_DB=agent_gateway\nPOSTGRES_PASSWORD=${randomBytes(32).toString('hex')}\n`,
    { flag: 'wx', mode: 0o600 });
  console.log('Created .env with a random local database password.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('Keeping the existing .env.');
}
