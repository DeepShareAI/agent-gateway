# Agent Gateway

## Development Plan

**Version:** MVP v0.1
**Backend:** Node.js + TypeScript + NestJS
**Validation:** Zod for runtime schemas in the TypeScript backend and web app
**Web:** React + TypeScript
**Mobile:** Flutter
**Database:** Neon PostgreSQL + Prisma
**Agent Protocol:** MCP + REST API
**Push:** APNs + FCM
**CI/CD:** GitHub Actions; Codemagic for mobile builds and releases
**Production from Day 1:** Cloudflare + Cloud Run + Neon PostgreSQL + Codemagic
**Local development:** Docker Compose
**Testing:** Jest + Supertest + Playwright + Flutter Test

---

## 1. Product Goal

Agent Gateway is a privacy and authorization gateway between AI agents and users' private data.

### Core principle

> **Agents get capability, not unrestricted access to personal data.**

Example:

```text
AI Agent
   │
   │ "Find emails from Alice"
   ▼
Agent Gateway
   │
   ├── Authentication
   ├── Policy Evaluation
   ├── Approval
   ├── Data Access
   ├── Data Minimization
   ├── Sensitive Data Detection
   └── Audit
   │
   ▼
Gmail
```

The AI agent must never receive the user's Gmail OAuth credentials.

---

## 2. Target Architecture

```text
                         ┌───────────────────────┐
                         │      AI Agents        │
                         │ Muse / Claude / etc.  │
                         └───────────┬───────────┘
                                     │
                              MCP / REST API
                                     │
                                     ▼
                     ┌──────────────────────────────┐
                     │       Agent Gateway           │
                     │                              │
                     │ NestJS + TypeScript           │
                     │                              │
                     │ Agent Identity                │
                     │ Policy Engine                 │
                     │ Approval Engine               │
                     │ Data Minimization             │
                     │ Sensitive Data Filter         │
                     │ Audit                         │
                     │ Notification                  │
                     │ MCP Server                    │
                     └──────────────┬───────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
                  Gmail          Google Drive    Calendar
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                            Private User Data
                                    
                         ┌───────────────────┐
                         │ Notification      │
                         │ APNs / FCM        │
                         └─────────┬─────────┘
                                   │
                         ┌─────────┴─────────┐
                         ▼                   ▼
                    iPhone/iPad          Android
                       Flutter             Flutter
```

---

## 3. Repository Structure

Use a simple monorepo structure:

```text
agent-gateway/
│
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── agents/
│   │   ├── devices/
│   │   ├── datasources/
│   │   │   ├── gmail/
│   │   │   └── drive/
│   │   ├── access-requests/
│   │   ├── policies/
│   │   ├── minimization/
│   │   ├── pii/
│   │   ├── approvals/
│   │   ├── notifications/
│   │   ├── audit/
│   │   ├── mcp/
│   │   ├── common/
│   │   └── app.module.ts
│   │
│   ├── prisma/
│   ├── test/
│   └── package.json
│
├── web/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   ├── auth/
│   │   └── hooks/
│   └── package.json
│
├── mobile/
│   ├── lib/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── models/
│   │   └── widgets/
│   ├── test/
│   └── integration_test/
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── security.md
│   └── threat-model.md
│
├── docker-compose.yml
├── README.md
└── PLAN.md
```

---

## 4. 25-Day Development Plan

## Phase 1 — Foundation

### Day 1 — PR01: Full-stack skeleton

Implementation and verification status: [Day 1 validation](docs/day-1-validation.md). Local container, native-device, and cloud production acceptance must be verified before declaring this milestone complete. The required cloud stack is Day 1 work, not a later release milestone. See [deployment and CI/CD](docs/deployment.md).

Build:

```text
NestJS backend
React web
Flutter mobile
Neon PostgreSQL for production
Cloudflare web hosting and edge routing
Cloud Run backend
GitHub Actions CI/CD orchestration
Codemagic Android/iOS builds, signing, and distribution
Docker Compose for local development
```

Backend:

```text
GET /health
```

Establish Zod as the runtime validation library and a reusable NestJS request-validation mechanism for subsequent REST endpoints. Derive TypeScript input types from schemas. Configure Zod for React form validation as forms are introduced.

Web:

```text
Gateway Dashboard
Backend status
```

Mobile:

```text
Basic Agent Gateway screen
```

Acceptance:

