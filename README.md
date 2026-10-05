# Agent Gateway

Agent Gateway lets third-party agents such as Meta Muse request controlled access to private data. A stateless Cloudflare Worker transports end-to-end encrypted requests and results. A Flutter mobile app owns credentials, connectors, policy enforcement, minimization, PII filtering, and approval.

The relay has no Gmail tokens, plaintext private data, or payload decryption keys.

This repository contains planning documents only; runtime implementation has not started.

The plan establishes production delivery on Day 1: Cloudflare relay, GitHub Actions CI/CD orchestration, Codemagic Android/iOS builds/signing/distribution, and Docker Compose for local development.

- [Product specification](SPEC.md)
- [Development plan](PLAN.md)
- [Development rules](RULE.md)
- [Architecture](docs/architecture.md)
- [Security](docs/security.md)
