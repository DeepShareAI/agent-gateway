# Agent Gateway Development Plan

**Architecture:** mobile-authoritative gateway and stateless encrypted relay
**Relay:** Cloudflare Worker / TypeScript / HTTPS
**Mobile:** Flutter with native iOS/Android integration
**Vault:** Keychain/Keystore-backed storage
**State:** protected local policies, inbox, replay ledger, and audit
**Push:** APNs / FCM
**Agent protocol:** encrypted REST, then agent-side MCP adapter
**Production relay:** Cloudflare Worker, deployed with Wrangler from GitHub Actions
**CI/CD orchestration:** GitHub Actions
**Mobile builds/signing/distribution:** Codemagic Android/iOS workflows
**Local development:** Docker Compose for relay, mock providers, and demo agent

This plan replaces the server-authoritative NestJS/PostgreSQL/web design. Production delivery starts on Day 1 with a health-only relay and signed mobile shells distributed to testers. Later milestones ship through the same pipeline as their acceptance checks pass. Day 1 implementation is in progress; production account setup and live delivery validation are required before it can be marked complete. Later milestones remain pending. See [architecture](docs/architecture.md), [security](docs/security.md), [production setup](docs/production-setup.md), and [rules](RULE.md).

## Proposed repository structure

```text
relay/src/transport/       HTTPS validation and forwarding
relay/src/push/            APNs / FCM adapters
relay/src/routing/         Expiring stateless capabilities
relay/test/
relay/wrangler.toml
mobile/lib/domain/         UI-independent authorization
mobile/lib/vault/
mobile/lib/pairing/
mobile/lib/crypto/
mobile/lib/connectors/     Gmail, Drive, eventually Calendar
mobile/lib/policies/
mobile/lib/privacy/        Minimization and PII filtering
mobile/lib/approvals/
mobile/lib/transport/
mobile/lib/audit/
mobile/lib/screens/
mobile/ios/
mobile/android/
mobile/test/
mobile/integration_test/
agent-adapter/src/         Encryption, callback receiver, REST/MCP
agent-adapter/test/
protocol/                 Versioned schemas and interop fixtures
.github/workflows/        Checks, Cloudflare deploy, Codemagic orchestration
codemagic.yaml            Android/iOS builds, signing, distribution
compose.yaml              Local relay, mock providers, demo agent
docs/
```

## Ordered milestones

Current Day 1 scope: Android signing, store distribution, and Android device acceptance are deferred at the user's request. Day 1 delivery now targets staging/production Cloudflare relays and the signed iOS TestFlight shell, including physical iOS installation and relay rollback evidence. Android debug-build checks remain in CI. References to Android/iOS delivery below describe the original plan; Android delivery resumes in a separately authorized follow-up.

Each milestone is a separate PR. Numbering describes order, not guaranteed delivery dates. Native background execution and push require physical-device validation.

