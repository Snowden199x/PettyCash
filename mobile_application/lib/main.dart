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

      // Static routes (walang arguments)
      routes: {
        '/login': (context) => const LoginScreen(),
        '/new-password': (context) => const NewPasswordScreen(),

        // For now simple lang muna, walang orgName/orgId sa constructor
        '/home': (context) => const HomeScreen(
              orgName: 'Organization',
              orgId: 0,
            ),
        '/history': (context) => const TransactionHistoryScreen(),
        '/wallet': (context) => const WalletScreen(),
        '/profile': (context) => const ProfileScreen(),
      },

      // Wala munang onGenerateRoute habang inaayos pa ibang screens
      onGenerateRoute: (settings) => null,
    );
  }
}