import 'package:flutter/material.dart';

// 🟢 Correct imports based on your folder structure
import 'Sign_Up/sign_up.dart';
import 'Sign_Up/create_id_screen.dart';
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
        primaryColor: Colors.amber,
        scaffoldBackgroundColor: Colors.white,
      ),

      // ✅ First screen that loads
      home: const SignUpScreen(),

      // ✅ Define all routes for navigation
      routes: {
        '/signup': (context) => const SignUpScreen(),
        '/create_id': (context) => const CreateIdScreen(),
        '/home': (context) => const HomeScreen(orgName: "Organization"),
        '/history': (context) => const TransactionHistoryScreen(),
        '/wallet': (context) => const WalletScreen(),
        '/profile': (context) => const ProfileScreen(),
      },
    );
  }
}
