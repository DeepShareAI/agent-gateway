# Day 1 architecture

The repository is an npm workspace containing `backend/` (NestJS) and `web/` (React/Vite), alongside a standalone Flutter application in `mobile/`.

```text
Browser → /api/health → Vite (development) or Nginx (Docker) → NestJS /health

Docker Compose → PostgreSQL (persistent volume, internal port only)

Flutter → basic local Agent Gateway screen
```

The backend exposes a public process liveness check. It does not yet open database connections or serve private data. Compose starts PostgreSQL first and gates backend/web startup on service health. Prisma schema and database integration are Day 2 work.

The web app validates the health response with Zod and displays checking, online, or unavailable states. Checks time out after five seconds and can be retried. All browser API calls use the same origin; no cross-origin backend access is configured.

`backend/src/common/zod-validation.pipe.ts` provides reusable runtime input validation. Each future route must bind an appropriate schema to its body, query, and path inputs. Parsed types are inferred from schemas. The current health route rejects unknown query parameters.

The Flutter foundation renders a static screen and does not claim to have a backend connection. API client, authentication, and approval flows are later milestones.

## Required production architecture from Day 1

```text
Browser → Cloudflare web hosting and edge → /api/* → Cloud Run NestJS
                                                        │
                                                        ▼
                                                  Neon PostgreSQL

GitHub Actions → checks → production deployment gate → production
               → Codemagic → Android/iOS builds and distribution
```

Provision the production environment from Day 1; defer a hosted test environment. Keep local/CI testing isolated from production resources and secrets. Cloudflare must preserve same-origin browser API routing, mapping `/api/health` to backend `/health`, and must not cache API responses. Cloud Run must listen on its supplied port on `0.0.0.0`; local loopback defaults need deployment configuration. Neon provisioning and a separate connectivity check are Day 1 requirements; Prisma domain models and migrations remain Day 2.

The diagram describes the required deployment target. Cloudflare Worker configuration and GitHub Actions/Codemagic release workflows are implemented in the repository; live provider setup and verification remain pending. Flutter remains a static screen until its API client milestone, but native builds and release configuration in Codemagic are required from Day 1. See [deployment and CI/CD](deployment.md).

## Implementation references

- [NestJS pipes](https://docs.nestjs.com/pipes): validate arguments before route handlers.
- [Zod parsing and type inference](https://zod.dev/basics): schemas define runtime validation and TypeScript types.
- [Vite setup](https://vite.dev/guide/): React development and production bundling.
- [Compose startup ordering](https://docs.docker.com/compose/how-tos/startup-order/): gate dependencies on health checks.
- [Flutter project creation](https://docs.flutter.dev/reference/create-new-app): generate platform runners.

The Day 1 Worker routes only GET/HEAD `/api/health`, preserves query validation, strips client credentials, and returns uncached generic errors if the origin fails. Other API routes return 404. Cloud Run exposes the public liveness endpoint directly as well; backend authorization remains mandatory when private routes arrive. Production deployment uses a digest-pinned container and requires CI, Neon connectivity, and both Codemagic builds to pass.
