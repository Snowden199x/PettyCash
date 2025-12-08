import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'profile_screen.dart';
import '../LogIn/log_in_screen.dart';

class HomeScreen extends StatefulWidget {
  final String orgName;
  final int orgId;

  const HomeScreen({
    super.key,
    this.orgName = 'Organization',
    this.orgId = 0,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  late String currentDate;

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
  }

  void _updateDate() {
    final now = DateTime.now();
    currentDate = DateFormat('EEEE, MMMM d').format(now);
  }

  void _onMenuSelected(String value) {
    if (value == 'profile') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const ProfileScreen()),
      );
    } else if (value == 'logout') {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (Route<dynamic> route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // limit greeting width to avoid hitting the avatar
    final double greetingMaxWidth =
        MediaQuery.of(context).size.width -
            16 /*padding left*/ -
            16 /*padding right*/ -
            60 /*approx avatar+menu width*/;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Greeting + date
                  SizedBox(
                    width: greetingMaxWidth,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Hello, ${widget.orgName}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
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
                  ),
                  // Profile menu
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

              // Overview card
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

              // Transaction history title
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

              // Empty transaction state
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

              const SizedBox(height: 80),

              // Wallets Overview title (left aligned)
              const Text(
                'Wallets Overview',
                style: TextStyle(
                  fontFamily: 'Poppins',
                  fontStyle: FontStyle.italic,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),

              const SizedBox(height: 40),

              // Empty wallets state (centered, same style as transaction empty state)
              Center(
                child: Column(
                  children: [
                    Image.asset(
                      'assets/Icons/navigation_icons/nav_wallet.png',
                      height: 61,
                      width: 61,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'No wallets yet',
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Create your first wallet to start tracking your finances',
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
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
          ),
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