```text
docker compose up
backend starts
database starts
web starts
Flutter app starts
health check passes
GitHub Actions checks gate deployments
Cloudflare web and Cloud Run backend deployed in production
Production Neon database provisioned and connectivity verified
Codemagic production workflows build Android and iOS artifacts
Gated production signing and release configuration verified
Deployed smoke checks and rollback procedure verified
```

---

### Day 2 — PR02: Database & Domain Model

Create Prisma models:

```text
User
Agent
Device
DataSource
PermissionPolicy
AccessRequest
AuditEvent
```

Define relationships and indexes.

Add migrations. Validate them against disposable local/CI PostgreSQL before running them through the gated production deployment workflow; keep production credentials out of test jobs.

Acceptance:

```text
prisma migrate
database tests
model tests
```

---

### Day 3 — PR03: Agent Authentication

Implement:

```text
POST /agents
POST /agents/token
GET /agents/me
```

Use:

```text
client_id
client_secret
Bearer token
expiration
```

Never expose secrets after creation.

Acceptance:

* valid agent authenticates
* invalid agent rejected
* expired token rejected

---

### Day 4 — PR04: User Authentication

Implement user authentication/session.

Support:

```text
login
logout
session
current user
```

Web and mobile must be able to authenticate.

---

## Phase 2 — Private Data

### Day 5 — PR05: Gmail OAuth

Implement:

```text
/connect/gmail
/connect/gmail/callback
```

Store credentials securely.

OAuth flow must include:

```text
state
redirect validation
scope validation
token encryption
```

---

### Day 6 — PR06: DataSource Connector Architecture

Create:

```typescript
interface DataSourceConnector {
  search(...)
  get(...)
  list(...)
}
```

Implement:

```text
GmailConnector
```

The Gateway owns the connector.

Agents cannot invoke Gmail directly.

---

## Phase 3 — Authorization

### Day 7 — PR07: Agent Access Request API

Define Zod schemas for request bodies, query parameters, and path parameters. Validate inputs before policy evaluation, including allowed fields, resource identifiers, result limits, and TTL bounds. Add negative tests for malformed inputs and unexpected fields.

Implement:

```text
POST /access-requests
GET /access-requests/:id
GET /access-requests
```

Request includes:

```text
agent
source
operation
resource
purpose
fields
risk
TTL
```

---

### Day 8 — PR08: Policy Engine

Implement:

```text
ALLOW
DENY
REQUIRE_APPROVAL
```

Example rules:

```text
Gmail metadata search → ALLOW

Read full email → REQUIRE_APPROVAL

Search all emails → REQUIRE_APPROVAL

Access unrelated private source → DENY
```

Add at least 20 policy tests.

---

### Day 9 — PR09: Data Minimization

Implement field-level filtering.

Example:

Source:

```json
{
  "sender": "...",
  "subject": "...",
  "body": "...",
  "attachments": "...",
  "headers": "..."
}
```

Requested:

```text
sender
subject
date
```

Returned:

```json
{
  "sender": "...",
  "subject": "...",
  "date": "..."
}
```

---

### Day 10 — PR10: Sensitive Data Detection

Implement initial deterministic PII detector.

Detect examples:

```text
SSN
credit card
phone
email
address
financial account
medical identifiers
```

Implement:

```text
detect()
redact()
```

Do not introduce an LLM dependency yet.

---

### Day 11 — PR11: Human Approval Engine

States:

```text
PENDING
APPROVED
DENIED
EXPIRED
```

Actions:

```text
ALLOW_ONCE
ALLOW_ALWAYS
DENY
DENY_ALWAYS
```

Implement:

```text
5-minute TTL
```

Approval must be server-side.

---

## Phase 4 — User Experience

### Day 12 — PR12: Web Approval UI

React pages:

```text
Dashboard
Approvals
Agents
Data Sources
Activity
Settings
```

Approval page displays:

```text
Agent
Data source
Requested operation
Purpose
Requested fields
Risk
Expiration
```

---

### Day 13 — PR13: Notification Service

Create abstraction:

```text
NotificationService
```

Support:

```text
sendApprovalRequest()
sendApprovalResult()
```

Providers:

```text
APNs
FCM
```

Keep provider-specific code isolated.

---

### Day 14 — PR14: Flutter Mobile Foundation

Screens:

```text
Login
Home
Approvals
Approval Detail
Activity
Agents
Settings
```

Create:

