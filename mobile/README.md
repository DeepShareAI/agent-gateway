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
