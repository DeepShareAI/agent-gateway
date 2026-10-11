# Deployment and CI/CD

## Day 1 requirement and current status

GitHub Actions orchestrates CI/CD. Cloudflare, Cloud Run, Neon PostgreSQL, and Codemagic are required for production from Day 1. A hosted test environment is deferred for now. Docker Compose supports local development; automated tests continue locally and in CI.

The repository implements the local skeleton, GitHub Actions deployment and rollback workflows, Cloudflare routing, a Neon connectivity check, and Codemagic build orchestration. Provider resources, credentials, and live deployment acceptance remain pending; no production environment is claimed live. See [Day 1 validation](day-1-validation.md) for recorded evidence.

## Environment contract

| Component | Production |
| --- | --- |
| Cloudflare | Web deployment, hostname, HTTPS, and API routing |
| Cloud Run | NestJS service and runtime identity |
| Neon PostgreSQL | Production project/database and credentials |
| Codemagic | Android/iOS signed release builds and gated distribution |
| GitHub Actions | CI checks and protected production deployment gate |

Cloudflare hosts the React web build and routes same-origin `/api/*` traffic to the production Cloud Run backend, removing the `/api` prefix. API responses must not be cached. Configure Cloud Run to listen on `0.0.0.0` and the supplied `PORT`. Verify HTTPS and origin access controls before acceptance.

Provision production Neon on Day 1 and verify connectivity over TLS in a dedicated deployment check. The current backend does not access the database; `/health` remains a process liveness check. Prisma models and migrations begin on Day 2. Once migrations exist, validate them against disposable local/CI PostgreSQL, then run them in a controlled production deployment step; do not run migrations from every backend instance at startup.

Codemagic owns native platform tooling, signing, and mobile distribution. Maintain explicit production configuration, application identifiers, and signing credentials. The Day 1 Flutter screen stays static; environment-specific API connections arrive with the API client milestone.

## Delivery flow

1. Pull requests run GitHub Actions type checking, lint, unit/API tests, web builds, browser tests, container smoke checks, and Flutter checks. Untrusted contributions must not receive deployment or signing secrets.
2. A passing commit on `main` builds identifiable web/backend artifacts. GitHub Actions starts the corresponding Codemagic native build and waits for its result; a successful trigger alone is insufficient. Record commit, artifact, and workflow identifiers together.
3. Deploy the validated commit through a protected GitHub Actions production environment. Deploy the verified web/backend artifacts and invoke and await any remaining production Codemagic signing/release steps. Any rebuild must use the same source commit and repeat applicable checks.
4. Validate the deployed production dashboard and proxied health endpoint, check Neon connectivity separately, and verify Android/iOS release artifacts and signing configuration. Record deployment results. Public app-store publication requires a separate release decision.

Serialize production deployments to prevent overlapping releases. Use least-privilege provider credentials and short-lived cloud authentication where supported. Keep runtime secrets in managed secret storage and mobile signing material in Codemagic secret management. Do not embed secrets in React or Flutter builds.

## Day 1 acceptance evidence

- Passing GitHub Actions runs linked to the deployed commit, including Codemagic completion results.
- Production URLs serving the dashboard and the expected `/api/health` response without caching.
- Production Neon resources with successful TLS connectivity checks and no credentials in logs. No domain schema is required until Day 2.
- Successful Android and iOS Codemagic production builds, artifact identifiers, and verified production signing/release configuration.
- Native-device or simulator launch evidence in addition to widget tests and Flutter web builds.
- Isolation from local/CI testing and secret configuration reviewed; only the public skeleton is exposed until later authentication milestones.
- A rehearsed rollback to a previous Cloud Run revision and Cloudflare web deployment, with smoke checks after rollback. Preserve prior mobile artifacts and document mobile release recovery; installed mobile binaries require a subsequent release to change.

Record evidence and outstanding blockers in [Day 1 validation](day-1-validation.md). Local Compose success alone does not complete Day 1.

## Later milestones

Day 2 adds Prisma domain models, migration gates, and database integration tests against disposable local/CI PostgreSQL. Day 24 reviews and strengthens the existing security controls. Day 25 validates the complete MVP on the production environment and release pipelines established on Day 1. Neither cloud setup nor mobile delivery infrastructure is deferred to those milestones.

## Repository implementation

- `.github/workflows/ci.yml`: reusable CI checks, including deployment-script tests and a Cloudflare bundle dry run.
- `.github/workflows/production.yml`: repeats required checks for the selected `main` commit, enters the protected `production` environment, checks Neon, builds artifacts, awaits signed Android and iOS builds, deploys Cloud Run by image digest, deploys the Cloudflare Worker with static assets, and runs smoke checks.
- `.github/workflows/rollback.yml`: manually restores an explicitly selected Cloud Run revision and Cloudflare version, then runs smoke checks. It shares the deployment concurrency lock.
- `codemagic.yaml`: signed Android AAB/APK and iOS IPA workflows. Artifacts stay in the authenticated Codemagic build dashboard; no public store submission is enabled.
- `infra/cloudflare/`: static React assets and an uncached proxy for the Day 1 health API. Unknown API routes do not fall through to the SPA.
- `scripts/deploy/`: configuration validation, Neon TLS connectivity, Codemagic orchestration, and deployed smoke checks.

Deployment workflows are available for manual dispatch on `main`. Automatic deployment on push requires the **repository** variable `PRODUCTION_DEPLOY_ENABLED=true`; leave it unset until account setup and the first manual deployment are verified. The production environment must restrict deployment branches to `main` and require approval before secrets are released. Configure this in GitHub; naming an environment in YAML does not create its protection rules.

