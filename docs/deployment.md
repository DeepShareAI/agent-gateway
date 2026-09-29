# Deployment and CI/CD

## Day 1 requirement and current status

GitHub Actions orchestrates CI/CD. Cloudflare, Cloud Run, Neon PostgreSQL, and Codemagic are required for production from Day 1. A hosted test environment is deferred for now. Docker Compose supports local development; automated tests continue locally and in CI.

The repository currently implements the local skeleton and GitHub Actions checks. Cloud deployment workflows, provider resources, and Codemagic integration are pending. This document defines the required target; it does not claim that environments are live. See [Day 1 validation](day-1-validation.md) for recorded evidence.

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
