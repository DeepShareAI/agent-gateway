# Day 1 security boundaries

Only the public liveness endpoint is implemented. There are no agent tokens, OAuth credentials, data connectors, policy decisions, or approval actions. Private-data routes return 404; the skeleton must not be treated as an authenticated production gateway.

## Validation

The Zod pipe rejects invalid input before a route handler executes. Health accepts no query fields. Validation errors are generic and do not echo supplied values, field names, or raw Zod issues. Backend startup validates listener configuration without logging environment values. A future route must explicitly bind its input schemas; importing the pipe alone does not validate all routes.

Schema validation does not grant access. Future agent data requests must preserve this order:

```text
Authentication → Request validation → Policy → Approval when required
→ Data access → Minimization → Sensitive-data filtering → Audit → Response
```

## Local infrastructure

Native backend and web development bind to loopback. Compose publishes web and backend ports only on `127.0.0.1`; PostgreSQL has no host port. The backend container runs as the unprivileged Node user. The browser uses a same-origin proxy.

Database credentials come from the ignored `.env`; `npm run setup` generates a random password with owner-only file permissions and does not overwrite existing configuration. `.env` is excluded from Docker build contexts. The database volume persists across `docker compose down`. Changing the password in `.env` does not change credentials already stored in an initialized PostgreSQL volume.

The local skeleton does not implement TLS, authentication, or production hardening. Do not expose local development ports publicly. Database schema and credential use in the backend will be added with database integration.

## Verification

API tests check the exact public response, rejection of unexpected input, absent private routes, and unsupported mutation. Unit tests cover invalid environment values, schema bounds, unknown fields, and generic validation errors. Browser tests verify that malformed responses and failed requests do not appear as a healthy connection.

## Required cloud boundaries from Day 1

Production uses Cloudflare, Cloud Run, Neon PostgreSQL, and Codemagic from Day 1; a hosted test environment is deferred. Require HTTPS for public traffic and TLS for database connections. Use synthetic data in local/CI tests; never copy production private data or credentials into test jobs. Cloudflare API routing must disable caching and preserve backend authorization boundaries. Edge controls must account for direct Cloud Run origin access.

GitHub Actions gates deployments and production promotion; untrusted pull requests receive no deploy or signing secrets. Use least-privilege environment credentials and short-lived cloud authentication where supported. Store runtime secrets in managed secret storage and signing credentials in Codemagic secret management. Browser and mobile artifacts must contain no database or deployment credentials.

Day 1 production exposes only the dashboard and public liveness response. Private-data routes remain unavailable until their authentication and authorization milestones are complete. Cloud security configuration, isolation from local/CI testing, and rollback checks require evidence before Day 1 acceptance; these controls are requirements, not claims about the current implementation. See [deployment requirements](deployment.md).
