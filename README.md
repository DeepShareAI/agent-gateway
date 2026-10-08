# Agent Gateway

Agent Gateway lets third-party agents such as Meta Muse request controlled access to private data. A stateless Cloudflare Worker transports end-to-end encrypted requests and results. A Flutter mobile app owns credentials, connectors, policy enforcement, minimization, PII filtering, and approval.

The relay has no Gmail tokens, plaintext private data, or payload decryption keys.

The Day 1 foundation includes a health-only Worker, Flutter Android/iOS shell, local mock services, and delivery workflows. Private-data access is disabled. Live deployment and signed distribution depend on completing the account setup below; they are not established by the configuration files.

The plan establishes production delivery on Day 1: Cloudflare relay, GitHub Actions CI/CD orchestration, Codemagic Android/iOS builds/signing/distribution, and Docker Compose for local development.

- [Product specification](SPEC.md)
- [Development plan](PLAN.md)
- [Development rules](RULE.md)
- [Architecture](docs/architecture.md)
- [Security](docs/security.md)
- [Production account setup and delivery](docs/production-setup.md)
- [Day 1 API](docs/api.md)
- [Day 1 validation status](docs/day1-status.md)

## Local development

Install Node.js 22, Flutter 3.47.6, and Docker with Compose. Run `npm ci`, then `npm run check`. Start the local services with `docker compose up --build --wait`; run `node scripts/smoke.mjs` to check them. Relay health: `http://localhost:8787/health`; mock providers: port 8788; demo agent: port 8789. Use `docker compose down` when finished. No production credentials are needed locally.

For mobile, run `flutter pub get`, `flutter analyze`, `flutter test`, and `flutter run` from `mobile/`. Native Android requires its SDK; iOS builds/signing use a Mac or Codemagic. Release builds use `ENVIRONMENT`, `RELAY_URL`, and `RELEASE_SHA` Dart defines; secrets are never embedded in app configuration.

CI runs on pull requests and pushes to `main`/`relay-architecture`. The manually dispatched **Production delivery** workflow verifies its revision, deploys staging/production Workers, and orchestrates only the Codemagic `ios-release` workflow. Android signing and distribution are deferred; Android debug-build CI checks remain enabled. Configure the production GitHub environment and iOS signing/distribution accounts before dispatching it.
