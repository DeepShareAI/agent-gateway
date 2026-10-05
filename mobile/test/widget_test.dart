import 'package:flutter_test/flutter_test.dart';
import 'package:agentgateway/domain/gateway_configuration.dart';
import 'package:agentgateway/main.dart';

void main() {
  testWidgets('foundation shell never offers source access or approval', (
    tester,
  ) async {
    const configuration = GatewayConfiguration(
      environment: 'test',
      revision: 'tested-revision',
      relayUrl: 'https://relay.test',
    );
    expect(configuration.sourceAccessEnabled, isFalse);
    await tester.pumpWidget(const GatewayApp(configuration: configuration));
    expect(find.text('Agent Gateway'), findsOneWidget);
    expect(find.text('Release: tested-revision'), findsOneWidget);
    expect(
      find.textContaining(
        'Connecting accounts and granting agent access are not available yet.',
      ),
      findsOneWidget,
    );
  });
}