| PR | Scope | Acceptance |
| --- | --- | --- |
| 01 | Production delivery foundation | Production Cloudflare health endpoint, GitHub Actions orchestration, Codemagic signed Android/iOS tester distribution, and Docker Compose local stack validated. |
| 02 | Protocol and crypto design | Versioned envelopes, size budgets, authenticated context, errors, reviewed interoperable crypto choice. |
| 03 | Mobile vault/local state | Secure storage, protected policies/inbox/audit, persistent replay ledger; secret logging/backup exclusions. |
| 04 | Authenticated pairing | User-verified pinned identities, expiring routing capability, replacement and local revocation. |
| 05 | End-to-end encryption | Cross-runtime request/result fixtures; wrong-key, tamper, replay, and expiry rejection. |
| 06 | Stateless Worker transport | Authenticated bounded forwarding, route validation, restricted callback origins, redacted telemetry; no database. |
| 07 | APNs / FCM | Native registration, token refresh, encrypted request delivery, generic alerts, enforced provider size budget. |
| 08 | Device request lifecycle | Local inbox, deduplication, expiry, foreground resume, same-ID retries; no unauthorized push-triggered access. |
| 09 | Gmail OAuth | External browser, PKCE/state/redirect validation, least scopes, local refresh/revocation; relay sees no token. |
| 10 | Mobile connectors | Bounded search/get/list abstraction and Gmail implementation; local policy authorization required. |
| 11 | Policy engine | ALLOW / DENY / REQUIRE_APPROVAL, default deny, locally computed risk, negative scope tests. |
| 12 | Minimization | Field allowlists, time and result limits, attachment exclusion; raw source objects cannot become responses. |
| 13 | PII filtering | Deterministic detection/redaction with nested-field fixtures and documented coverage limits. |
| 14 | Approval domain | Allow/Deny/Edit/Always, expiry, safe edits, bounded revocable rules; access and disclosure consent enforced. |
| 15 | Approval UI | Verified agent, purpose, risk, scope, expiry, filtered preview, and safe review actions. |
| 16 | Biometrics/deep links | Local high-risk confirmation; links identify local requests without revealing data or granting access. |
| 17 | Encrypted results | Bound signed/encrypted result forwarded to verified callback; local retries and agent deduplication. |
| 18 | Audit and controls | Local activity, retention, pending requests, policy revocation, unpairing, and source disconnect. |
| 19 | Demo agent | Encrypted Gmail round trip, approval/edit/deny/timeout paths validated. |
| 20 | Agent-side MCP | Tools use identical encrypted mobile pipeline; no source credentials or authorization bypass. |
| 21 | Drive connector | Common local vault, policy, privacy, and approval pipeline; no source-specific bypass. |
| 22 | Lifecycle reliability | Physical iOS/Android checks: locked/killed app, disabled notifications, duplicates, token refresh, manual resume. |
| 23 | Meta Muse integration | Verify supported interface; implement compatible adapter if available, otherwise document demo-only limitation. |
| 24 | Security hardening | Cross-agent access, replay, stale approvals, revoked pairing, callback abuse, Edit/Always escalation, leakage rejected. |
| 25 | MVP promotion | Existing Day 1 pipeline promotes validated MVP builds; release notes, rollback, physical-device E2E, and security checks complete. |

## End-to-end acceptance flow

1. Install app and generate device keys locally.
2. Connect Gmail and store credentials in the mobile vault.
3. Pair and verify the demo agent.
4. Agent encrypts a bounded request and submits it through HTTPS.
5. Worker validates transport and routes ciphertext through APNs/FCM.
6. App authenticates/decrypts, rejects replay/expiry, and checks policy.
7. App obtains pre-access consent if required and calls Gmail directly.
8. App minimizes and filters the candidate disclosure.
9. User selects Allow, Deny, Edit, or Always unless a valid low-risk local rule permits release.
10. App rechecks authorization/expiry, audits locally, and encrypts the approved result.
11. Worker forwards ciphertext to the verified agent callback; agent verifies/decrypts and acknowledges it.

## Invariants and definition of done

Credentials and device private keys stay on-device. Relay stores no private payloads or persistent requests/results. Policy precedes source access; minimization/filtering precede release. High risk requires explicit local confirmation. Request/approval expiry, authenticated message context, and persistent replay checks are mandatory. Push is transport, never authorization. Audit and Always rules are local.

Implementation PRs require appropriate unit/integration/security tests, lint/type checks/builds, current protocol/security docs, and diff review for secrets and privacy regressions. Native secure storage, OAuth, push, and biometrics require physical-device checks. Crypto requires cross-runtime fixtures and negative tests. Report actual verification and limitations. Documentation-only changes require consistency and link checks; do not claim runtime validation before code exists.

## Post-MVP

Calendar and additional sources, more agents, and local privacy processing may follow. Multi-device support needs a separate enrollment/key revocation/single-authority design. Opt-in encrypted backup or durable cloud mailboxes require explicit architecture review; neither is part of the stateless MVP.

