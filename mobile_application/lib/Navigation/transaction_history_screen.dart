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
  String _currentFilter = 'income';
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
      final data = await ApiClient().getJsonList('/pres/api/transactions/recent');
      
      if (mounted) {
        setState(() {
          _allTransactions = data.map((tx) {
            final qty = int.tryParse(tx['quantity']?.toString() ?? '0') ?? 0;
            final price = double.tryParse(tx['price']?.toString() ?? '0') ?? 0.0;
            final amount = double.tryParse(tx['total_amount']?.toString() ?? '0') ?? (qty * price);
            
            DateTime? dateObj;
            if (tx['date'] != null) {
              dateObj = DateTime.tryParse(tx['date']);
            }
            
            return {
              'id': tx['id'],
              'walletName': tx['wallet_name'] ?? 'Wallet',
              'quantity': qty,
              'price': price,
              'incometype': tx['income_type'] ?? '',
              'particulars': tx['particulars'] ?? '',
              'rawdescription': tx['description'] ?? '',
              'type': tx['type'],
              'amount': tx['type'] == 'expense' ? -amount : amount,
              'date': tx['date'],
              '_dateObj': dateObj,
            };
          }).toList();
          
          _allTransactions.sort((a, b) {
            final dateA = a['_dateObj'] as DateTime?;
            final dateB = b['_dateObj'] as DateTime?;
            if (dateA == null || dateB == null) return 0;
            return dateB.compareTo(dateA);
          });
          
          _loaded = true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loaded = true);
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
    
    var filtered = _allTransactions.where((tx) {
      final dateObj = tx['_dateObj'] as DateTime?;
      if (dateObj == null) return false;
      return dateObj.year == targetYear && dateObj.month == targetMonth;
    }).toList();
    
    if (_currentFilter != 'all') {
      filtered = filtered.where((tx) => tx['type'] == _currentFilter).toList();
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
                      onPressed: () => setState(() => _currentFilter = 'income'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _currentFilter == 'income' ? const Color(0xFFFFE4B5) : Colors.white,
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
                      onPressed: () => setState(() => _currentFilter = 'expense'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _currentFilter == 'expense' ? const Color(0xFFFFE4B5) : Colors.white,
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
                                physics: const AlwaysScrollableScrollPhysics(),
                                itemCount: _filteredTransactions.length,
                                itemBuilder: (context, index) {
                                  final tx = _filteredTransactions[index];
                                  final qty = tx['quantity'] as int;
                                  final price = tx['price'] as double;
                                  final total = qty * price;
                                  final isIncome = tx['type'] == 'income';
                                  
                                  String labelCore;
                                  if (isIncome) {
                                    labelCore = '${price.toStringAsFixed(0)} x $qty (${total.toStringAsFixed(0)}) - ${tx['incometype']}';
                                  } else {
                                    labelCore = '$qty x ${price.toStringAsFixed(0)} (${total.toStringAsFixed(0)}) - ${tx['particulars']}';
                                  }
                                  
                                  final mainLabel = tx['rawdescription'].isNotEmpty 
                                      ? '$labelCore - ${tx['rawdescription']}'
                                      : labelCore;
                                  
                                  final amountNum = (tx['amount'] as double);
                                  final amountDisplay = amountNum < 0 
                                      ? '-PHP ${amountNum.abs().toStringAsFixed(0)}'
                                      : 'PHP ${amountNum.toStringAsFixed(0)}';
                                  
                                  final dateObj = tx['_dateObj'] as DateTime?;
                                  final dateText = dateObj != null 
                                      ? DateFormat('yyyy-MM-dd').format(dateObj)
                                      : tx['date'] ?? '';
                                  
                                  final title = (tx['walletName'] as String).toUpperCase();
                                  final amountColor = isIncome ? const Color(0xFF2E7D32) : const Color(0xFFC62828);
                                  
                                  return TransactionHistoryCard(
                                    title: title,
                                    mainLabel: mainLabel,
                                    amountDisplay: amountDisplay,
                                    amountColor: amountColor,
                                    dateText: dateText,
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

class TransactionHistoryCard extends StatefulWidget {
  final String title;
  final String mainLabel;
  final String amountDisplay;
  final Color amountColor;
  final String dateText;

  const TransactionHistoryCard({
    super.key,
    required this.title,
    required this.mainLabel,
    required this.amountDisplay,
    required this.amountColor,
    required this.dateText,
  });

  @override
  State<TransactionHistoryCard> createState() => _TransactionHistoryCardState();
}

class _TransactionHistoryCardState extends State<TransactionHistoryCard> {
  final GlobalKey _menuKey = GlobalKey();

  void _showMenu() {
    final ctx = _menuKey.currentContext;
    if (ctx == null) return;

    final renderBox = ctx.findRenderObject() as RenderBox;
    final overlay = Overlay.of(context);
    final overlayBox = overlay.context.findRenderObject() as RenderBox;
    final position = renderBox.localToGlobal(Offset.zero, ancestor: overlayBox);

    late OverlayEntry entry;
    entry = OverlayEntry(
      builder: (_) => Stack(
        children: [
          GestureDetector(
            onTap: () => entry.remove(),
            behavior: HitTestBehavior.translucent,
            child: Container(color: Colors.transparent),
          ),
          Positioned(
            left: position.dx - 80,
            top: position.dy + renderBox.size.height,
            child: Material(
              color: Colors.transparent,
              child: Container(
                width: 100,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.black, width: 1),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    InkWell(
                      onTap: () {
                        entry.remove();
                        // todo: Implement edit
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                        child: const Row(
                          children: [
                            Icon(Icons.edit, size: 16),
                            SizedBox(width: 8),
                            Text('Edit', style: TextStyle(fontFamily: 'Poppins', fontSize: 13)),
                          ],
                        ),
                      ),
                    ),
                    const Divider(height: 1),
                    InkWell(
                      onTap: () {
                        entry.remove();
                        // todo: Implement delete
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                        child: const Row(
                          children: [
                            Icon(Icons.delete, size: 16, color: Colors.red),
                            SizedBox(width: 8),
                            Text('Delete', style: TextStyle(fontFamily: 'Poppins', fontSize: 13, color: Colors.red)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
    overlay.insert(entry);
  }

  @override
  Widget build(BuildContext context) {
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
            widget.title,
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
                  widget.mainLabel,
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
                widget.amountDisplay,
                style: TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: widget.amountColor,
                ),
              ),
              const SizedBox(width: 4),
              GestureDetector(
                key: _menuKey,
                onTap: _showMenu,
                child: const Icon(
                  Icons.more_vert,
                  size: 18,
                  color: Colors.black54,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            widget.dateText,
            style: const TextStyle(
              fontFamily: 'Poppins',
              fontSize: 11,
              color: Colors.black54,
            ),
          ),
        ],
      ),
    );
  }
}
