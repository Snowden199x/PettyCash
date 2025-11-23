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

      // FIRST SCREEN DISPLAYED
      initialRoute: '/login',

      routes: {
        '/login': (context) => const LoginScreen(),
        '/new-password': (context) => const NewPasswordScreen(),

        '/home': (context) => const HomeScreen(orgName: "Organization"),
        '/history': (context) => const TransactionHistoryScreen(),
        '/wallet': (context) => const WalletScreen(),
        '/profile': (context) => const ProfileScreen(),
      },
    );
  }
}
