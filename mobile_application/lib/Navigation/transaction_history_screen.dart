import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api_client.dart';

class TransactionHistoryScreen extends StatefulWidget {
  final String orgName;
  final int orgId;

  const TransactionHistoryScreen({
    super.key,
    this.orgName = 'Organization',
    this.orgId = 0,
  });

  @override
  State<TransactionHistoryScreen> createState() =>
      _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  DateTime _currentMonth = DateTime.now();
  String _currentFilter = 'Income';
  List<Map<String, dynamic>> _allTransactions = [];
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _loadTransactions();
  }

  Future<void> _loadTransactions() async {
    setState(() => _loaded = false);
    try {
      // Fetch all transactions from backend API - same endpoint as web
      final apiClient = ApiClient();
      
      debugPrint('=== TRANSACTION HISTORY DEBUG ===');
      debugPrint('Fetching from: /pres/api/transactions/recent');
      
      final data = await apiClient.getJsonList('/pres/api/transactions/recent');
      
      debugPrint('Total transactions from API: ${data.length}');
      if (data.isEmpty) {
        debugPrint('WARNING: No transactions returned. Check if user is logged in.');
      }
      
      if (mounted) {
        setState(() {
          // Map API response to transaction objects - convert List<dynamic> properly
          final List<dynamic> dynamicList = data is List ? data : [];
          _allTransactions = dynamicList.map<Map<String, dynamic>>((tx) {
            final txMap = tx as Map<String, dynamic>;
            final qty = int.tryParse(txMap['quantity']?.toString() ?? '0') ?? 0;
            final price = double.tryParse(txMap['price']?.toString() ?? '0') ?? 0.0;
            final totalAmount = txMap['total_amount'] != null 
                ? (txMap['total_amount'] as num).toDouble()
                : qty * price;
            
            DateTime? dateObj;
            if (txMap['date'] != null) {
              try {
                dateObj = DateTime.parse(txMap['date']);
              } catch (e) {
                dateObj = null;
              }
            }
            
            // API returns 'kind' field with 'income' or 'expense'
            final kind = (txMap['kind'] ?? txMap['type'] ?? 'expense').toString().toLowerCase();
            final type = kind == 'income' ? 'Income' : 'Expense';
            final amount = kind == 'expense' ? -totalAmount : totalAmount;
            
            return {
              'id': txMap['id'],
              'walletName': txMap['wallet_name'] ?? 'Wallet',
              'quantity': qty,
              'price': price,
              'incometype': txMap['income_type'] ?? '',
              'particulars': txMap['particulars'] ?? '',
              'rawdescription': txMap['description'] ?? '',
              'type': type,
              'amount': amount,
              'date': txMap['date'],
              '_dateObj': dateObj,
            };
          }).toList();
          
          // Sort by date - newest first
          _allTransactions.sort((a, b) {
            final dateA = a['_dateObj'] as DateTime?;
            final dateB = b['_dateObj'] as DateTime?;
            if (dateA == null || dateB == null) return 0;
            return dateB.compareTo(dateA);
          });
          
          _loaded = true;
          
          debugPrint('Mapped transactions: ${_allTransactions.length}');
          if (_allTransactions.isNotEmpty) {
            debugPrint('Sample transaction: ${_allTransactions.first}');
          }
        });
      }
    } catch (e) {
      debugPrint('Error loading transactions: $e');
      if (mounted) {
        setState(() {
          _allTransactions = [];
          _loaded = true;
        });
      }
    }
  }

  String get _formattedMonth => DateFormat.yMMMM().format(_currentMonth);

  void _changeMonth(int offset) {
    setState(() {
      _currentMonth = DateTime(
        _currentMonth.year,
        _currentMonth.month + offset,
      );
    });
  }

  List<Map<String, dynamic>> get _filteredTransactions {
    if (!_loaded) return [];
    
    final targetYear = _currentMonth.year;
    final targetMonth = _currentMonth.month;
    
    debugPrint('=== FILTERING ===');
    debugPrint('Target: $targetYear-$targetMonth, Filter: $_currentFilter');
    debugPrint('All transactions: ${_allTransactions.length}');
    
    var filtered = _allTransactions.where((tx) {
      final dateObj = tx['_dateObj'] as DateTime?;
      if (dateObj == null) return false;
      return dateObj.year == targetYear && dateObj.month == targetMonth;
    }).toList();
    
    debugPrint('After month filter: ${filtered.length}');
    
    if (_currentFilter != 'all') {
      filtered = filtered.where((tx) => tx['type'] == _currentFilter).toList();
      debugPrint('After type filter: ${filtered.length}');
    }
    
    filtered.sort((a, b) {
      final dateA = a['_dateObj'] as DateTime?;
      final dateB = b['_dateObj'] as DateTime?;
      if (dateA == null || dateB == null) return 0;
      return dateB.compareTo(dateA);
    });
    
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
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
                'Transaction History',
                style: TextStyle(
                  fontStyle: FontStyle.italic,
                  fontFamily: 'Times New Roman',
                  fontSize: 32,
                  fontWeight: FontWeight.w300,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left),
                    onPressed: () => _changeMonth(-1),
                  ),
                  GestureDetector(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _currentMonth,
                        firstDate: DateTime(2000),
                        lastDate: DateTime(2100),
                      );
                      if (picked != null) {
                        setState(() => _currentMonth = picked);
                      }
                    },
                    child: Container(
                      width: 160,
                      height: 36,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.black),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        _formattedMonth,
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right),
                    onPressed: () => _changeMonth(1),
                  ),
                ],
              ),
              const SizedBox(height: 15),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => setState(() => _currentFilter = 'Income'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _currentFilter == 'Income' ? const Color(0xFFFFE4B5) : Colors.white,
                        foregroundColor: Colors.black,
                        side: const BorderSide(color: Colors.black),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      child: const Text('Income'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => setState(() => _currentFilter = 'Expense'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _currentFilter == 'Expense' ? const Color(0xFFFFE4B5) : Colors.white,
                        foregroundColor: Colors.black,
                        side: const BorderSide(color: Colors.black),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      child: const Text('Expense'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Expanded(
                child: !_loaded
                    ? const Center(child: CircularProgressIndicator())
                    : RefreshIndicator(
                        onRefresh: _loadTransactions,
                        child: _filteredTransactions.isEmpty
                            ? ListView(
                                physics: const AlwaysScrollableScrollPhysics(),
                                children: [
                                  const SizedBox(height: 50),
                                  Center(
                                    child: Column(
                                      children: [
                                        Image.asset('assets/Icons/navigation_icons/nav_history.png', height: 61, width: 61),
                                        const SizedBox(height: 16),
                                        const Text('No transactions found', style: TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w600, fontSize: 14)),
                                        const SizedBox(height: 4),
                                        const Text('There are no transactions for the selected month and filter.', textAlign: TextAlign.center, style: TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w400, fontSize: 12, color: Colors.black54)),
                                      ],
                                    ),
                                  ),
                                ],
                              )
                            : ListView.builder(
                                padding: const EdgeInsets.only(bottom: 100, top: 0),
                                itemCount: _filteredTransactions.length,
                                itemBuilder: (context, index) {
                                  final tx = _filteredTransactions[index];
                                  final String topLine = (tx['walletName'] as String).toUpperCase();
                                  final String details = tx['incometype'].toString().isNotEmpty ? tx['incometype'] : tx['particulars'];
                                  final String middleLine = '${tx['quantity']} x ${(tx['price'] as double).toStringAsFixed(0)} - $details';
                                  final Color amountColor = tx['type'] == 'Expense' ? const Color(0xFFC62828) : const Color(0xFF2E7D32);
                                  
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
                                          topLine,
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
                                                middleLine,
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
                                              '${tx['type'] == 'Expense' ? '-' : ''}PHP ${(tx['amount'] as double).abs().toStringAsFixed(0)}',
                                              style: TextStyle(
                                                fontFamily: 'Poppins',
                                                fontSize: 13,
                                                fontWeight: FontWeight.w700,
                                                color: amountColor,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          tx['date'] ?? '',
                                          style: const TextStyle(
                                            fontFamily: 'Poppins',
                                            fontSize: 11,
                                            color: Colors.black54,
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


