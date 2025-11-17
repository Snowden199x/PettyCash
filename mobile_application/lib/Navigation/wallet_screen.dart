import 'package:flutter/material.dart';
import 'home_screen.dart';
import 'transaction_history_screen.dart';
import 'profile_screen.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final int _selectedIndex = 2; // Highlight Wallet tab

  // Icon paths (same as other screens)
  final iconPaths = {
    'home': {
      'active': 'assets/Icons/navigation_icons/nav_home.png',
      'inactive': 'assets/Icons/navigation_icons/nav_home.png',
    },
    'history': {
      'active': 'assets/Icons/navigation_icons/nav_history.png',
      'inactive': 'assets/Icons/navigation_icons/nav_history.png',
    },
    'wallet': {
      'active': 'assets/Icons/navigation_icons/nav_wallet.png',
      'inactive': 'assets/Icons/navigation_icons/nav_wallet.png',
    },
    'profile': {
      'active': 'assets/Icons/navigation_icons/nav_profile.png',
      'inactive': 'assets/Icons/navigation_icons/nav_profile.png',
    },
  };

  void _onItemTapped(int index) {
    if (index == _selectedIndex) return;

    Widget nextScreen;
    switch (index) {
      case 0:
        nextScreen = const HomeScreen(orgName: "Organization");
        break;
      case 1:
        nextScreen = const TransactionHistoryScreen();
        break;
      case 2:
        nextScreen = const WalletScreen();
        break;
      case 3:
        nextScreen = const ProfileScreen();
        break;
      default:
        return;
    }

    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => nextScreen,
        transitionDuration: Duration.zero,
        reverseTransitionDuration: Duration.zero,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,

      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          "Wallet",
          style: TextStyle(
            fontStyle: FontStyle.italic,
            fontFamily: 'Times New Roman',
            fontSize: 22,
            color: Colors.black,
          ),
        ),
      ),

      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: SingleChildScrollView(
            child: Column(
              children: [
                // Wallet Info Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    gradient: const LinearGradient(
                      colors: [Color(0xFFF8EBD5), Color(0xFFFFF8EE)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Balance",
                                style: TextStyle(fontWeight: FontWeight.w600),
                              ),
                              SizedBox(height: 4),
                              Text(
                                "PHP 750",
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Total Income",
                                style: TextStyle(fontWeight: FontWeight.w600),
                              ),
                              SizedBox(height: 4),
                              Text(
                                "PHP 500",
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Bottom Row
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Total Expenses",
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          SizedBox(height: 4),
                          Text(
                            "PHP 1250",
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 30),

                // Bottom Buttons Row
                Row(
                  children: [
                    Expanded(child: _buildNavButton("Wallets", isActive: true)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildNavButton("Reports")),
                    const SizedBox(width: 8),
                    Expanded(child: _buildNavButton("Receipts")),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),

      // Navigation bar (same as transaction_history.dart)
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  // EXACT same navigation bar design used in TransactionHistoryScreen
  Widget _buildBottomNavigationBar() {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Colors.black12, width: 1)),
      ),
      child: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: const Color(0xFF8B3B08),
        unselectedItemColor: Colors.black,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        selectedLabelStyle: const TextStyle(
          fontFamily: 'Poppins',
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
        items: [
          _buildNavItem(0, 'Home', iconPaths['home']!),
          _buildNavItem(1, 'History', iconPaths['history']!),
          _buildNavItem(2, 'Wallets', iconPaths['wallet']!),
          _buildNavItem(3, 'Profile', iconPaths['profile']!),
        ],
      ),
    );
  }

  // EXACT same nav item style as TransactionHistoryScreen
  BottomNavigationBarItem _buildNavItem(
    int index,
    String label,
    Map<String, String> icons,
  ) {
    final isSelected = _selectedIndex == index;

    return BottomNavigationBarItem(
      icon: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF8B3B08) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Image.asset(
          isSelected ? icons['active']! : icons['inactive']!,
          height: 28,
          color: isSelected ? Colors.white : Colors.black,
        ),
      ),
      label: label,
    );
  }

  // Wallet buttons
  Widget _buildNavButton(String label, {bool isActive = false}) {
    return ElevatedButton(
      onPressed: () {},
      style: ElevatedButton.styleFrom(
        backgroundColor: isActive ? const Color(0xFFFFE4B5) : Colors.white,
        foregroundColor: Colors.black,
        side: const BorderSide(color: Colors.black),
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(6),
        ),
      ),
      child: Text(label),
    );
  }
}
