const required = [
  'GCP_PROJECT_ID', 'GCP_REGION', 'ARTIFACT_REGISTRY_REPOSITORY', 'CLOUD_RUN_SERVICE',
  'CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT', 'GCP_WORKLOAD_IDENTITY_PROVIDER', 'GCP_DEPLOY_SERVICE_ACCOUNT',
  'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_WORKER_NAME', 'PRODUCTION_URL', 'CODEMAGIC_APP_ID',
  'CLOUDFLARE_API_TOKEN', 'CODEMAGIC_API_TOKEN', 'NEON_DATABASE_URL',
];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Missing production configuration: ${missing.join(', ')}`);
  process.exitCode = 1;
} else {
  try {
    const url = new URL(process.env.PRODUCTION_URL);
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.username || url.password || url.search || url.hash) {
      throw new Error('Invalid URL');
    }
    console.log('Required production configuration is present.');
  } catch {
    console.error('PRODUCTION_URL must be an HTTPS origin with no credentials, path, query, or fragment.');
    process.exitCode = 1;
  }
}
