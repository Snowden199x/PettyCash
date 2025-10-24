import 'package:flutter/material.dart';

// 🟢 Import all screens
import 'LogIn/login_screen.dart';
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

      // 🎨 App theme
      theme: ThemeData(
        primarySwatch: Colors.amber,
        scaffoldBackgroundColor: Colors.white,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.amber,
          foregroundColor: Colors.black,
          centerTitle: true,
          elevation: 0,
        ),
      ),

      // 🟡 Initial screen
      initialRoute: '/signup',

      // 🧭 Define all named routes
      routes: {
        '/signup': (context) => const LoginScreen(),

        // 👇 You can pass data like organization name here
        '/home': (context) => const HomeScreen(orgName: "Organization"),

        '/history': (context) => const TransactionHistoryScreen(),
        '/wallet': (context) => const WalletScreen(),
        '/profile': (context) => const ProfileScreen(),
      },
    );
  }
}