```text
API client
authentication service
secure storage
routing
state management
```

---

### Day 15 — PR15: iOS + Android Push

Implement:

```text
APNs
FCM
device registration
push token lifecycle
```

Backend model:

```text
Device
```

Fields:

```text
id
userId
platform
pushToken
appVersion
lastSeen
pushEnabled
```

---

### Day 16 — PR16: Mobile Approval

Implement:

```text
Push notification
        ↓
Open approval
        ↓
Allow / Deny
        ↓
Backend
        ↓
Agent receives result
```

Low-risk requests may support quick approval.

High-risk requests require full app review.

---

### Day 17 — PR17: Biometric Authorization

Support:

```text
Face ID
Touch ID
Android Biometrics
```

Biometrics must remain device-local.

Do not send biometric information to the backend.

---

### Day 18 — PR18: Deep Links

Implement:

```text
agentgateway://approval/{requestId}
```

and production universal/app links.

Notification should open the exact approval request.

---

### Day 19 — PR19: Multi-device Synchronization

Implement real-time synchronization:

```text
iPhone
   ↕
Backend
   ↕
Android
   ↕
Web
```

Example:

```text
Approve on iPhone
        ↓
Backend
        ↓
Android/Web immediately shows APPROVED
```

Use:

```text
WebSocket
```

or NestJS WebSocket Gateway.

---

## Phase 5 — Security & Agent Integration

### Day 20 — PR20: Audit System

Create immutable-style audit records.

Example:

```text
REQUEST_CREATED
POLICY_ALLOWED
APPROVAL_REQUIRED
APPROVED
DENIED
DATA_ACCESSED
DATA_REDACTED
RESPONSE_RETURNED
```

Web:

```text
Activity
```

must show audit history.

---

### Day 21 — PR21: Google Drive Connector

Add:

```text
Google Drive
```

through the same connector abstraction.

Do not create Drive-specific authorization logic outside the common policy layer.

---

### Day 22 — PR22: MCP Server

Validate MCP tool inputs with Zod before passing requests into the Gateway pipeline. Reuse applicable backend schemas so REST and MCP enforce consistent input constraints, and test invalid tool inputs.

Implement Agent Gateway MCP server.

Example tools:

```text
gmail_search
gmail_get
drive_search
drive_get
```

Important:

```text
MCP
 ↓
Gateway authorization
 ↓
Policy
 ↓
Approval
 ↓
Connector
 ↓
Minimization
 ↓
Redaction
```

MCP must never bypass Gateway security.

---

### Day 23 — PR23: Demo Agent / Muse Adapter

Before depending on real third-party agent integration, build:

```text
Demo Agent
```

that behaves like Muse.

Example:

```text
Request:
"Find my latest email from Alice."

Gateway:
ALLOW

Request:
"Read the entire email."

Gateway:
REQUIRE_APPROVAL

Push:
"AI agent requests access to Gmail."

User:
Approve

Gateway:
Read → Minimize → Redact → Return
```

If the real Muse integration interface is available, add a Muse adapter without modifying the Gateway security pipeline.

---

## Phase 6 — MVP Hardening

### Day 24 — PR24: Security Hardening

Perform:

```text
authentication review
authorization review
OAuth review
credential storage review
API validation
rate limiting
CSRF/CORS review
logging review
PII leakage tests
MCP security review
```

Add negative tests.

Required tests include:

```text
Agent A cannot access User B
Agent cannot bypass policy
Agent cannot bypass approval
Expired approval fails
Invalid token fails
Unauthorized source fails
Sensitive fields are redacted
Credentials never appear in response
Credentials never appear in logs
```

---

### Day 25 — PR25: MVP Release & E2E Demo

Complete:

```text
Cloud production release verification using the Day 1 CI/CD pipeline
Codemagic mobile release verification
Docker Compose local development documentation
README
architecture documentation
security documentation
API documentation
E2E tests
demo script
```

Final E2E flow:

```text
1. Install Gateway App

2. Connect Gmail

3. Register Demo Agent

4. Agent requests Gmail search

5. Gateway evaluates policy

6. Low-risk request → automatically allowed

7. Agent requests full email

8. Gateway → REQUIRE_APPROVAL

9. iPhone/Android receives push

10. User opens request

11. Biometric verification

12. User approves

13. Gateway accesses Gmail

14. Gateway minimizes data

15. Gateway redacts sensitive information

16. Gateway returns result

17. Audit event recorded
```

