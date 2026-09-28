import 'package:agent_gateway_mobile/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('shows the Agent Gateway foundation screen', (tester) async {
    await tester.pumpWidget(const AgentGatewayApp());
    expect(find.text('Agent Gateway'), findsOneWidget);
    expect(find.text('Your personal gateway'), findsOneWidget);
    expect(find.text('Welcome to Agent Gateway'), findsOneWidget);
    expect(
      find.textContaining('No private data sources are connected yet.'),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('supports a small screen and enlarged text without overflow', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 568);
    tester.view.devicePixelRatio = 1;
    tester.platformDispatcher.textScaleFactorTestValue = 2;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);

    await tester.pumpWidget(const AgentGatewayApp());
    await tester.drag(
      find.byType(SingleChildScrollView),
      const Offset(0, -500),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.text('Welcome to Agent Gateway'), findsOneWidget);
  });
}
