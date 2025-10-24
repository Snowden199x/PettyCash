import 'package:flutter/material.dart';
import 'package:intl/intl.dart'; // ✅ For formatting date
import 'transaction_history_screen.dart';
import 'wallet_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  final String orgName;

  const HomeScreen({super.key, required this.orgName});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final int _selectedIndex = 0;

  late String currentDate; // ✅ Holds the formatted date

  @override
  void initState() {
    super.initState();
    _updateDate(); // initialize date
  }

  void _updateDate() {
    final now = DateTime.now();
    currentDate = DateFormat('EEEE, MMMM d').format(now); // Example: Thursday, October 25
  }

  void _onItemTapped(int index) {
    if (index == _selectedIndex) return;

    Widget nextScreen;
    switch (index) {
      case 0:
        nextScreen = HomeScreen(orgName: widget.orgName);
        break;
      case 1:
        nextScreen = TransactionHistoryScreen();
        break;
      case 2:
        nextScreen = WalletScreen();
        break;
      case 3:
        nextScreen = ProfileScreen();
        break;
      default:
        return;
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => nextScreen),
    );
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
                        currentDate, // ✅ Now updates automatically
                        style: const TextStyle(
                          fontFamily: 'Poppins',
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                  const Icon(Icons.notifications_none_rounded, size: 28),
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
                      colors: [
                        Color(0xFFFFFFFF),
                        Color(0xFFECDDC6),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.black),
                    boxShadow: [
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

              _buildTransactionItem(
                "EVENT",
                "Particulars",
                "Description",
                "PHP 00.00",
                "Date",
              ),
              _buildTransactionItem(
                "EVENT",
                "Particulars",
                "Description",
                "PHP 00.00",
                "Date",
              ),
              _buildTransactionItem(
                "EVENT",
                "Particulars",
                "Description",
                "PHP 00.00",
                "Date",
              ),
            ],
          ),
        ),
      ),

      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: Colors.blueGrey[800],
        child: const Icon(Icons.add),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,

      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: const Color(0xFF7A4F22),
        unselectedItemColor: Colors.black54,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet_outlined),
            label: 'Wallets',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionItem(
    String title,
    String line1,
    String line2,
    String amount,
    String date,
  ) {
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
          // Left column (Title + details)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                line1,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                line2,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.black87,
                ),
              ),
            ],
          ),

          // Right column (Amount + date)
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                amount,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                date,
                style: const TextStyle(
                  fontSize: 11,
                  color: Colors.grey,
                ),
              ),
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