# Day 1 production account setup

Enter secrets directly in provider settings, never in chat or committed files. Confirm public identifiers and setup status to the development agent. The defaults below are provisional until you confirm ownership/availability.

## 1. Git identity and repository

Provide the commit author name and email. Repository: `DeepShareAI/agent-gateway`; working branch: `relay-architecture`. Enable GitHub Actions and allow the selected Actions used by CI. Add a `production` GitHub environment, restrict deployments to the intended trusted branch, and configure release reviewers if your team requires them. Release is explicitly dispatched from the selected branch, not triggered by pull requests.

The Day 1 production workflow runs the checks again on its selected commit. Codemagic verifies the fetched commit before building; branch drift fails the build rather than silently shipping a different revision. Keep the release branch stable during delivery. A deployment can succeed while mobile distribution fails; the aggregate release must remain failed in that situation.

## 2. Cloudflare

1. Create/sign into the Cloudflare account and enable Workers with a `workers.dev` subdomain.
2. Confirm the account ID, Worker names, and preferred HTTPS URLs. Defaults: `agent-gateway-relay-staging` and `agent-gateway-relay-production` in `relay/wrangler.toml`. Custom domains are optional for Day 1.
3. Create a scoped API token permitting Worker deployment in that account. Use Cloudflare's Workers deployment token template as the starting point and restrict its account scope. Store the token as `CLOUDFLARE_API_TOKEN` and the account ID as `CLOUDFLARE_ACCOUNT_ID` in the GitHub `production` environment secrets.
4. Set environment variables `STAGING_RELAY_URL` and `RELAY_URL` to the exact HTTPS Worker origins. The workflow verifies `/health`, the environment, the deployed commit, and disabled source access after each deployment.

No Gmail, APNs, FCM, or payload cryptographic secrets are needed for the health-only Day 1 Worker. Provider credentials are introduced in their later milestones.

## 3. Codemagic

1. Create/select a Codemagic team and connect the GitHub repository with read access to the release branch. Add it as a Flutter application and select the repository-root `codemagic.yaml`.
2. Confirm the Codemagic app ID and store it as the GitHub `production` environment variable `CM_APP_ID`.
3. Create a Codemagic API token with a team role permitted to start/read builds. Store it as GitHub secret `CM_API_TOKEN`. The workflow uses the official v3 API; it waits for build completion and checks app/workflow/commit/artifact identity.
4. Create a Codemagic environment group `production_mobile`, accessible only to trusted release workflows. Configure the signing and store credentials below.
5. Scan the branch containing the committed YAML. Confirm workflows `android-release` and `ios-release` are recognized. Disable duplicate branch/webhook release triggers; GitHub Actions orchestrates release builds.

## 4. Android signing and internal distribution (deferred)

GitHub production delivery currently runs only `ios-release`. Android signing and Play credentials are not required for this release. Android Codemagic workflows remain available for future setup; Android debug-build CI checks remain enabled.

Confirm the app name and unique application ID. Provisional ID: `com.deepshareai.agentgateway`. Changing it requires updating the native application ID, Codemagic variables, and store record together before the first upload.

1. Create the Google Play Console application and internal tester list. Confirm any account verification and required app declarations are complete.
2. Create or select the upload keystore. Keep an independent secure backup; upload it to Codemagic's Android code-signing identities with reference `agent_gateway_upload`. Enter the keystore/key passwords in Codemagic, not GitHub or the repository. Release Gradle configuration reads the `CM_KEYSTORE_*` variables and has no debug-signing fallback.
3. Grant a Google Play service account only the permissions needed for this app's internal testing releases. Store its JSON credentials as secret `GOOGLE_PLAY_SERVICE_ACCOUNT_CREDENTIALS` in `production_mobile`.
4. Set non-secret `ANDROID_PACKAGE_NAME` to the confirmed application ID in that group.
5. Complete the initial app/bundle setup required by Play Console. The publishing API may require the initial bundle to be uploaded manually. For a new app, run the `android-bootstrap` Codemagic workflow manually with `EXPECTED_REVISION` and `RELAY_URL` set to the intended commit/production origin. It produces signed build-number-1 AAB/APK artifacts without querying or publishing to Play. Upload its AAB to initialize the internal track, then run the normal release orchestration. Bootstrap is only for a new app with no previous uploaded version; it does not count as completed automatic distribution. Resolve draft/review requirements in Play Console; do not claim a tester release from an upload alone.

