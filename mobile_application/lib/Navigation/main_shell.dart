import 'package:flutter/material.dart';
import 'home_screen.dart';
import 'transaction_history_screen.dart';
import 'wallet_screen.dart';
import 'profile_screen.dart';

class MainShell extends StatefulWidget {
  final String orgName;
  final int orgId;

  const MainShell({
    super.key,
    required this.orgName,
    required this.orgId,
  });

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _selectedIndex = 0;

  late final List<Widget> _pages = [
    HomeScreen(orgName: widget.orgName, orgId: widget.orgId),
    TransactionHistoryScreen(orgName: widget.orgName, orgId: widget.orgId),
    const WalletScreen(),
    ProfileScreen(orgName: widget.orgName, orgId: widget.orgId),
  ];

  // same icon paths map you used in each screen
  final Map<String, Map<String, String>> iconPaths = const {
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
    setState(() => _selectedIndex = index);
  }

  BottomNavigationBarItem _buildNavItem(
    int index,
    String label,
    Map<String, String> icons,
  ) {
    final bool isSelected = _selectedIndex == index;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _pages,
      ),
      bottomNavigationBar: Container(
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
      ),
    );
  }
}