## Detailed day-to-day plan

Each day below produces one reviewable PR. Begin by inspecting the previous milestone and finish with its documented checks. Dependencies are cumulative unless noted. Use mocks until the corresponding real integration exists; never connect an unfinished security pipeline to live private data. If acceptance fails, finish that milestone before advancing.

### Day 1 / PR01 — Production deployment and development foundation

**Build:** Initialize the TypeScript Worker, Wrangler configuration, Flutter project, and agent-adapter package. Add `/health`, environment-specific configuration, a mobile home screen, and dependency injection boundaries for domain services. Establish formatting, lint, type checking, and secret-free configuration examples.

Set up the delivery infrastructure during this milestone:

- **Cloudflare:** Create isolated staging/production Worker configurations and deploy the health-only production relay to a stable HTTPS endpoint. Use scoped deployment credentials, record deployment versions, and define rollback to the preceding version. Keep request/source functionality disabled until its security pipeline is complete.
- **GitHub Actions:** On pull requests run applicable formatting, lint, type checks, tests, Worker build, and Compose smoke checks. On an accepted release revision, deploy the tested Worker and trigger Codemagic for that exact commit. Track both platform build outcomes through authenticated callbacks or bounded polling, verify the returned revision/build IDs, and publish an aggregate delivery status. Serialize production deployments and prevent untrusted PR code from receiving deployment/signing secrets.
- **Codemagic:** Configure Android and iOS workflows in `codemagic.yaml`, with dependency/toolchain versions, tests, build numbers, signing, and environment-specific app configuration. Store Android keystore credentials and Apple signing/App Store Connect credentials in managed secret groups. Distribute signed Android builds through a configured internal testing channel and iOS builds through TestFlight. Establish the channels and tester access on Day 1; public store rollout is separate from initial tester distribution.
- **Docker Compose:** Define local Worker development, mock push/source providers, and the demo-agent callback receiver with health checks, documented ports, and environment examples. Use mock secrets/data only. Flutter runs on the host/device; native iOS builds/signing run on Codemagic macOS infrastructure. Compose is not the production runtime or a mobile emulator.

**Verify:** Run `docker compose up --build` and check the relay/mock/agent health endpoints. Run TypeScript checks and Flutter analysis/tests. Verify staging and production HTTPS health endpoints, then trigger the complete GitHub Actions-to-Codemagic flow for a known commit. Confirm signed Android/iOS artifacts correspond to that revision, distribution completes, and testers can install/launch both shells. Exercise failed-build status propagation and document/verify relay rollback. Keep live source access disabled.

**Deliver:** Production relay URL, CI workflow files, Codemagic configuration, Compose stack, signed distributed shells, build/deployment identifiers, and setup/rollback instructions. Cloudflare account access, GitHub secrets, Codemagic integration, Apple developer/signing/TestFlight access, Android signing/testing-channel access, and physical testers are Day 1 prerequisites. Missing access or signing/distribution credentials blocks Day 1 acceptance; do not postpone these requirements to Day 25 or claim deployment based on configuration files alone.

### Delivery requirements for Days 2–24

Every milestone extends the existing delivery pipeline. Pull requests run the checks relevant to the changed components; trusted release revisions deploy the tested Worker and produce/distribute affected signed mobile builds through Codemagic. Use the same immutable commit revision across services and include it in diagnostics without exposing secrets. Protocol changes require compatible staged rollout between independently updated agent, relay, and installed apps; keep incomplete private-data features disabled.

Add mocked checks to Compose as integrations appear, then validate live providers separately on physical devices. Keep staging/production provider credentials, OAuth redirects, callback origins, app identifiers, and push environments separate. Record deployment/build IDs and delivery evidence in each PR. Codemagic failures must fail the orchestration status; a successful trigger alone is not a successful mobile release. Mobile recovery uses a corrected build with a higher version/build number; relay rollback must preserve compatibility with installed clients.

### Day 2 / PR02 — Protocol and cryptographic design

