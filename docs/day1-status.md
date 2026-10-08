# Day 1 validation status

Day 1 implementation is ready for live validation. Its current iOS-only scope is not complete until production deployment, signed TestFlight distribution, physical iOS installation, and rollback checks pass.

## Implemented

- Health-only Cloudflare Worker, separate local/staging/production environments, no private-data routes.
- Generated native Android/iOS Flutter project with injectable configuration and a shell that offers no source access.
- Real Android release signing configuration with no debug-key fallback.
- Demo-agent and mock-provider health services; Dockerfile and Compose local stack.
- GitHub PR checks and manually dispatched production orchestration.
- Manually dispatched relay recovery with explicit version/revision validation, health verification, deployment evidence artifacts, and a shared production concurrency lock.
- Codemagic signed Android internal release, initial Android bootstrap artifacts, and iOS TestFlight workflows.
- v3 Codemagic API polling with revision/app/workflow/artifact verification, bounded waits, failed-build propagation, TestFlight post-processing checks, and sanitized release report.
- Production account/setup, API, and rollback documentation.

## Verified locally

- Formatting, lint, TypeScript checks, and configuration YAML parsing.
- Node tests covering Worker routes, adapter callback rejection, and orchestration completion/failure/identity handling.
- Worker dry-run build and adapter TypeScript build.
- Actual Wrangler local runtime health, mutating-health rejection, and disabled source routes.
- Flutter analysis and widget test.
- Docker Compose CLI configuration validation.

On October 8, 2026, the iOS-only delivery change passed `npm run check` (formatting, configuration parsing, lint, type checks, 10 Node tests, Worker dry-run build, and adapter build), Flutter analysis, and the mobile widget test. Mocked orchestration tests verify that only iOS is triggered, failed builds fail the release, and reports exclude credentials/artifact URLs. The added recovery workflow also passed YAML/configuration validation and formatting checks. These checks do not establish live deployment, recovery, or TestFlight delivery.

## Current delivery scope

GitHub production delivery deploys staging/production relays and runs only the Codemagic `ios-release` workflow. Android signing, distribution, and physical Android acceptance are deferred at the user's request; Android debug-build CI checks remain enabled. Android is not a blocker for the current iOS-only Day 1 scope.

## Pending acceptance evidence

- Production delivery workflow execution with configured provider accounts.
- Live verification of configured Cloudflare credentials, deployed staging/production URLs and revision checks.
- Live verification of the user-configured Codemagic integration, Apple signing identities, app record, and TestFlight group.
- Successful signed iOS build and TestFlight distribution; native iOS builds require Codemagic.
- Physical iOS installation and launch with the expected revision.
- Live relay rollback and restoration to the intended release.

No Gmail, push-provider, pairing, encryption, connector, or approval features have been implemented in Day 1. Later milestones remain pending.

## GitHub CI evidence

[CI run 37289995185](https://github.com/DeepShareAI/agent-gateway/actions/runs/37289995185) passed for implementation commit `b67e90a`. Both Node and mobile jobs completed successfully, including Compose container startup and health/private-route smoke checks, Node verification/builds, Flutter analysis/tests, and the Android debug APK build. Docker is still unavailable as a local daemon on this Windows machine, but the local stack has been exercised on the Linux CI runner.

The relay container initially failed because package-manifest copies created root-owned workspace directories. Explicit ownership correction before switching to the non-root user fixed Wrangler's temporary-directory access. The successful run validates that correction. Signed release builds, iOS builds, live provider deployment, tester distribution, and physical installation are separate pending checks; debug-build success does not establish them.
