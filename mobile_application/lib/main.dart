import 'package:flutter/material.dart';
import 'LogIn/log_in_screen.dart';
import 'LogIn/change_password.dart';
import 'Navigation/home_screen.dart';
import 'Navigation/transaction_history_screen.dart';
import 'Navigation/wallet_screen.dart';
import 'Navigation/profile_screen.dart';

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

      // First screen
      initialRoute: '/login',

      // Routes that don't need arguments
      routes: {
        '/login': (context) => const LoginScreen(),
        '/history': (context) => const TransactionHistoryScreen(),
        '/wallet': (context) => const WalletScreen(),
        '/profile': (context) => const ProfileScreen(),
      },

      // Routes that may receive arguments (home, new-password)
      onGenerateRoute: (settings) {
        if (settings.name == '/home') {
          final args = settings.arguments as Map<String, dynamic>?;

          return MaterialPageRoute(
            builder: (_) => HomeScreen(
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

        // Fallback: go to login if route not recognized
        return MaterialPageRoute(
          builder: (_) => const LoginScreen(),
        );
      },
    );
  }
}
