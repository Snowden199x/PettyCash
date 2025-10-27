import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'transaction_history_screen.dart';
import 'wallet_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  final String orgName;

  const HomeScreen({super.key, required this.orgName});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  final int _selectedIndex = 0;
  late String currentDate;
  bool _isFabMenuOpen = false;
  late AnimationController _animationController;

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

  @override
  void initState() {
    super.initState();
    _updateDate();
    _animationController =
        AnimationController(vsync: this, duration: const Duration(milliseconds: 250));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _showLoginSuccessNotification();
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _updateDate() {
    final now = DateTime.now();
    currentDate = DateFormat('EEEE, MMMM d').format(now);
  }

  void _showLoginSuccessNotification() {
    final overlay = Overlay.of(context);
    final overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: 60,
        left: MediaQuery.of(context).size.width * 0.15,
        right: MediaQuery.of(context).size.width * 0.15,
        child: Material(
          color: Colors.transparent,
          child: AnimatedOpacity(
            opacity: 1.0,
            duration: const Duration(milliseconds: 300),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
              decoration: BoxDecoration(
                color: Colors.green[700],
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black26,
                    offset: const Offset(0, 2),
                    blurRadius: 4,
                  ),
                ],
              ),
              child: const Center(
                child: Text(
                  'Log In Successfully',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );

    overlay.insert(overlayEntry);
    Future.delayed(const Duration(seconds: 1)).then((_) => overlayEntry.remove());
  }

  void _onItemTapped(int index) {
    if (index == _selectedIndex) return;

    Widget nextScreen;
    switch (index) {
      case 0:
        nextScreen = HomeScreen(orgName: widget.orgName);
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
      MaterialPageRoute(builder: (context) => nextScreen),
    );
  }

  void _toggleFabMenu() {
    setState(() {
      _isFabMenuOpen = !_isFabMenuOpen;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Scaffold(
          backgroundColor: Colors.white,
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // HEADER
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hello, ${widget.orgName}',
                            style: const TextStyle(
                              fontFamily: 'PlayFairDisplay',
                              fontStyle: FontStyle.italic,
                              fontWeight: FontWeight.w400,
                              fontSize: 32,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            currentDate,
                            style: const TextStyle(
                              fontFamily: 'Poppins',
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                              color: Colors.black87,
                            ),
                          ),
                        ],
                      ),
                      Image.asset(
                        'assets/Icons/notification.png',
                        height: 31.5,
                        width: 27.02,
                      ),
                    ],
                  ),

                  const SizedBox(height: 40),

                  // OVERVIEW BOX
                  Center(
                    child: Container(
                      width: 356,
                      height: 200,
                      decoration: BoxDecoration(
                        gradient: const RadialGradient(
                          center: Alignment.center,
                          radius: 1.2,
                          colors: [Color(0xFFFFFFFF), Color(0xFFECDDC6)],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.black),
                        boxShadow: [
                          const BoxShadow(
                            color: Colors.black26,
                            offset: Offset(2, 4),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Overview',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Expanded(
                            child: GridView.count(
                              crossAxisCount: 2,
                              mainAxisSpacing: 6,
                              crossAxisSpacing: 6,
                              childAspectRatio: 2.1,
                              physics: const NeverScrollableScrollPhysics(),
                              children: const [
                                _OverviewCard(
                                  title: 'Balance:',
                                  subtitle: 'expenses',
                                  amount: 'PHP 00.00',
                                ),
                                _OverviewCard(
                                  title: 'EVENT:',
                                  subtitle: 'expenses',
                                  amount: 'PHP 00.00',
                                ),
                                _OverviewCard(
                                  title: 'EVENT:',
                                  subtitle: 'expenses',
                                  amount: 'PHP 00.00',
                                ),
                                _OverviewCard(
                                  title: "EVENT:",
                                  subtitle: 'expenses',
                                  amount: 'PHP 00.00',
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // TRANSACTION HISTORY
                  const Text(
                    'Transaction History',
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontStyle: FontStyle.italic,
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 8),

                  _buildTransactionItem("EVENT", "Particulars", "Description",
                      "PHP 00.00", "Date"),
                  _buildTransactionItem("EVENT", "Particulars", "Description",
                      "PHP 00.00", "Date"),
                  _buildTransactionItem("EVENT", "Particulars", "Description",
                      "PHP 00.00", "Date"),
                ],
              ),
            ),
          ),

          // ✅ FAB BUTTON (Add icon)
          floatingActionButton: FloatingActionButton(
            onPressed: _toggleFabMenu,
            backgroundColor: const Color(0xFF2F4366),
            shape: const CircleBorder(),
            child: const Icon(
              Icons.add,
              color: Colors.white,
              size: 30,
            ),
          ),
          floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,

          // ✅ Bottom navigation
          bottomNavigationBar: BottomNavigationBar(
            currentIndex: _selectedIndex,
            onTap: _onItemTapped,
            type: BottomNavigationBarType.fixed,
            backgroundColor: Colors.white,
            selectedItemColor: const Color(0xFF8B3B08),
            unselectedItemColor: Colors.black,
            showSelectedLabels: true,
            showUnselectedLabels: true,
            items: [
              _buildNavItem(0, 'Home', iconPaths['home']!),
              _buildNavItem(1, 'History', iconPaths['history']!),
              _buildNavItem(2, 'Wallets', iconPaths['wallet']!),
              _buildNavItem(3, 'Profile', iconPaths['profile']!),
            ],
          ),
        ),

        // ✅ FAB MENU OVERLAY
        if (_isFabMenuOpen)
          Positioned.fill(
            child: GestureDetector(
              onTap: _toggleFabMenu,
              child: Container(color: Colors.black54),
            ),
          ),

        // ✅ Floating white buttons
        if (_isFabMenuOpen)
          Positioned(
            right: 24,
            bottom: 160, // moved up 30px
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _buildWhiteMenuButton("New Wallet"),
                const SizedBox(height: 10),
                _buildWhiteMenuButton("Add Receipt"),
                const SizedBox(height: 10),
                _buildWhiteMenuButton("New Record"),
              ],
            ),
          ),
      ],
    );
  }

  // ✅ Updated style here (Poppins, black text, no underline)
  Widget _buildWhiteMenuButton(String label) {
    return GestureDetector(
      onTap: () {
        debugPrint("$label clicked");
      },
      child: Container(
        width: 160,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: Colors.black),
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [
            BoxShadow(color: Colors.black26, blurRadius: 3, offset: Offset(1, 2)),
          ],
        ),
        child: Center(
          child: Text(
            label,
            style: const TextStyle(
              fontFamily: 'Poppins',
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: Colors.black,
              decoration: TextDecoration.none, // removes underline
            ),
          ),
        ),
      ),
    );
  }

  BottomNavigationBarItem _buildNavItem(
      int index, String label, Map<String, String> icons) {
    final isSelected = _selectedIndex == index;

    return BottomNavigationBarItem(
      icon: Container(
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF8B3B08) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.all(8),
        child: Image.asset(
          isSelected ? icons['active']! : icons['inactive']!,
          height: 28,
          color: isSelected ? Colors.white : Colors.black,
        ),
      ),
      label: label,
    );
  }

  Widget _buildTransactionItem(
      String title, String line1, String line2, String amount, String date) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.black, width: 1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style:
                      const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 2),
              Text(line1,
                  style:
                      const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              Text(line2,
                  style: const TextStyle(fontSize: 12, color: Colors.black87)),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(amount,
                  style:
                      const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 4),
              Text(date,
                  style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ),
        ],
      ),
    );
  }
}

class _OverviewCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String amount;

  const _OverviewCard({
    required this.title,
    required this.subtitle,
    required this.amount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF3D58D),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.black),
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.bold)),
                Text(subtitle,
                    style:
                        const TextStyle(fontSize: 12, color: Colors.black87)),
              ],
            ),
          ),
          Positioned(
            bottom: 8,
            right: 10,
            child: Text(amount,
                style: const TextStyle(
                    fontWeight: FontWeight.bold, fontSize: 14)),
          ),
        ],
      ),
    );
  }
}
