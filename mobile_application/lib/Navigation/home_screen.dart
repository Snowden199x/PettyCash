import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'profile_screen.dart';
import '../LogIn/log_in_screen.dart';
import '../api_client.dart';

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
  Map<String, dynamic> _dashboardData = {};
  String? _profilePhotoUrl;

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
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    try {
      final apiClient = ApiClient();
      final data = await apiClient.getJson('/pres/api/dashboard/full');
      setState(() {
        _dashboardData = data;
      });
      await _loadProfilePhoto();
    } catch (e) {
      // Handle error silently
    }
  }

  Future<void> _loadProfilePhoto() async {
    try {
      final apiClient = ApiClient();
      final data = await apiClient.getJson('/pres/api/profile');
      if (mounted && data['profile_photo_url'] != null) {
        setState(() {
          _profilePhotoUrl = data['profile_photo_url'];
        });
      }
    } catch (e) {
      // Handle error silently
    }
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
        child: RefreshIndicator(
          onRefresh: () async {
            _updateDate();
            await _loadDashboard();
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
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
                    child: CircleAvatar(
                      radius: 18,
                      backgroundColor: const Color(0xFFD9D9D9),
                      backgroundImage: _profilePhotoUrl != null
                          ? NetworkImage(_profilePhotoUrl!)
                          : null,
                      child: _profilePhotoUrl == null
                          ? const Icon(
                              Icons.person,
                              size: 18,
                              color: Colors.white70,
                            )
                          : null,
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
                          children: [
                            _OverviewCard(
                              title: 'Balance:',
                              subtitle: '',
                              amount: _formatAmount(_dashboardData['summary']?['total_balance']),
                            ),
                            _OverviewCard(
                              title: 'Income this month:',
                              subtitle: '',
                              amount: _formatAmount(_dashboardData['summary']?['income_month']),
                            ),
                            _OverviewCard(
                              title: 'Expense this month:',
                              subtitle: '',
                              amount: _formatAmount(_dashboardData['summary']?['expenses_month']),
                            ),
                            _OverviewCard(
                              title: "Reports submitted:",
                              subtitle: '',
                              amount: '${_dashboardData['summary']?['reports_submitted'] ?? 0}',
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

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

              const SizedBox(height: 12),

              if (_dashboardData['wallets']?.isNotEmpty ?? false) ...[
                ...(_dashboardData['wallets'] as List).take(3).map((w) => 
                  _WalletCard(wallet: w)
                ),
              ] else ...[
                const SizedBox(height: 28),
                // Empty wallets state
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

              const SizedBox(height: 80),

              // Recent transactions
              if (_dashboardData['recent_transactions']?.isNotEmpty ?? false) ...[
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
                const SizedBox(height: 12),
                ...(_dashboardData['recent_transactions'] as List).take(5).map((tx) => 
                  _TransactionCard(transaction: tx)
                ),
              ] else ...[
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
              ],
            ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatAmount(dynamic value) {
    if (value == null) return 'PHP 0.00';
    final amount = value is num ? value : double.tryParse(value.toString()) ?? 0;
    return 'PHP ${amount.toStringAsFixed(2).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}'; 
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

class _TransactionCard extends StatelessWidget {
  final Map<String, dynamic> transaction;

  const _TransactionCard({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final isIncome = transaction['type'] == 'income';
    final amount = (transaction['total_amount'] ?? 0).toDouble();
    
    // Build display text like web: "Php X x Y - income_type/particulars - description"
    final parts = <String>[];
    final price = (transaction['price'] ?? 0).toDouble();
    final quantity = transaction['quantity'] ?? 0;
    parts.add('Php ${price.toStringAsFixed(0)} x $quantity');
    
    if (isIncome && transaction['income_type'] != null && transaction['income_type'].toString().isNotEmpty) {
      parts.add(transaction['income_type']);
    } else if (!isIncome && transaction['particulars'] != null && transaction['particulars'].toString().isNotEmpty) {
      parts.add(transaction['particulars']);
    }
    
    if (transaction['description'] != null && transaction['description'].toString().isNotEmpty) {
      parts.add(transaction['description']);
    }
    
    final description = parts.join(' - ');
    final walletName = (transaction['wallet_name'] ?? '').toString().toUpperCase();
    final amountColor = isIncome ? const Color(0xFF2E7D32) : const Color(0xFFC62828);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFECDDC6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            walletName,
            style: const TextStyle(
              fontFamily: 'Poppins',
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: Text(
                  description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 12,
                    color: Colors.black87,
                  ),
                ),
              ),
              Text(
                '${isIncome ? '' : '-'}PHP ${amount.toStringAsFixed(0)}',
                style: TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: amountColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _WalletCard extends StatelessWidget {
  final Map<String, dynamic> wallet;

  const _WalletCard({required this.wallet});

  @override
  Widget build(BuildContext context) {
    final budget = (wallet['budget'] ?? 0).toDouble();
    final income = (wallet['total_income'] ?? 0).toDouble();
    final expenses = (wallet['total_expenses'] ?? 0).toDouble();
    final balance = budget + income - expenses;
    final totalAvailable = budget + income;
    final progress = totalAvailable > 0 ? (expenses / totalAvailable).clamp(0.0, 1.0) : 0.0;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFECDDC6)),
      ),
      child: Row(
        children: [
          Image.asset(
            'assets/Icons/wallet_folder.png',
            width: 48,
            height: 48,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  wallet['name'] ?? '',
                  style: const TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    backgroundColor: const Color(0xFFE0E0E0),
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFF3D58D)),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Balance:',
                      style: const TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.black87,
                      ),
                    ),
                    Text(
                      'PHP ${balance.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
