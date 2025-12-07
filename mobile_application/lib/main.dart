import 'package:flutter/material.dart';
import 'LogIn/log_in_screen.dart';
import 'LogIn/change_password.dart';
import 'Navigation/main_shell.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'PettyCash',
      theme: ThemeData(
        primarySwatch: Colors.amber,
        scaffoldBackgroundColor: Colors.white,
      ),
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/home') {
          final args = settings.arguments as Map<String, dynamic>?;

          return MaterialPageRoute(
            builder: (_) => MainShell(
              orgName: args?['orgName'] as String? ?? 'Organization',
              orgId: args?['orgId'] as int? ?? 0,
            ),
          );
        }

        if (settings.name == '/new-password') {
          final args = settings.arguments as Map<String, dynamic>?;

          return MaterialPageRoute(
            builder: (_) => NewPasswordScreen(
              orgName: args?['orgName'] as String? ?? 'Organization',
              orgId: args?['orgId'] as int? ?? 0,
            ),
          );
        }

        return MaterialPageRoute(
          builder: (_) => const LoginScreen(),
        );
      },
    );
  }
}
