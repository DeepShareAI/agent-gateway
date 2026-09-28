# Day 1 — PR01 validation

Status: skeleton implemented; full milestone acceptance is pending Docker and native-device verification. Day 2 has not started.

## Implemented

- NestJS backend with public `GET /health`, validated configuration, and a reusable Zod input-validation pipe.
- React dashboard with live backend status, a five-second request timeout, and retry.
- Flutter welcome screen with Android, iOS, and web runners.
- PostgreSQL, backend, and web Compose services with startup health checks and persistent database storage.
- Lockfiles, local configuration setup, CI, OpenAPI, architecture, and security documentation.

## Checks run

| Check | Result |
| --- | --- |
| TypeScript type checking | Passed for backend and web |
| ESLint | Passed |
| Backend Jest/Supertest | 24 tests passed |
| Backend and React production builds | Passed |
| Playwright dashboard checks | 4 tests passed using installed Chrome |
| Dashboard visual review | Passed at desktop width; narrow viewport also covered by Playwright |
| Flutter static analysis | Passed, no issues |
| Flutter widget tests | 2 tests passed, including small screen with enlarged text |
| Flutter web production build | Passed |
| Local environment setup | Creates `.env`, preserves existing configuration, and is ignored by Git |
| Compose, CI, and OpenAPI YAML | Parsed successfully; this is not container runtime verification |
| Git whitespace validation | Passed |

The development host has macOS 12.7.6. Node.js 22.23.3 and Flutter 3.35.7/Dart 3.9.2 were provisioned temporarily under `/tmp` for these checks; they were not installed into the system PATH. Flutter is pinned to 3.35.7 in CI because the latest SDK could not run on this host. Playwright used the installed Chrome through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` because its bundled Chromium does not support this OS. Normal CI uses Playwright's bundled Chromium on Linux.

## Remaining acceptance checks

- Docker is not installed on this host, so image builds, PostgreSQL startup/persistence, Nginx proxying, and `docker compose up` have not been exercised locally. The containers CI job builds and starts all services and checks direct and proxied health; that job has not been run here.
- No Android emulator or iOS simulator/toolchain is available. Native builds and device launch remain unverified. Widget tests and a Flutter web build do not substitute for those checks.

## Scope and security

No database schema or migrations are introduced. The health endpoint checks process liveness only. No authentication or private-data APIs are exposed. Validation errors omit user-provided values, Compose ports bind to loopback, and the database password is generated into an ignored file.

The next planned milestone is PR02 (database and domain model), after Day 1 acceptance is verified and further work is requested.