**Build:** Define versioned request, result, routing-capability, and error schemas. Specify required encrypted fields, outer metadata, authenticated context, encoding, expiry, maximum sizes, and callback acknowledgments. Document a reviewed library/protocol choice that works across TypeScript and Flutter/native runtimes. Define key separation, nonce handling, signatures, key identifiers, and rotation behavior.

**Verify:** Validate good/bad schema fixtures, unknown versions/fields, expiry boundaries, and calculated push encoding overhead. Confirm both runtimes support the selected cryptographic primitives before implementation.

**Deliver:** `protocol/` schemas/fixtures, `docs/api.md`, and a cryptographic design decision. This is a design gate: do not implement custom cryptography or leave interoperability unresolved.

### Day 3 / PR03 — Mobile vault and local persistence

**Build:** Introduce vault and local-store interfaces independent from UI. Store source credentials and device secrets using platform secure storage; protect pending requests, replay records, policies, and audit. Define schemas/migrations, retention, backup exclusions, locked-device behavior, and deletion semantics.

**Verify:** Test persistence across restart, migration failure, missing/unavailable vault keys, logout/disconnect cleanup, and secret redaction. Inspect platform configuration and validate secure-storage behavior on physical devices when available.

**Deliver:** Vault/local-store services, migration tests, storage security documentation. Store no production source tokens yet.

### Day 4 / PR04 — Pairing and routing capabilities

**Build:** Generate device and agent identities through the chosen libraries. Implement a user-confirmed fingerprint/QR pairing flow that pins authenticated public keys. Define minimal pairing/capability-issuance endpoints, prove device key ownership, and require verified callback configuration. Issue expiring signed route capabilities without a device registry. Add local unpairing, pairing epochs, and capability replacement hooks; use mock push destinations until Day 7.

**Verify:** Reject mismatched fingerprints, substituted keys, unverified callbacks, invalid capability signatures, wrong identities, and expired routes. Confirm unpairing denies local source access even while a transport capability remains valid.

**Deliver:** Pairing services/screens, route issuance contract in API docs, and revocation limitations in security docs.

### Day 5 / PR05 — End-to-end encryption

**Build:** Implement request encryption/decryption and result encryption/decryption using reviewed libraries. Bind direction, version, request ID, sender/recipient, and expiry. Pin result recipients to paired keys. Add shared deterministic interoperability fixtures with test keys only.

**Verify:** Cross-runtime round trips; reject modified ciphertext/context, wrong recipients, invalid signatures, reflected messages, malformed encodings, and expired messages. Verify randomness/nonce handling according to the chosen protocol.

**Deliver:** Agent/device crypto services, fixtures, and protocol documentation. Replay identity persistence integrates fully on Day 8; crypto success alone is not permission to execute a request.

### Day 6 / PR06 — Stateless HTTPS relay

**Build:** Implement request/result envelope validation, transport authentication, route verification, and forwarding interfaces with mock providers. Restrict callback origins and redirect handling; bound request sizes and outbound timeouts. Document transport statuses distinctly from authorization results. Exclude payloads, tokens, and capabilities from logs.

**Verify:** API tests cover invalid authentication, expired routes, malformed/oversize envelopes, callback SSRF attempts, forwarding failure, and sanitized logs. Restart Worker instances between calls to demonstrate no reliance on process state.

**Deliver:** Worker transport and deployment-secret inventory. Source connectors and payload decryption remain absent from the Worker.

### Day 7 / PR07 — APNs and FCM delivery

**Build:** Add isolated APNs/FCM adapters, native permissions/token registration, refresh handling, and replacement routing capabilities. Encode encrypted envelopes with generic alert text. Enforce an actual byte budget including all wrappers. Configure separate development/production provider credentials.

**Verify:** Send test ciphertext to physical iOS/Android devices; inspect notification/lock-screen content. Test invalid tokens, provider rejection, token refresh, payload limits, and notification permission denial. Never equate provider acceptance with app receipt.

