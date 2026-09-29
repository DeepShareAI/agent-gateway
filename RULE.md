# Development Rules

These rules are mandatory for all Codex development.

## Rule 1 — One PR at a time

Implement **exactly one PR/day milestone at a time**.

Do not start the next PR until the current PR is complete.

---

## Rule 2 — Inspect before modifying

Before making changes:

1. Inspect repository structure.
2. Read `README.md`.
3. Read `PLAN.md`.
4. Identify the latest completed PR.
5. Inspect relevant existing modules.
6. Check existing tests.

Never assume the repository is empty or matches the expected architecture.

---

## Rule 3 — Preserve existing functionality

Every PR must preserve all previously working functionality.

Do not rewrite existing modules unless required.

Prefer:

```text
small incremental change
```

over:

```text
large architectural rewrite
```

---

## Rule 4 — Security pipeline is immutable

Every agent data request must go through:

```text
Agent Authentication
        ↓
Request Validation
        ↓
Policy Evaluation
        ↓
Human Approval (if required)
        ↓
Data Source Access
        ↓
Data Minimization
        ↓
Sensitive Data Detection / Redaction
        ↓
Audit Logging
        ↓
Response to Agent
```

No module may bypass this pipeline.

---

## Rule 5 — Agents never receive source credentials

AI agents must NEVER receive:

* Gmail OAuth access tokens
* Google refresh tokens
* Drive credentials
* Calendar credentials
* Facebook credentials
* LinkedIn credentials
* Twitter/X credentials
* raw API keys belonging to the user

The Gateway owns and manages data-source credentials.

---

## Rule 6 — Default deny

Unknown or ambiguous requests must not automatically receive private data.

Policy behavior:

```text
Clearly permitted     → ALLOW
Clearly forbidden     → DENY
Potentially sensitive → REQUIRE_APPROVAL
Unknown               → DENY
```

---

## Rule 7 — Least privilege

Every access request should specify:

```text
agent
user
data source
resource
operation
purpose
requested fields
time range
maximum result count
risk level
expiration
```

Example:

```json
{
  "source": "gmail",
  "operation": "search",
  "query": "from:alice@example.com",
  "fields": ["subject", "date", "sender"],
  "limit": 10,
  "purpose": "find_recent_email",
  "expiresIn": 300
}
```

---

## Rule 8 — Minimize before returning

Never return raw source data when a smaller representation is sufficient.

Example:

Agent asks:

```text
"Find my latest email from Alice."
```

Gateway should prefer:

```json
{
  "sender": "Alice",
  "subject": "Meeting tomorrow",
  "date": "2026-09-26"
}
```

instead of returning the entire mailbox or entire email database.

---

## Rule 9 — Push notifications contain no sensitive data

Do not put private information into:

* APNs payload
* FCM payload
* notification title
* notification body
* lock-screen content

Good:

```text
Agent Gateway
"An AI agent is requesting access to Gmail."
```

Bad:

```text
"Muse wants to read your email from Alice about your medical appointment."
```

---

## Rule 10 — High-risk approval requires app confirmation

Low-risk:

```text
Push
 ↓
Allow / Deny
```

High-risk:

```text
Push
 ↓
Open App
 ↓
Authenticate / Biometrics
 ↓
Review details
 ↓
Confirm
```

The push notification itself must never be sufficient for high-risk authorization.

---

## Rule 11 — Approval must expire

Every temporary approval has a TTL.

Default MVP TTL:

```text
5 minutes
```

Expired requests cannot be approved.

---

## Rule 12 — Authorization belongs to backend

Never rely on:

* Flutter UI logic
* React UI logic
* hidden frontend fields
* client-side permissions

for security decisions.

The backend is the authoritative authorization layer.

---

## Rule 13 — Audit everything important

Record:

```text
who
what agent
what source
what operation
what resource
when
policy decision
approval decision
result
request ID
device
```

Never log:

* OAuth access tokens
* refresh tokens
* passwords
* full private email content
* unnecessary PII

---

## Rule 14 — Secrets only through environment/secret management

Never commit:

