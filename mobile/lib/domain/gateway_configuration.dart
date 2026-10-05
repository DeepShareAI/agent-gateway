class GatewayConfiguration {
  const GatewayConfiguration({
    required this.environment,
    required this.revision,
    required this.relayUrl,
  });

  const GatewayConfiguration.fromEnvironment()
    : environment = const String.fromEnvironment(
        'ENVIRONMENT',
        defaultValue: 'local',
      ),
      revision = const String.fromEnvironment(
        'RELEASE_SHA',
        defaultValue: 'local',
      ),
      relayUrl = const String.fromEnvironment('RELAY_URL');

  final String environment;
  final String revision;
  final String relayUrl;

  // Enabling private-data access requires the later domain security pipeline.
  bool get sourceAccessEnabled => false;
}