**Deliver:** Provider adapters, native configuration instructions, and sanitized device-test evidence. Any unavailable platform validation remains explicitly incomplete.

### Day 8 / PR08 — Device request lifecycle

**Build:** Route received envelopes into a protected local inbox. Add authenticated validation, replay reservation, request states, and persistent deduplication. Define interrupted-execution recovery, monotonic state transitions, expiration, bounded agent retries, and manual foreground resume. Wire source execution to a deny-all placeholder until policy is implemented.

**Verify:** Duplicate push, restart during processing, expired/late arrival, concurrent same-ID requests, changed content under the same ID, and unavailable vault. Ensure no connector executes and no conflicting result is emitted.

**Deliver:** State-machine documentation, local lifecycle service, and restart/concurrency tests.

### Day 9 / PR09 — Device-local Gmail OAuth

**Build:** Implement external-browser OAuth with PKCE, state, validated native redirects, and minimum Gmail scopes. Store/refresh tokens through the vault. Add source connection status, reconnect, disconnect, and revocation. Keep interactive OAuth data off the relay.

**Verify:** Wrong/missing state, interrupted flow, redirect mismatch, refresh failure, revoked grants, concurrent refresh, and disconnect cleanup. Inspect logs/network paths for token leakage.

**Deliver:** Gmail connection flow and provider setup documentation using test accounts. No agent-triggered Gmail access is enabled yet.

### Day 10 / PR10 — Mobile connector interface

**Build:** Define bounded `search`, `get`, and `list` interfaces plus typed, internal source records. Implement Gmail pagination, cancellation, timeouts, maximum results, and safe error mapping. Require an explicit authorization context; default-deny remains active until Day 11. Keep source credentials inside connector/vault boundaries.

**Verify:** Mock provider pagination, quota errors, invalid resources, timeout/cancellation, missing authorization, and result bounds. Exercise Gmail only through an explicit developer test harness with a test account.

**Deliver:** Connector abstraction, Gmail implementation, fixtures, and operation/field catalog.

### Day 11 / PR11 — Deterministic policy engine

**Build:** Evaluate paired agent, source, operation, resource/query, purpose, fields, time range, result limit, and expiry. Compute risk locally and return ALLOW, DENY, or REQUIRE_APPROVAL with reasons. Gate connector access and distinguish source-access consent from later disclosure approval. Keep outbound disclosure disabled until privacy/approval steps are ready.

**Verify:** Add at least 20 meaningful policy cases covering unknown scope, cross-agent access, wildcard/broad queries, sensitive fields, missing purpose, excess limits, and contradictory rules. Agent-supplied risk cannot lower local risk.

**Deliver:** Pure domain policy service, decision table, connector gating, and security documentation.

### Day 12 / PR12 — Data minimization

**Build:** Create source-specific output schemas and common field allowlisting. Enforce authorized fields, time window, result count, safe metadata defaults, and attachment exclusion. Construct response candidates from allowed values instead of serializing raw provider records.

**Verify:** Nested/unexpected fields, excessive pagination, out-of-range records, raw headers/bodies/attachments, empty results, and unauthorized requested fields. Confirm candidate output never contains OAuth credentials.

**Deliver:** Minimization service, approved response schemas, and source-to-output fixtures.

### Day 13 / PR13 — PII detection and filtering

**Build:** Add deterministic detectors and redactors for supported email/phone, payment, government, financial, and medical identifier patterns. Preserve schema validity while redacting nested fields. Define source/field-sensitive handling and safe defaults for unsupported representations; do not silently claim full coverage.

**Verify:** Representative supported patterns, formatting variants, false positives, nested arrays, Unicode input, and large-input runtime bounds. Confirm filtering occurs on every outbound candidate.

**Deliver:** Privacy service, fixtures, documented detector limitations, and coverage examples. No cloud LLM receives candidates.

### Day 14 / PR14 — Approval domain

