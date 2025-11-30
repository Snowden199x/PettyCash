import 'package:flutter/material.dart';
import 'home_screen.dart';
import 'transaction_history_screen.dart';
import 'profile_screen.dart';
import 'wallet_month.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final int _selectedIndex = 2; // Highlight Wallet tab

  // Months from August to May
  final List<String> _months = [
    'AUGUST 2024',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER',
    'JANUARY 2025',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
  ];

  // Sorting state
  String _sortField = 'Month';
  String _sortOrder = 'New to old';

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

  final GlobalKey _sortKey = GlobalKey();

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

  void _showCustomSortMenu() {
    final renderBox =
        _sortKey.currentContext?.findRenderObject() as RenderBox?;
    final overlayBox =
        Overlay.of(context).context.findRenderObject() as RenderBox;

    if (renderBox == null) return;

    final position =
        renderBox.localToGlobal(Offset.zero, ancestor: overlayBox);

    late OverlayEntry entry;

    entry = OverlayEntry(
      builder: (_) => Stack(
        children: [
          // tap outside to close
          GestureDetector(
            onTap: () => entry.remove(),
            behavior: HitTestBehavior.translucent,
            child: SizedBox(
              width: overlayBox.size.width,
              height: overlayBox.size.height,
            ),
          ),
          Positioned(
            left: position.dx,
            top: position.dy,
            child: Material(
              color: Colors.transparent,
              child: _buildSortMenuContent(entry),
            ),
          ),
        ],
      ),
    );

    Overlay.of(context).insert(entry);
  }

  Widget _buildSortMenuContent(OverlayEntry entry) {
    return Container(
      width: 163,
      height: 142,
      decoration: BoxDecoration(
        color: const Color(0xFFE8D7AA),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.black, width: 1),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Sort by',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 6),
          _buildCustomMenuRow('Month', entry),
          _buildCustomMenuRow('Date Modified', entry),
          const Divider(height: 14, thickness: 1),
          _buildCustomMenuRow('New to old', entry, isOrder: true),
          _buildCustomMenuRow('Old to new', entry, isOrder: true),
        ],
      ),
    );
  }

  Widget _buildCustomMenuRow(
      String label, OverlayEntry entry, {bool isOrder = false}) {
    final bool selected = isOrder
        ? _sortOrder == label
        : _sortField == label ||
            (_sortField == 'Month' && label == 'Month');

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        setState(() {
          if (isOrder) {
            _sortOrder = label;
          } else {
            _sortField = label;
          }
        });
        entry.remove();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          children: [
            SizedBox(
              width: 18,
              child: selected
                  ? const Icon(
                      Icons.check,
                      size: 18,
                      color: Colors.black,
                    )
                  : const SizedBox.shrink(),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: Colors.black,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final String sortLabel =
        _sortField == 'Month' ? 'Sort by month' : 'Sort by date modified';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.white,
        elevation: 0,
        toolbarHeight: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(left: 20, top: 30.0, right: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Wallet",
                style: TextStyle(
                  fontStyle: FontStyle.italic,
                  fontFamily: 'Times New Roman',
                  fontSize: 32,
                  fontWeight: FontWeight.w300,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 12),
              GestureDetector(
                key: _sortKey,
                onTap: _showCustomSortMenu,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      sortLabel,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Image.asset(
                      'assets/Icons/dropdown.png',
                      width: 16,
                      height: 16,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: GridView.builder(
                  itemCount: _months.length,
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 150.74 / 128.13,
                  ),
                  itemBuilder: (context, index) {
                    final name = _months[index];
                    return GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                                WalletMonthScreen(month: name),
                          ),
                        );
                      },
                      child: SizedBox(
                        width: 150.74,
                        height: 128.13,
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: const [
                              BoxShadow(
                                color: Colors.black12,
                                blurRadius: 3,
                                offset: Offset(0, 1),
                              ),
                            ],
                          ),
                          child: Stack(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(0),
                                child: Image.asset(
                                  'assets/Icons/wallet_folder.png',
                                  width: 150.74,
                                  height: 128.13,
                                  fit: BoxFit.cover,
                                ),
                              ),
                              Positioned(
                                left: 7,
                                bottom: 7,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.transparent,
                                    border: Border.all(
                                        color: Colors.black, width: 1),
                                    borderRadius: BorderRadius.circular(5),
                                  ),
                                  child: Text(
                                    name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      color: Colors.black,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

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
}