Codemagic receives `main` plus `EXPECTED_COMMIT`. Each workflow checks the actual checkout against that SHA before building. If `main` advances before Codemagic clones, the release fails safely; rerun for the new validated commit. Native build numbers derive from the production workflow run number and attempt. Preserve this numbering sequence when migrating workflows or uploading releases manually. GitHub waits up to 90 minutes per mobile build and requests cancellation on polling failure or timeout. If the GitHub runner is forcibly terminated, inspect Codemagic and cancel any orphaned build manually.

## Production account setup

1. **Google Cloud:** select a billing-enabled project and region. Enable Cloud Run, Artifact Registry, IAM Credentials, and Security Token Service APIs. Create a Docker Artifact Registry repository in that region, a deployment service account, and a separate runtime service account. Grant the deployer Artifact Registry Writer on the repository, Cloud Run Admin for deployment/IAM changes, and Service Account User on the runtime account. The skeleton runtime needs no database credentials or additional API roles.
2. **GitHub OIDC:** configure a Workload Identity Federation provider for GitHub's issuer. Restrict its attribute condition to this repository and `refs/heads/main`, and restrict service-account impersonation to this repository's `production` environment subject. Do not create a long-lived Google service-account key. Set the provider and service-account identifiers below.
3. **Cloudflare:** enable Workers and a Workers subdomain in the selected account. Create an account-scoped API token with Workers Scripts write access. Set the Worker name and its expected `https://<worker>.<subdomain>.workers.dev` URL. Custom domains are optional; configure a Worker custom domain and matching `PRODUCTION_URL` before using one. The same Worker deployment contains the React assets and proxy.
4. **Neon:** create a production project/database near the Cloud Run region and a dedicated connectivity-check role with login and database connect privileges. Store its PostgreSQL connection string only in the `production` environment secret `NEON_DATABASE_URL`. The check performs `SELECT 1`, requires a `*.neon.tech` host, and verifies the TLS certificate and hostname regardless of URL SSL parameters. It creates no tables and does not make the runtime use the database.
5. **Codemagic:** connect this GitHub repository as an app using the root `codemagic.yaml`. Upload the production Android keystore under reference `agent_gateway_production`, and upload Apple distribution signing material and an App Store provisioning profile matching `com.agentgateway.agentGatewayMobile`. Confirm the generated Android application ID and iOS bundle ID are owned and suitable before releasing; change the project and YAML together if needed. Store the Codemagic API token in GitHub's production secrets. Do not enable independent push triggers that bypass the GitHub gate.
6. **GitHub:** create and protect the `production` environment, then enter the following configuration. Run **Production deployment** on `main` after the code is committed and pushed. Review the run summary, Cloudflare version printed in the deployment log, saved web artifact, and linked Codemagic artifacts. Record the evidence in Day 1 validation.

### GitHub production environment variables

| Name | Value |
| --- | --- |
| `GCP_PROJECT_ID` | Google Cloud project ID |
| `GCP_REGION` | Selected Cloud Run / Artifact Registry region |
| `ARTIFACT_REGISTRY_REPOSITORY` | Existing Docker repository name |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full `projects/.../locations/global/workloadIdentityPools/.../providers/...` identifier |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | Deployment service-account email |
| `CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT` | Runtime service-account email |
| `CLOUD_RUN_SERVICE` | Production backend service name |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_WORKER_NAME` | Production Worker name |
| `PRODUCTION_URL` | HTTPS dashboard origin, without a path or credentials |
| `CODEMAGIC_APP_ID` | Codemagic application ID |

### GitHub production environment secrets

| Name | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Deploy Worker code and static assets |
| `CODEMAGIC_API_TOKEN` | Start, inspect, and cancel native builds |
| `NEON_DATABASE_URL` | Dedicated production database connectivity check |

Signing keys stay in Codemagic. `CM_KEYSTORE_PATH`, `CM_KEYSTORE_PASSWORD`, `CM_KEY_ALIAS`, and `CM_KEY_PASSWORD` are supplied there from the uploaded keystore. Android release builds fail if these values are missing; local debug builds remain available. The iOS workflow uses Flutter 3.35.7 and Xcode 16.4; actual native builds must verify that pairing before acceptance or a later SDK upgrade.

## Origin boundary and rollback procedure

For the Day 1 public skeleton, the Cloud Run origin permits unauthenticated access to `/health`; all private-data routes remain unimplemented. Cloudflare is not an authentication boundary, and its route allowlist does not protect the direct origin. Before introducing private routes, enforce their authentication/authorization at the backend and review whether to restrict direct origin ingress. No database credential is attached to the Day 1 Cloud Run service.

Record the Cloud Run revision/image digest and Cloudflare Worker version for each successful deployment. To roll back, dispatch **Production rollback** on `main` with the previous verified revision and Worker version from the same release, approve the production gate, and confirm smoke checks. If there is no prior deployment, there is no rollback target: establish a verified baseline, deploy a second revision, and rehearse restoring the baseline before claiming rollback acceptance. Deployment is not atomic across providers; a failed Cloudflare deployment or smoke check can leave a new backend live and requires operator review and rollback. No automatic database rollback is attempted. Preserve signed mobile artifacts; changing an installed binary requires another release.

## Provider references

- [Cloudflare static asset configuration](https://developers.cloudflare.com/workers/static-assets/binding/) and [version rollback](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).
- [Google workload identity for deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines).
- [Codemagic build trigger API](https://docs.codemagic.io/rest-api/builds/), [build status polling](https://docs.codemagic.io/integrations/jenkins-integration/), and [YAML validation](https://docs.codemagic.io/yaml-basic-configuration/yaml-getting-started/).
