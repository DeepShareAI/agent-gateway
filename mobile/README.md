# Agent Gateway mobile

A basic Material screen for the Day 1 foundation. It does not connect to private data or display a simulated backend status.

## Run

Use Flutter 3.35.7 with Dart 3.9.2, matching CI. This version also permits testing on the development machine's older macOS. Android requires the Android SDK and a device/emulator; iOS requires a compatible Xcode installation and a device/simulator. The generated identifiers are development placeholders: `com.agentgateway.agent_gateway_mobile` for Android and `com.agentgateway.agentGatewayMobile` for iOS.

```bash
flutter pub get
flutter devices
flutter run
```

A web runner is included for a preview without a mobile emulator:

```bash
flutter run -d chrome
```

## Checks

```bash
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
flutter build web
```

The widget tests cover the welcome screen and a small viewport with enlarged text. Native Android/iOS launch still requires platform-specific verification.

## Day 1 production delivery

GitHub Actions orchestrates CI/CD and gates releases. Codemagic must run Android and iOS platform builds, signing, and distribution for production from Day 1. Keep bundle identifiers, signing secrets, distribution destinations, and future API base URLs explicit for production. Backend URLs will point to the production Cloudflare/Cloud Run environment when the API client is introduced.

A hosted test environment and separate test release configuration are deferred. Production signing and release workflows must be validated behind a deployment gate. Public store publication is a separate release decision. Track each Codemagic build against the GitHub commit and report its outcome to the coordinating workflow. Flutter web builds and widget tests do not replace native build and device acceptance.

The root `codemagic.yaml` defines production Android and iOS builds. Android signing reads the Codemagic keystore environment variables and fails release builds when they are absent. GitHub orchestrates these builds and verifies completion; provider signing setup and native delivery remain pending. See [deployment requirements](../docs/deployment.md) and [Day 1 validation](../docs/day-1-validation.md).