**Build:** Implement pending access/disclosure approvals, approved/denied/expired states, Allow once, Deny, Edit, and Always. Bind decisions to request, candidate version/digest, paired agent, and authorized scope. Persist narrowly scoped revocable Always rules. Revalidate edited candidates and filter again; require local high-risk confirmation.

**Verify:** Approval after expiry/revocation, changed candidate after approval, duplicate actions, stale UI decisions, edited field escalation, broader Always matches, and release without required consent. Default request/approval maximum lifetime is five minutes.

**Deliver:** UI-independent approval service and an enforceable complete domain pipeline; keep live release gated until result transport exists.

### Day 15 / PR15 — Mobile approval experience

**Build:** Add inbox, request detail, pre-access consent, candidate preview, safe edit controls, and Always-rule confirmation. Display verified agent, purpose, scope, risk, expiry, and redaction information. Distinguish fetch consent from actual disclosure approval. Prevent repeated actions while domain transitions are pending.

**Verify:** Widget/integration tests for Allow/Deny/Edit/Always, expiry while screen is open, state restoration, unavailable source, redacted preview, and accessible navigation. UI manipulation cannot bypass domain checks.

**Deliver:** Usable review screens backed by the existing domain services, with no private lock-screen previews.

### Day 16 / PR16 — Biometrics and deep links

**Build:** Add native local authentication for high-risk consent/disclosure, scoped to the current action. Configure approval deep links/universal links to opaque request IDs. Handle unknown, completed, revoked, or expired requests safely; links never carry approval tokens or plaintext details.

**Verify:** Authentication cancellation/failure, unavailable biometrics, device-lock transitions, forged links, wrong request IDs, and expired approvals. Define a secure fallback or fail closed when required authentication is unavailable.

**Deliver:** Native authentication integration, link configuration, and physical-device checks on both platforms.

### Day 17 / PR17 — Encrypted result return

**Build:** Connect final domain authorization to encrypted result creation and `/v1/results`. Sign/bind replies to paired identity and original request. Forward through verified HTTPS callbacks and authenticate receipt. Persist bounded encrypted pending results locally; implement retries within expiry and agent-side receipt deduplication.

**Verify:** Wrong callback recipient, changed route/key, offline device, callback timeout/failure, duplicate results, expiry during retry, and denial/error replies. Verify no raw candidate crosses the network boundary.

**Deliver:** First complete transport loop with mock connectors; enable live release only through the full policy/privacy/approval pipeline.

### Day 18 / PR18 — Local audit and user controls

**Build:** Record request creation, policy/access decisions, connector execution, filtering, approval, denial, expiry, and result handoff using minimal metadata. Add activity/retention settings, source disconnect, agent unpairing, pending-request cancellation, and Always-rule inspection/revocation.

**Verify:** Revocation during an active request, cancellation races, audit after restart, retention cleanup, and absence of credentials/full content in records. Transport handoff must be distinguishable from agent receipt.

**Deliver:** Activity and control screens plus audit schema and retention policy. No cloud audit database.

### Day 19 / PR19 — Demo agent and end-to-end scenarios

**Build:** Create an agent CLI/service with its own keys, authenticated pairing, request encryption, verified callback receiver, and result display. Provide scripts for metadata search, sensitive retrieval, denial, edit, Always, and timeout. Use synthetic fixtures and an explicitly configured Gmail test account.

**Verify:** Run full request-to-push-to-app-to-callback flows on both platforms where available. Show that an edited/filtered disclosure differs from the source and that credentials never reach the agent.

**Deliver:** Repeatable demo commands, scenario evidence, and E2E automation for mock providers; document manual physical-device steps.

### Day 20 / PR20 — Agent-side MCP adapter

**Build:** Expose bounded Gmail tools through the agent adapter. Translate arguments into encrypted requests and map callback results/timeouts to tool responses. Decide and document async job semantics where human review exceeds a tool-call timeout. Keep request tracking on the agent side.

