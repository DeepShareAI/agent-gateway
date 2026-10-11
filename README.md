# Agent Gateway

A privacy and authorization gateway between AI agents and users' private data.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Backend | Node.js, TypeScript, NestJS |
| Validation | Zod for runtime schemas in the TypeScript backend and web app |
| Web | React, TypeScript |
| Mobile | Flutter |
| Database | Neon PostgreSQL, Prisma |
| Agent protocol | MCP, REST API |
| Push | APNs, FCM |
| CI/CD | GitHub Actions; Codemagic for mobile builds and releases |
| Production | Cloudflare (web and edge), Cloud Run (backend), Neon PostgreSQL, Codemagic |
| Local development | Docker Compose |
| Testing | Jest, Supertest, Playwright, Flutter Test |

Zod validates backend configuration, REST input, and health responses in the web app. Future REST endpoints, MCP tools, and React forms will use Zod schemas. Backend validation is authoritative.

## Day 1 — Full-stack skeleton

Implemented: NestJS `GET /health`, a React dashboard with live backend status and retry, a basic Flutter screen, and Docker Compose services for PostgreSQL, backend, and web. Authentication, private data access, Prisma models, and migrations belong to later milestones.

### Day 1 production environment

Production must use Cloudflare, Cloud Run, Neon PostgreSQL, and Codemagic from Day 1. GitHub Actions owns CI/CD orchestration and deployment gates; Codemagic runs mobile platform builds, signing, and distribution. Docker Compose remains the local development setup. A hosted test environment is deferred; CI checks and local testing remain required.

The repository includes production deployment/rollback workflows, Cloudflare routing, Neon connectivity checks, and signed Codemagic build configuration. Provider setup and live deployment verification remain pending Day 1 acceptance. See the [deployment requirements](docs/deployment.md) and [validation status](docs/day-1-validation.md).

### Start with Docker Compose

Requires Node.js 22.12+ (22.x) and Docker with Compose v2.

```bash
npm run setup
docker compose up --build --wait
```

`setup` creates an ignored `.env` with a random local database password and preserves an existing file. Alternatively, copy `.env.example` to `.env` and fill in `POSTGRES_PASSWORD`; Node.js is then only required for development outside Docker.

- Dashboard: http://localhost:5173
- Backend liveness: http://localhost:3000/health
- Proxied liveness: http://localhost:5173/api/health

Compose waits for PostgreSQL and backend health checks before starting dependent services. PostgreSQL persists in a named volume and has no published host port. Stop services with `docker compose down`; data is retained. This setup is for local development.

### Use Colima on macOS

Colima can provide the Docker engine instead of Docker Desktop. It requires the Docker CLI, Compose, and Buildx as well as Lima and a compatible VM backend.

```bash
colima start --runtime docker --cpus 2 --memory 3 --disk 20
docker context use colima
npm run setup
docker compose up --build --wait
```

Stop any native backend/web development servers first so ports 3000 and 5173 are free. To stop the stack and VM while retaining database data:

```bash
docker compose down
colima stop
```

On this project's macOS 12.7.6 development machine, Colima uses QEMU with a Monterey-compatible runtime installed under `~/.local`; Docker plugins are under `~/.docker/cli-plugins`. These tools are installed manually, not managed by Homebrew. The saved VM configuration uses 2 CPUs, 3 GB RAM, a 20 GB data disk, and a project-only 9p mount. After a reboot, `colima start` reuses that configuration. Other Macs need their own compatible Colima installation.

### Develop backend and web locally

```bash
npm ci
npm run dev:backend
```

In another terminal:

```bash
npm run dev:web
```

The Day 1 health endpoint is a liveness check and does not connect to PostgreSQL. Vite proxies `/api` requests to the backend on port 3000; Docker uses Nginx for the same route. Native backend development defaults to loopback and accepts `PORT` and `HOST` environment variables. Keep port 3000 when using the supplied web proxy configuration.

### Run mobile

Requires Flutter 3.35.7 (the pinned CI version) and the platform tools for your device or simulator.

```bash
cd mobile
flutter pub get
flutter run
```

See [mobile setup](mobile/README.md) for platform requirements and checks.

### Verify

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run test:deployment
npm run build
npx playwright install chromium
npm run test:e2e
cd mobile
flutter analyze
flutter test
```

Playwright starts the backend and Vite automatically. CI also builds the containers and checks backend health through the web proxy. See [Day 1 validation](docs/day-1-validation.md) for checks actually run in the development environment.

## Documentation

- [Product specification](SPEC.md)
- [Development plan](PLAN.md)
- [Development rules](RULE.md)
- [Architecture](docs/architecture.md)
- [API contract](docs/api.md)
- [Security boundaries](docs/security.md)

- [Deployment and CI/CD](docs/deployment.md)
