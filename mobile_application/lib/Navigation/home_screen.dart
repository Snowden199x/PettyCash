import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'transaction_history_screen.dart';
import 'wallet_screen.dart';
import 'profile_screen.dart';
import '../LogIn/log_in_screen.dart';

/// The main home screen shown after login.
/// Expects the organization name and id from the login response.
class HomeScreen extends StatefulWidget {
  /// Name of the logged-in organization (used in the greeting).
  final String orgName;

  /// ID of the logged-in organization (for future data fetching).
  final int orgId;

  const HomeScreen({
    super.key,
    // Defaults in case nothing is passed (should normally be overridden).
    this.orgName = 'Organization',
    this.orgId = 0,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  /// Index of the selected bottom navigation item (0 = Home).
  final int _selectedIndex = 0;

  /// Stores the formatted current date string (e.g. "Saturday, December 6").
  late String currentDate;

  /// Animation controller (currently used for the login success overlay timing).
  late AnimationController _animationController;

  /// Paths for bottom navigation icons (active and inactive).
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
    // Calculate and store the current date for the header.
    _updateDate();

    // Set up the animation controller (can be reused for more animations later).
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );

    // After the first frame is built, show the "Log In Successfully" overlay.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _showLoginSuccessNotification();
    });
  }

  @override
  void dispose() {
    // Always dispose animation controllers to avoid memory leaks.
    _animationController.dispose();
    super.dispose();
  }

  /// Updates [currentDate] with a nicely formatted string for the header.
  void _updateDate() {
    final now = DateTime.now();
    currentDate = DateFormat('EEEE, MMMM d').format(now);
  }

  /// Shows a temporary green overlay at the top saying "Log In Successfully".
  void _showLoginSuccessNotification() {
    if (!mounted) return;

    final overlay = Overlay.of(context);

    // This entry is what gets inserted into the overlay.
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
              padding:
                  const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
              decoration: BoxDecoration(
                color: Colors.green[700],
                borderRadius: BorderRadius.circular(8),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black26,
                    offset: Offset(0, 2),
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

    // Insert the overlay entry.
    overlay.insert(overlayEntry);

    // Remove it after 1 second.
    Future.delayed(const Duration(seconds: 1)).then((_) {
      if (mounted) {
        overlayEntry.remove();
      }
    });
  }

  /// Handles taps on the bottom navigation bar items.
  void _onItemTapped(int index) {
    // If the user taps the already selected tab, do nothing.
    if (index == _selectedIndex) return;

    // Decide which screen to navigate to based on the tapped index.
    Widget nextScreen;
    switch (index) {
      case 0:
        // Home tab – pass orgName and orgId again to the new HomeScreen.
        nextScreen = HomeScreen(
          orgName: widget.orgName,
          orgId: widget.orgId,
        );
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

    // Replace the current screen without animation.
    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        // pageBuilder params are unused, hence the underscores.
        pageBuilder: (_, _, _) => nextScreen,
        transitionDuration: Duration.zero,
        reverseTransitionDuration: Duration.zero,
      ),
    );
  }

  /// Handles selection from the top-right popup menu (Profile / Logout).
  void _onMenuSelected(String value) {
    if (value == 'profile') {
      // Go to profile screen on top of the current one.
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const ProfileScreen()),
      );
    } else if (value == 'logout') {
      // Clear navigation stack and go back to login screen.
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (Route<dynamic> route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // =======================
              // Header: greeting + date
              // =======================
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Left side: greeting and date.
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Uses widget.orgName passed from login.
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
                  // Right side: profile avatar with popup menu.
                  PopupMenuButton<String>(
                    onSelected: _onMenuSelected,
                    offset: const Offset(0, 40),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    itemBuilder: (context) => const [
                      PopupMenuItem<String>(
                        value: 'profile',
                        child: Text('Profile'),
                      ),
                      PopupMenuItem<String>(
                        value: 'logout',
                        child: Text('Logout'),
                      ),
                    ],
                    child: const CircleAvatar(
                      radius: 18,
                      backgroundImage: AssetImage(
                        'assets/profile_pictures/bank.jpg',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 40),

              // =================
              // Overview card area
              // =================
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
                    boxShadow: const [
                      BoxShadow(
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
                      // Grid of small overview cards (balance, income, etc.).
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
                              subtitle: '',
                              amount: 'PHP 00.00',
                            ),
                            _OverviewCard(
                              title: 'Income this month:',
                              subtitle: '',
                              amount: 'PHP 00.00',
                            ),
                            _OverviewCard(
                              title: 'Expense this month:',
                              subtitle: '',
                              amount: 'PHP 00.00',
                            ),
                            _OverviewCard(
                              title: "Total of events:",
                              subtitle: '',
                              amount: '0',
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // ======================
              // Transaction history UI
              // ======================
              const Text(
                'Transaction History',
                style: TextStyle(
                  fontFamily: 'Poppins',
                  fontStyle: FontStyle.italic,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 70),
              Center(
                child: Column(
                  children: [
                    Image.asset(
                      'assets/Icons/navigation_icons/nav_history.png',
                      height: 61,
                      width: 61,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'No transaction yet',
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Your transaction history will appear here once you add entries',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.w400,
                        fontSize: 12,
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      // Bottom navigation bar (Home, History, Wallets, Profile).
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  /// Builds the bottom navigation bar container and items.
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

  /// Builds a single BottomNavigationBarItem with custom background and icon color.
  BottomNavigationBarItem _buildNavItem(
      int index, String label, Map<String, String> icons) {
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
}

/// Small card widget used inside the "Overview" grid.
class _OverviewCard extends StatelessWidget {
  /// Title text (e.g. "Balance:", "Income this month:").
  final String title;

  /// Optional subtitle (currently unused, but available).
  final String subtitle;

  /// Value text shown at the bottom-right (e.g. "PHP 00.00").
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
          // Title and subtitle in the top-left.
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.bold)),
                Text(subtitle,
                    style: const TextStyle(
                        fontSize: 12, color: Colors.black87)),
              ],
            ),
          ),
          // Amount in the bottom-right.
          Positioned(
            bottom: 8,
            right: 10,
            child: Text(
              amount,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