**Verify:** MCP cannot bypass mobile policy, request raw credentials, widen scope, or treat transport acceptance as a result. Test cancellation, timeout, duplicate callbacks, denial, and malformed tool arguments.

**Deliver:** Adapter tools and usage docs. Worker remains a ciphertext transport, not a plaintext MCP data processor.

### Day 21 / PR21 — Drive connector

**Build:** Add local Drive OAuth scopes and bounded search/get support through the common connector interface. Define metadata/content output schemas, export and download limits, and unsupported-format behavior. Apply shared policy, minimization, filtering, and approval without duplicating authorization.

**Verify:** Cross-source scope mismatch, excessive downloads, shared-resource access, unsupported/binary content, revoked credentials, and sensitive content disclosure. No implicit attachment/binary processing bypass.

**Deliver:** Drive connection/connector, common pipeline tests, and documented supported formats. Calendar remains out of scope.

### Day 22 / PR22 — Physical-device reliability

**Build:** Refine resume/retry/error UX after testing background/foreground behavior. Address push-token changes, app restart, vault locking, provider delays, denied notifications, and connectivity loss. Provide manual resume guidance without promising guaranteed background execution.

**Verify:** Execute an iOS/Android matrix for locked app, killed app, battery restrictions, airplane mode, duplicate/delayed push, token replacement, callback outages, and expiry. Distinguish platform limitations from defects.

**Deliver:** Device/OS test matrix, fixes, and accurate delivery limitations. Never add a persistent relay queue as an undocumented workaround.

### Day 23 / PR23 — Meta Muse integration gate

**Build:** Investigate the actual supported Meta Muse interface using official/current documentation during implementation. Determine whether tools, encryption, callbacks, and asynchronous completion are supported directly or need an agent-side bridge. Implement only the available authenticated integration; preserve the demo adapter as the baseline.

**Verify:** Exercise supported requests through the identical mobile pipeline. Ensure any bridge has only agent-side credentials and approved disclosures, never user source tokens or mobile private keys.

**Deliver:** Compatibility decision and real adapter when feasible. If the interface is unavailable, record the external blocker and demo-only support; do not claim production Meta Muse integration.

### Day 24 / PR24 — Security review and hardening

**Build:** Review trust boundaries and all data paths against docs/security.md. Inspect pairing, crypto, OAuth, local storage, policy, edits/Always, callback validation, logs, and deployment secrets. Fix discovered vulnerabilities and record residual risks. Review abuse/rate controls without silently introducing relay state.

**Verify:** Run cross-agent/device, revoked-key, tampering/reflection, replay-after-restart, stale approval, candidate-change, Edit/Always escalation, OAuth redirect, SSRF, oversized-input, and leakage suites. Review platform/provider configurations and dependency issues.

**Deliver:** Security checklist with evidence, fixes, updated threat assumptions, and remaining release blockers. Do not label the system audited without an actual audit.

### Day 25 / PR25 — Release candidate and reproducible demo

**Build:** Promote the MVP through the Cloudflare/GitHub Actions/Codemagic delivery pipeline established on Day 1. Review accumulated provider/OAuth configuration, environment separation, signing/distribution, rollback compatibility, and troubleshooting. Finalize README, architecture/API/security docs, release notes, and supported-device/source/agent matrix. Package a synthetic-data demo and an optional live test-account demo.

**Verify:** Run applicable tests, type checks, lint, Compose smoke tests, Worker build, Flutter analysis, and Codemagic signed native builds. Execute the complete E2E acceptance flow and denial/offline/expiry scenarios against the deployed relay and distributed apps. Verify orchestration outcomes and artifact revision/signing information. Confirm repository/artifacts contain no secrets and document every uncompleted platform check.

**Deliver:** Deployed production MVP relay, signed Android/iOS builds distributed through configured channels, validation report, release notes, and installation/deployment/rollback instructions. Public store availability is reported only if that rollout was requested and completed. Day 25 hardens and promotes an existing delivery system; it is not the first production deployment.
