import 'package:flutter/material.dart';

void main() {
  runApp(const AgentGatewayApp());
}

class AgentGatewayApp extends StatelessWidget {
  const AgentGatewayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Agent Gateway',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF234E42)),
        scaffoldBackgroundColor: const Color(0xFFF5F6F2),
        useMaterial3: true,
      ),
      home: Scaffold(
        appBar: AppBar(title: const Text('Agent Gateway')),
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: const Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.shield_outlined,
                      size: 48,
                      color: Color(0xFF234E42),
                    ),
                    SizedBox(height: 24),
                    Text(
                      'Your personal gateway',
                      style: TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Controlled access to your private data, with you in charge.',
                      style: TextStyle(fontSize: 17, height: 1.5),
                    ),
                    SizedBox(height: 32),
                    Card(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Welcome to Agent Gateway',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                            SizedBox(height: 12),
                            Text(
                              'Agent connections, data sources, and access approvals are coming in future milestones. No private data sources are connected yet.',
                              style: TextStyle(height: 1.6),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
