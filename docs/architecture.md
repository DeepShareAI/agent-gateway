# Mobile-authoritative relay architecture

```text
                  Third-party Agent
                      Meta Muse
                          |
                   HTTPS / ciphertext
                          v
               +----------------------+
               | Stateless Relay      |
               | Cloudflare Worker    |
               | NO Gmail token       |
               | NO plaintext data    |
               | NO decryption key    |
               +----------+-----------+
                          |
                 encrypted request
                      APNs / FCM
                          v
+------------------------------------------------+
| Agent Gateway Mobile App (Flutter / Native)     |
|                                                |
| OAuth Vault ------> Data Connectors             |
| Keychain/Keystore   Gmail / Drive / Calendar     |
|                           |                    |
|                           v                    |
|                    Policy Engine               |
|                    Data minimizer              |
|                    PII filtering               |
|                           |                    |
|                           v                    |
|                    Human Approval              |
|                    Allow / Deny / Edit / Always |
|                           |                    |
|                    encrypted result            |
+---------------------------+--------------------+
                            |
                            v
                     Stateless Relay
                            |
                            v
                         Meta Muse
```

The diagram groups capabilities. Execution checks policy before connector access, then checks disclosure after minimization and filtering. The mobile domain layer is authoritative; Flutter widgets only render and invoke it.

## Responsibilities

| Component | Owns | Excludes |
| --- | --- | --- |
| Agent / adapter | Agent keys, request encryption, callback receiver, result decryption | User OAuth tokens and device private keys |
| Worker | Transport authentication, envelope validation, signed routing verification, push sending, callback forwarding | Payload decryption, connectors, policy, approvals, persistent requests/results |
| Mobile | OAuth vault, paired identities, connectors, policy, minimization, PII filtering, approval, replay ledger, audit | Exporting source credentials |
| APNs / FCM | Best-effort delivery of encrypted envelopes | Plaintext private request content |

The Worker needs provider credentials and a routing-signature secret. These transport secrets cannot decrypt payloads. Push destinations, identifiers, callback origins, and timing remain observable routing metadata; encryption does not hide them.

## Stateless routing

The device generates payload keys locally and verifies the agent public keys through user-confirmed authenticated pairing. Each side pins the other's identity and keys.

A signed, expiring routing capability contains the push destination, paired key identifiers, and verified agent HTTPS callback origin. The agent retains it and submits it with requests. The Worker validates it without storing a device registry. Route metadata may be sealed with a separate transport key, which must never decrypt private payloads.

Token refresh requires replacing the capability and communicating it to the paired agent. Local unpairing revokes data access immediately on the device. Immediate global revocation of a still-valid transport capability needs server state and is outside this design; short capability lifetimes limit that window.

No database, durable queue, persistent mailbox, result polling endpoint, or reliance on Worker process memory is allowed. Durable request, result, policy, replay, and audit state lives on the endpoints.

## Planned transport contract

- `GET /health`: relay health only.
- `POST /v1/requests`: authenticated agent submits a routing capability and encrypted request envelope; the Worker forwards it through APNs/FCM. Provider acceptance means transport handoff, never execution or approval.
- `POST /v1/results`: authenticated device submits an encrypted result bound to the route/request; the Worker forwards it to the verified agent callback.

Outer envelopes contain version, opaque request ID, routing/key identifiers, expiry, cryptographic material, ciphertext, and transport authentication. Source, query, purpose, fields, and result status belong inside ciphertext. Bind direction, version, request ID, identities, and expiry cryptographically to prevent substitution and reflection. Choose a reviewed interoperable encryption/signature protocol in PR02; these documents do not implement algorithms.

Callbacks must use verified HTTPS origins with restricted redirects and SSRF defenses. Results are encrypted for the pinned paired agent key, never an arbitrary replacement supplied by a request. The agent callback acknowledges receipt and deduplicates results. A REST/MCP adapter provides encryption and callbacks if the third-party agent cannot implement them directly.

## Device execution

1. Authenticate paired sender, decrypt, validate scope/schema, and reject expiry/replay.
2. Evaluate deterministic policy before source access. Obtain pre-access consent for sensitive retrieval; deny unknown agents/sources/operations.
3. Fetch bounded data directly through the mobile connector using the vault.
4. Minimize fields, time range, and result count; filter PII locally.
5. Review candidate disclosure: Allow once, Deny, Edit, or Always. Edits cannot widen scope and must pass filtering again. Always creates a narrow, revocable local rule; high-risk requests still require confirmation.
6. Recheck expiry, pairing, policy, approval, and final payload; record minimal local audit; encrypt only authorized data for the agent.
7. Submit through the Worker. Denials/errors are encrypted and contain no source data.

Low-risk automatic release requires a valid local policy or Always rule. High-risk requests require opening the app, local authentication, review, and confirmation.

## Delivery and lifecycle

Requests must fit the smaller push-provider payload budget after encryption, encoding, and wrappers. Enforce a conservative shared limit; reject oversize requests. Cloud storage retrieval is not implicitly available.

Push can be delayed, duplicated, or dropped. Mobile background execution is not guaranteed. Use generic notification text, a protected local inbox after receipt, and foreground resume. Agent retries reuse the request ID; persistent device deduplication prevents repeated execution or conflicting disclosures. Expiry is checked before source access and release, with a default maximum request/approval lifetime of five minutes.

Large encrypted results use HTTPS callbacks. If forwarding fails, retain bounded encrypted results on-device and retry within expiry. The agent owns timeout/receipt state. No Worker connection remains open while waiting for human approval. Offline requests may expire; this design offers no guaranteed offline mailbox.

## Deployment

Production deployment begins on Day 1. GitHub Actions runs checks, deploys the tested Cloudflare Worker with Wrangler, and orchestrates Codemagic Android/iOS builds for the same commit. Codemagic manages native builds, signing, and distribution to configured tester channels, including TestFlight for iOS. GitHub Actions verifies completed build/distribution status rather than treating an accepted build trigger as success. The initial production relay exposes health only; source access remains disabled until the complete security pipeline is ready.

Docker Compose runs the local Worker development service, mock providers, and demo-agent callback receiver. Flutter runs on the host/device; Codemagic provides the native iOS build environment. Compose is local tooling and introduces no production relay persistence. No NestJS backend, PostgreSQL database, or web approval authority is required.

Separate staging/production settings and credentials; associate deployment versions and signed build artifacts with their source commit. Roll back relay versions with protocol compatibility checks; fix mobile releases through higher-version builds. Provider configuration, secure storage, OAuth redirects, and biometrics require physical-device validation. The MVP uses one authoritative mobile device per pairing; multi-device enrollment needs a separate design.