```text
API keys
OAuth secrets
JWT secrets
database passwords
APNs private keys
FCM credentials
```

to Git.

Use:

```text
.env
.env.example
```

`.env` must be gitignored and is for local development. Production uses environment-scoped GitHub Actions, cloud runtime, and Codemagic secret management. Keep production Neon credentials, deploy credentials, and mobile signing material out of local development and CI test jobs. Never place runtime secrets in web or mobile bundles.

---

## Rule 15 — Validate all external input

All API/MCP requests must be validated.

Use Zod schemas for runtime validation at TypeScript REST and MCP input boundaries before policy evaluation. Derive TypeScript input types from these schemas to keep runtime validation and static types aligned.

Use Zod for React form validation as well, while keeping backend validation authoritative. Flutter clients must follow the documented API contracts and all their requests must undergo backend validation.

Schema validation does not replace authentication, authorization, or server-side expiration checks.

Reject:

* malformed requests
* unknown fields where appropriate
* invalid resource identifiers
* invalid authorization scopes
* expired tokens
* expired approval requests

---

## Rule 16 — Tests are mandatory

Every backend feature must include tests.

Minimum:

```text
Unit tests
Integration/API tests
Security/authorization tests
```

Critical modules require negative tests.

Example:

```text
authorized request → allowed
unauthorized request → denied
expired approval → denied
wrong agent → denied
wrong user → denied
missing permission → denied
```

---

## Rule 17 — No silent security changes

Any change affecting:

* authentication
* authorization
* policy
* OAuth
* credential storage
* PII handling
* approval
* audit
* MCP permissions

must update:

```text
docs/security.md
```

and relevant tests.

---

## Rule 18 — API-first

Backend APIs must be clearly defined.

Maintain:

```text
OpenAPI specification
```

Web and mobile should consume backend APIs rather than duplicating business logic.

---

## Rule 19 — Keep domain logic independent from UI

The following must live in backend/domain modules:

```text
Policy
Authorization
Risk calculation
Approval
Data minimization
PII detection
Audit
```

React and Flutter should only display and invoke these capabilities.

---

## Rule 20 — Every PR must be runnable

At the end of each PR:

```text
docker compose up
```

should start the required local infrastructure.

A developer should be able to run:

```text
Backend
Web
PostgreSQL
```

locally with minimal setup.

---

## Rule 20a — Cloud CI/CD starts on Day 1

GitHub Actions is the CI/CD orchestrator. Production must use Cloudflare for web hosting and edge routing, Cloud Run for the backend, Neon PostgreSQL for the database, and Codemagic for mobile platform builds, signing, and distribution. Docker Compose is the local development path.

Defer the hosted test environment for now. Require successful CI checks before gated production deployment. Track the source commit and artifacts across GitHub Actions and Codemagic. Keep production resources and credentials isolated from local/CI testing; untrusted pull requests must not receive deployment or signing secrets.

Day 1 is incomplete until cloud deployment, native mobile artifacts, smoke checks, and rollback acceptance have evidence. Follow [deployment requirements](docs/deployment.md); never describe a planned pipeline as deployed.

---

## Rule 21 — No premature complexity

Do NOT introduce in MVP:

* Kubernetes
* microservices
* Kafka
* complex event sourcing
* TEE
* distributed authorization
* multi-region deployment
* custom LLM
* complex ML PII classifier

unless a PR explicitly requires it.

Start with a secure modular monolith.

---

## Rule 22 — Prefer deterministic behavior

For the MVP:

```text
Policy engine = deterministic rules
```

Do not allow an LLM to make final authorization decisions.

An LLM may later assist with:

```text
risk explanation
request classification
PII detection
policy suggestions
```

but the final authorization decision remains deterministic.

---

## Rule 23 — Every PR updates documentation

Each PR must update documentation when behavior changes.

At minimum:

```text
README.md
API documentation
architecture documentation
```

when applicable.

---

## Rule 24 — Stop after the requested PR

Codex must not continue automatically to the next PR.

At the end:

```text
PR complete.
Tests passed.
Waiting for next PR.
```

---