The configured workflow builds a signed AAB and publishes to the internal track. It queries the track's existing version code before choosing the next one; inability to query the initial track is a setup blocker, not a reason to guess version codes. Configure an alternative Android distribution channel only after revising and validating the workflow.

## 5. iOS signing and TestFlight

1. Confirm active Apple Developer membership, the team, and the bundle ID. Provisional bundle ID: `com.deepshareai.agentgateway`. Register the App ID and create the matching App Store Connect app record.
2. Create an App Store Connect API integration in Codemagic named `agent-gateway-asc` with the permissions required for signing/upload/TestFlight. Enter the issuer ID, key ID, and private key directly into Codemagic.
3. Upload or generate a valid Apple distribution certificate and App Store provisioning profile in Codemagic for the exact bundle ID. The `ios_signing` configuration selects matching identities; `xcode-project use-profiles` applies them.
4. Set the numeric App Store Connect app ID as `APP_STORE_APPLE_ID` in `production_mobile`.
5. Create the TestFlight group `Agent Gateway Internal`, add testers, and complete required app/export-compliance/beta information. Confirm the selected group supports the intended internal/external tester flow; external beta review may delay access.

The workflow uploads a signed IPA and requests TestFlight distribution, without public App Store submission. The orchestrator also waits for v3 `app_store_connect_status` to finish. If that status is missing, fails, or times out, delivery fails closed. Actual tester visibility and installation still require checking TestFlight and the physical device; API completion cannot prove installation.

## 6. First release and evidence

After committing/pushing the implementation and completing provider setup:

1. Run GitHub **CI** and resolve all failures, including Compose and Android debug-build checks.
2. Dispatch **Production delivery** on the trusted release branch. It deploys staging, verifies it, deploys production, verifies it, then starts only `ios-release` for that revision.
3. Record Worker URLs/deployment versions, Actions run URL, the iOS Codemagic build ID, signed artifact version, and TestFlight delivery status. `delivery-report.json` excludes tokens and artifact download links.
4. Install/launch the iOS TestFlight build on a physical device. Verify the displayed release matches the tested commit and account connection/agent access is unavailable. Android distribution and device evidence are deferred.
5. Verify failed-build status propagation using an isolated test/mocked orchestration scenario, and validate relay rollback as below.

The current iOS-only Day 1 delivery requires these live checks and iOS distribution evidence. Android acceptance is deferred at the user's request and does not block this scope. Configuration files alone do not establish completion.

## 7. Rollback

The manually dispatched **Relay recovery** workflow provides credential-managed recovery using the GitHub `production` environment. Select `staging` and operation `list` to record known deployment/version IDs. For operation `rollback`, supply an explicitly selected compatible Worker version UUID and its full commit SHA; the workflow activates it and verifies `/health`. Repeat for production only after staging validation. Use the same workflow to restore the intended release by selecting its recorded version and SHA. Recovery and production delivery share a concurrency group so they cannot run together. Recovery artifacts record the deployments before/after the operation. A successful recovery run alone does not prove a round trip: record both rollback and restoration runs.

List known Worker versions with `npx wrangler deployments list --config relay/wrangler.toml --env production`. Use `npx wrangler rollback <version-id> --config relay/wrangler.toml --env production` to return to an explicitly selected compatible version, then verify `/health` against that revision. The first deployment has no preceding version; create/validate a second safe health-only revision to demonstrate rollback and redeploy the intended release afterward. Apply the same procedure to staging first.

Keep installed mobile clients compatible with the selected relay. Mobile recovery requires a corrected, signed build with a higher build number rather than reinstalling an older store artifact. Do not automatically roll back a relay after mobile failure without checking compatibility and the actual failure.

## Reference documentation

- [Cloudflare Wrangler environments](https://developers.cloudflare.com/workers/wrangler/environments/)
- [Codemagic v3 API schema](https://codemagic.io/api/v3/schema)
- [Android signing](https://docs.codemagic.io/yaml-code-signing/signing-android/)
- [Google Play publishing](https://docs.codemagic.io/yaml-publishing/google-play/)
- [iOS signing](https://docs.codemagic.io/yaml-code-signing/signing-ios/)
- [App Store Connect and TestFlight publishing](https://docs.codemagic.io/yaml-publishing/app-store-connect/)
