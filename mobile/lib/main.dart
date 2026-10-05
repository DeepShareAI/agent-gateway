import 'package:flutter/material.dart';

import 'domain/gateway_configuration.dart';

void main() {
  runApp(
    const GatewayApp(configuration: GatewayConfiguration.fromEnvironment()),
  );
}

class GatewayApp extends StatelessWidget {
  const GatewayApp({super.key, required this.configuration});

  final GatewayConfiguration configuration;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Agent Gateway',
      theme: ThemeData(colorSchemeSeed: const Color(0xFF245C4B)),
      home: Scaffold(
        appBar: AppBar(title: const Text('Agent Gateway')),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              const Icon(Icons.shield_outlined, size: 64),
              const SizedBox(height: 24),
              Text(
                'Your data stays under your control',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 16),
              const Text(
                'Agent Gateway will let you review what agents can access and what information they receive.',
              ),
              const SizedBox(height: 24),
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Text(
                    'Setup is in progress. Connecting accounts and granting agent access are not available yet.',
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text('Environment: ${configuration.environment}'),
              Text('Release: ${configuration.revision}'),
            ],
          ),
        ),
      ),
    );
  }
}
