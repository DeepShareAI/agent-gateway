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

The skeleton does not implement TLS, authentication, or production hardening. Do not expose its ports publicly. Database schema and credential use in the backend will be added with database integration.

## Verification

API tests check the exact public response, rejection of unexpected input, absent private routes, and unsupported mutation. Unit tests cover invalid environment values, schema bounds, unknown fields, and generic validation errors. Browser tests verify that malformed responses and failed requests do not appear as a healthy connection.