---

## 5. MVP Security Invariants

These must always remain true.

```text
Invariant 1
Agent never gets Gmail credentials.

Invariant 2
Agent never directly accesses private data sources.

Invariant 3
Every data request passes policy evaluation.

Invariant 4
Every response passes minimization.

Invariant 5
Sensitive data is filtered before leaving Gateway.

Invariant 6
High-risk requests require explicit confirmation.

Invariant 7
Approvals expire.

Invariant 8
Push notifications contain no sensitive data.

Invariant 9
Authorization decisions are made by backend.

Invariant 10
Important actions are audited.
```

---

## 6. Testing Strategy

## Backend

Use:

```text
Jest
Supertest
```

Test:

```text
Unit
Integration
Authorization
Security
```

Critical modules should target high test coverage:

```text
auth
policy
approval
minimization
PII
MCP
```

Test Zod schemas and their REST/MCP integration with valid inputs, malformed inputs, unexpected fields, and boundary values. Verify invalid requests are rejected before policy evaluation or data-source access.

---

## Web

Use:

```text
Playwright
```

Test:

```text
login
connect Gmail
view approval
approve
deny
audit
```

---

## Mobile

Use:

```text
flutter test
integration_test
```

Test:

```text
login
push handling
deep link
approval
biometric flow
multi-device state
```

---

## 7. Definition of Done

A PR is complete only when ALL are true:

```text
[ ] Code implemented
[ ] Existing functionality preserved
[ ] Unit tests added
[ ] Integration tests added where applicable
[ ] Security tests added where applicable
[ ] Type checking passes
[ ] Lint passes
[ ] Build passes
[ ] Docker environment works
[ ] API documentation updated
[ ] README updated if necessary
[ ] Security documentation updated if necessary
[ ] No secrets committed
[ ] No unnecessary sensitive data logged
[ ] Git diff reviewed
```

---

## 8. Codex Operating Instructions

At the beginning of every coding session:

```text
1. Read PLAN.md.
2. Inspect the repository.
3. Determine the latest completed PR.
4. Select ONLY the next unfinished PR.
5. Read all relevant existing code.
6. Implement that PR.
7. Add/update tests.
8. Run tests.
9. Fix all failures.
10. Run build/typecheck/lint.
11. Update documentation.
12. Review security implications.
13. Stop.
```

At the end of each PR, report:

```text
PR:
Status:

Implemented:
- ...

Files changed:
- ...

APIs added/changed:
- ...

Database changes:
- ...

Tests:
- ...

Security considerations:
- ...

Known limitations:
- ...

Next PR:
- ...
```

**Do not implement the next PR automatically.**

---

## 9. Future Roadmap — Post MVP

After PR25, consider:

## More Data Sources

```text
Google Calendar
Slack
Dropbox
OneDrive
Contacts
Photos
Notion
LinkedIn
Facebook
Twitter/X
```

## More Agents

```text
Muse
Claude
ChatGPT
OpenClaw
Custom agents
Enterprise agents
```

## Advanced Privacy

```text
Local LLM PII detection
Local summarization
Purpose-based authorization
Data lineage
Fine-grained field permissions
Encrypted credential vault
Hardware-backed keys
TEE
Private computation
```

## Deployment

```text
Home server
NAS
Mac
Windows
Linux
Docker
Additional cloud deployment options beyond the Day 1 stack
Enterprise Gateway
```

---

## 10. Long-term Product Architecture

The eventual product should evolve from:

```text
API Gateway
```

into:

```text
Personal AI Security Gateway
```

with four major layers:

```text
┌───────────────────────────────────────┐
│             AI Agents                 │
│ Muse / Claude / ChatGPT / OpenClaw   │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│         Agent Gateway                 │
│                                       │
│ Identity                              │
│ Authorization                         │
│ Policy                                │
│ Approval                              │
│ Capability Management                 │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│          Privacy Layer                │
│                                       │
│ Minimization                          │
│ PII Detection                         │
│ Redaction                             │
│ Data Lineage                          │
│ Local AI Processing                   │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│        Personal Data Layer            │
│                                       │
│ Gmail / Drive / Calendar / Photos     │
│ Contacts / Slack / Social / Files     │
└───────────────────────────────────────┘
```

The strategic product principle remains:

> **Don't give an AI agent your data. Give it controlled capabilities over your data.**
