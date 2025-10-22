  import 'package:flutter/material.dart';
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
    final int _selectedIndex = 0; // 0 = Home

    void _onItemTapped(int index) {
      if (index == _selectedIndex) return; // Prevent reloading same tab

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
                            fontStyle: FontStyle.italic,
                            fontWeight: FontWeight.w500,
                            fontSize: 22,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Thursday, September 11',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.black87,
                          ),
                        ),
                      ],
                    ),
                    const Icon(Icons.notifications_none_rounded, size: 28),
                  ],
                ),

                const SizedBox(height: 20),

                // OVERVIEW BOX
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3E0C8),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.black),
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
                      const SizedBox(height: 10),
                      GridView.count(
                        crossAxisCount: 2,
                        mainAxisSpacing: 8,
                        crossAxisSpacing: 8,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: const [
                          _OverviewCard(title: 'Balance:', amount: 'PHP 30,000'),
                          _OverviewCard(title: 'CCS Week:', amount: 'PHP 30,000'),
                          _OverviewCard(title: 'IT Days:', amount: 'PHP 30,000'),
                          _OverviewCard(title: "Teacher's Day:", amount: 'PHP 30,000'),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // TRANSACTION HISTORY PREVIEW
                const Text(
                  'Transaction History',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                _buildTransactionItem(
                  "FEB FAIR",
                  "(24) Number of Customers",
                  "PHP 250",
                  "Sept 8, 2025",
                ),
                _buildTransactionItem(
                  "CCS WEEK",
                  "(13) Number of Customers",
                  "-PHP 250",
                  "Sept 8, 2025",
                ),
                _buildTransactionItem(
                  "CCS WEEK",
                  "(24) Number of Customers",
                  "PHP 250",
                  "Sept 8, 2025",
                ),
              ],
            ),
          ),
        ),

        // FLOATING BUTTON
        floatingActionButton: FloatingActionButton(
          onPressed: () {},
          backgroundColor: Colors.blueGrey[800],
          child: const Icon(Icons.add),
        ),
        floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,

        // BOTTOM NAV BAR
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
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
          ],
        ),
      );
    }

    Widget _buildTransactionItem(String title, String desc, String amount, String date) {
      return Container(
        margin: const EdgeInsets.symmetric(vertical: 5),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.black, width: 1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: ListTile(
          title: Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          subtitle: Text(desc),
          trailing: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                amount,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(
                date,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }
  }

  class _OverviewCard extends StatelessWidget {
    final String title;
    final String amount;

    const _OverviewCard({required this.title, required this.amount});

    @override
    Widget build(BuildContext context) {
      return Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF3E0C8),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.black),
        ),
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              amount,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ],
        ),
      );
    }
  }
