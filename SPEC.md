# Agent Gateway

## Problem

Users want agents such as Meta Muse to perform useful tasks with Gmail and other private sources while controlling exactly which information is disclosed.

## Solution

A mobile-authoritative gateway runs in Flutter with native iOS/Android security integrations. A stateless Cloudflare Worker relays encrypted requests through APNs/FCM and encrypted results over HTTPS. OAuth credentials and payload private keys remain in the mobile Keychain/Keystore-backed vault.

The app calls Gmail, Drive, and eventually Calendar directly, evaluates local policy, minimizes data, filters PII, and presents the proposed disclosure for Allow, Deny, Edit, or Always approval. Only the authorized result is encrypted for the paired agent and returned through the relay.

## MVP

Production delivery starts on Day 1 with a Cloudflare health-only relay and signed mobile shells distributed through Codemagic. GitHub Actions orchestrates checks, relay deployment, and mobile delivery; Docker Compose provides the local relay/mock/demo-agent development environment. Private-data functionality is enabled only after its security pipeline is complete.

- Authenticated pairing of one device with a demo agent.
- Device-local Gmail OAuth and connector execution.
- Encrypted push requests and HTTPS callback results.
- Deterministic local authorization, bounded retrieval, minimization, and PII filtering.
- Human approval, safe edits, scoped revocable Always rules, and local audit.
- Agent-side REST adapter, followed by MCP using the identical authorization pipeline.

Drive follows Gmail through the common connector interface. Calendar and multi-device support are future work. Real Meta Muse integration depends on an available supported interface; use a demo agent first.

See [architecture](docs/architecture.md) and [security](docs/security.md).
