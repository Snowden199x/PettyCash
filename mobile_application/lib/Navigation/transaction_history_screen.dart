import 'package:flutter/material.dart';
import 'home_screen.dart';
import 'wallet_screen.dart';
import 'profile_screen.dart';
import 'package:intl/intl.dart';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({super.key});

  @override
  State<TransactionHistoryScreen> createState() =>
      _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  final int _selectedIndex = 1; // Highlight History
  DateTime _selectedDate = DateTime(2025, 2); // Default month
  bool isIncomeSelected = true;

  void _onItemTapped(int index) {
    if (index == _selectedIndex) return;

    switch (index) {
      case 0:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
              builder: (context) => const HomeScreen(orgName: "Organization")),
        );
        break;
      case 1:
        // Already in History
        break;
      case 2:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const WalletScreen()),
        );
        break;
      case 3:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const ProfileScreen()),
        );
        break;
    }
  }

  void _changeMonth(int offset) {
    setState(() {
      _selectedDate = DateTime(
        _selectedDate.year,
        _selectedDate.month + offset,
      );
    });
  }

  String get formattedMonthYear => DateFormat.yMMMM().format(_selectedDate);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,

      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Transaction History',
          style: TextStyle(
            fontStyle: FontStyle.italic,
            fontFamily: 'Times New Roman',
            color: Colors.black,
            fontSize: 22,
          ),
        ),
      ),

      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
        child: Column(
          children: [
            // Month Selector
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () => _changeMonth(-1),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.black),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    formattedMonthYear,
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () => _changeMonth(1),
                ),
              ],
            ),

            const SizedBox(height: 15),

            // Income / Expense Toggle
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => setState(() => isIncomeSelected = true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isIncomeSelected
                          ? const Color(0xFFFFE4B5)
                          : Colors.white,
                      foregroundColor: Colors.black,
                      side: const BorderSide(color: Colors.black),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    child: const Text('Income'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => setState(() => isIncomeSelected = false),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: !isIncomeSelected
                          ? const Color(0xFFFFE4B5)
                          : Colors.white,
                      foregroundColor: Colors.black,
                      side: const BorderSide(color: Colors.black),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    child: const Text('Expense'),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Transaction List
            Expanded(
              child: ListView(
                children: isIncomeSelected
                    ? [
                        _buildTransactionCard(
                          title: "FEB FAIR",
                          desc: "(24) Number of Customers",
                          amount: "PHP 852",
                          date: "February 14, 2025",
                        ),
                        _buildTransactionCard(
                          title: "FEB FAIR",
                          desc: "(24) Number of Customers",
                          amount: "PHP 515",
                          date: "February 12, 2025",
                        ),
                      ]
                    : [
                        _buildTransactionCard(
                          title: "FEB FAIR",
                          desc: "(1 set) Bracelet Locks",
                          amount: "-PHP 73",
                          date: "February 9, 2025",
                        ),
                        _buildTransactionCard(
                          title: "FEB FAIR",
                          desc: "(1 roll) Kwad",
                          amount: "-PHP 100",
                          date: "February 9, 2025",
                        ),
                        _buildTransactionCard(
                          title: "FEB FAIR",
                          desc: "(N/A) Print",
                          amount: "-PHP 65",
                          date: "February 9, 2025",
                        ),
                      ],
              ),
            ),
          ],
        ),
      ),

      // Floating Action Button
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: const Color(0xFF7A4F22),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,

      // Bottom Navigation Bar
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

  // Reusable Transaction Card
  Widget _buildTransactionCard({
    required String title,
    required String desc,
    required String amount,
    required String date,
  }) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 5),
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Left
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
            // Right
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  amount,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: amount.startsWith('-')
                        ? Colors.red
                        : const Color(0xFF7A4F22),
                  ),
                ),
                Text(
                  date,
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
