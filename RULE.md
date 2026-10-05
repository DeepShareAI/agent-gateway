# Development Rules

These rules govern the mobile-authoritative relay architecture.

1. Read README.md, SPEC.md, PLAN.md, relevant docs, and existing code/tests before changes. Implement one requested milestone at a time and stop after completing it.
2. The mobile domain layer owns authorization independently from Flutter widgets. The Worker cannot grant source access or approve disclosure.
3. The relay is stateless: no persistent request/result storage, database, mailbox, connectors, OAuth vault, policy state, or approvals. Never depend on process memory surviving requests.
4. Source credentials and device payload private keys stay in Keychain/Keystore-backed storage. Neither the relay nor the agent receives them.
5. Every request follows: authenticate/decrypt, validate expiry/replay/scope, evaluate policy, authorize source access, bounded connector fetch, minimize, filter PII, disclosure approval where required, revalidate, audit locally, encrypt and return.
6. Default deny unknown or ambiguous agents, scopes, sources, operations, and fields. Compute risk locally. Final authorization is deterministic.
7. Requests specify ID, source, operation, resource/query, purpose, fields, time range, maximum results, and expiry. Validate all external input and bound resource use.
8. Policy precedes connector execution. Sensitive retrieval requires pre-access consent. Final approval reviews the minimized and filtered candidate before data leaves the device.
9. Allow releases once; Deny releases no data; Edit cannot widen authorized scope and must rerun filtering; Always saves an explicit, bounded, revocable local rule. Always never bypasses expiry, PII controls, or high-risk confirmation.
10. Temporary requests/approvals have a default maximum five-minute lifetime. Recheck before source access and release. Persist replay identities locally and handle duplicate requests/results idempotently.
11. High-risk requests require opening the app, local authentication/biometrics, review, and confirmation. Push actions alone cannot authorize them.
12. Push contains only encrypted envelopes and minimal routing identifiers. Titles/bodies are generic; private queries, previews, source details, and purposes never appear on the lock screen.
13. Audit locally with minimal metadata and retention controls. Never log source tokens, private keys, plaintext payloads, push tokens, route capabilities, email content, or unnecessary PII.
14. Authenticate transport and message origin separately. Enforce envelope/push size budgets and route expiry. Use verified HTTPS callback origins and prevent callback SSRF and unsafe redirects.
15. Use reviewed cryptographic libraries with a documented interoperable protocol. Test authenticated pairing, pinned keys, context binding, tamper/replay rejection, rotation, and revocation; never invent cryptography.
16. Use external-browser native OAuth with PKCE, state, validated redirects, and least privilege scopes. No embedded confidential client secret. Refresh and revoke source tokens locally.
17. Keep provider secrets and routing keys in Worker secret management; mobile secrets in platform storage. Commit no credentials. Routing keys cannot decrypt private payloads.
18. Push is best effort; provider acceptance is not execution or approval. Offline/expired requests fail closed. Retries reuse request IDs; no server mailbox is added implicitly.
19. MCP translates to the identical encrypted mobile authorization pipeline. No relay tool may decrypt private data or call Gmail.
20. Keep domain logic separate from UI and source-specific adapters. Maintain versioned protocol/API documentation.
21. Implemented features require appropriate unit, integration, and negative security tests; run relevant lint, type checks, and builds. Documentation-only changes require consistency/link checks, not runtime tests.
22. Update docs/security.md for changes to authentication, OAuth, encryption, authorization, approval, PII, or audit. Review diffs for secrets and report actual verification and limitations.
23. Establish production delivery on Day 1: Cloudflare relay deployed by GitHub Actions, which orchestrates Codemagic Android/iOS builds, signing, and distribution for the tested commit. Use Docker Compose for the local relay/mock/demo-agent stack and host/device tooling for Flutter. Keep CI/signing secrets away from untrusted PRs; verify completed builds/distribution rather than just trigger acceptance. PostgreSQL and a web approval authority are not required. Avoid persistent cloud queues, multi-device authority, custom crypto, or cloud private-data processing without an explicit architecture revision.
24. Preserve compatible existing functionality. Report completed changes, checks, limitations, and the next milestone; do not implement the next milestone automatically.
