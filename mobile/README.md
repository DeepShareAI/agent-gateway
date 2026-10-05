# Agent Gateway Mobile

Flutter Android/iOS foundation for the mobile-authoritative gateway. Run `flutter pub get`, `flutter analyze`, `flutter test`, and `flutter run` from this directory.

The Day 1 shell cannot connect sources or approve agent requests. Release configuration uses `ENVIRONMENT`, `RELAY_URL`, and `RELEASE_SHA` Dart defines. Signing/distribution runs through the repository-root Codemagic workflows; see [production setup](../docs/production-setup.md).

The application/bundle ID `com.deepshareai.agentgateway` is provisional until account ownership and store records are confirmed. Android release builds require real keystore credentials and never fall back to debug signing.
