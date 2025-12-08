import 'dart:io';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:open_file/open_file.dart';
import 'wallet_month_db_helper.dart';
import '../api_client.dart';

enum ActivePopup {
  none,
  income,
  expense,
  receipt,
  reportDetails,
  reportConfirm,
}

class WalletMonthScreen extends StatefulWidget {
  final String month;
  final int folderId;

  const WalletMonthScreen({super.key, required this.month, required this.folderId});

  @override
  State<WalletMonthScreen> createState() => WalletMonthScreenState();
}

class WalletMonthScreenState extends State<WalletMonthScreen> {
  // Sort state
  String sortFilter = 'All';
  final GlobalKey sortKey = GlobalKey();

  // Add menu + popup state
  bool showAddMenu = false;
  ActivePopup activePopup = ActivePopup.none;

  // Report actions (chips) state
  bool showReportActions = false;

  // Tabs: 0 Transaction, 1 Reports, 2 Receipts, 3 Archive
  int selectedTabIndex = 0;

  // Database-synced lists
  List<TransactionItem> transactions = [];
  List<ReceiptItem> receipts = [];
  bool _isLoadingData = false;

  // Controllers - Income
  final TextEditingController dateIssuedController = TextEditingController();
  final TextEditingController quantityController = TextEditingController();
  final TextEditingController descriptionController = TextEditingController();
  final TextEditingController priceController = TextEditingController();
  String? selectedIncomeType;

  final List<String> incomeTypes = const [
    'Income Generating Projects',
    'Registration Fee',
    'Membership Fee',
  ];

  // Controllers - Expense
  final TextEditingController expenseDateController = TextEditingController();
  final TextEditingController expenseQuantityController = TextEditingController();
  final TextEditingController expenseParticularsController = TextEditingController();
  final TextEditingController expenseDescriptionController = TextEditingController();
  final TextEditingController expensePriceController = TextEditingController();

  // Controllers - Receipt
  final TextEditingController receiptDescriptionController = TextEditingController();
  final TextEditingController receiptDateController = TextEditingController();
  final ImagePicker receiptPicker = ImagePicker();
  File? receiptImage;

  // Controllers - Report details
  final TextEditingController reportEventNameController = TextEditingController();
  final TextEditingController reportDatePreparedController = TextEditingController();
  final TextEditingController reportNumberController = TextEditingController(text: 'FR-001');
  final TextEditingController reportBudgetController = TextEditingController();
  final TextEditingController reportTotalIncomeController = TextEditingController();
  final TextEditingController reportTotalExpensesController = TextEditingController();
  final TextEditingController reportReimbursementController = TextEditingController();
  final TextEditingController reportPreviousFundController = TextEditingController();
  final TextEditingController reportBudgetInBankController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoadingData = true);
    try {
      await Future.wait([
        _loadTransactions(),
        _loadReceipts(),
      ]);
    } finally {
      if (mounted) setState(() => _isLoadingData = false);
    }
  }

  Future<void> _loadTransactions() async {
    try {
      final data = await WalletMonthDbHelper.loadTransactions(widget.folderId);
      if (mounted) {
        setState(() {
          transactions = data.map((e) {
            final kind = e['kind'] ?? 'expense';
            final type = kind == 'income' ? 'Income' : 'Expense';
            return TransactionItem(
              date: e['date_issued'] ?? e['date'] ?? '',
              monthLabel: widget.month,
              quantity: e['quantity'] ?? 0,
              price: (e['price'] ?? 0).toDouble(),
              description: e['description'] ?? '',
              details: e['particulars'] ?? e['incometype'] ?? e['income_type'] ?? '',
              totalAmount: (e['total_amount'] ?? 0).toDouble(),
              type: type,
            );
          }).toList();
        });
      }
    } catch (e) {
      debugPrint('Error loading transactions: $e');
    }
  }

  Future<void> _loadReceipts() async {
    try {
      final data = await WalletMonthDbHelper.loadReceipts(widget.folderId);
      if (mounted) {
        setState(() {
          receipts = data.map((e) => ReceiptItem(
            description: e['description'] ?? '',
            date: e['date'] ?? '',
            imagePath: e['image_url'] ?? '',
          )).toList();
        });
      }
    } catch (e) {
      debugPrint('Error loading receipts: $e');
    }
  }

  @override
  void dispose() {
    // Income
    dateIssuedController.dispose();
    quantityController.dispose();
    descriptionController.dispose();
    priceController.dispose();

    // Expense
    expenseDateController.dispose();
    expenseQuantityController.dispose();
    expenseParticularsController.dispose();
    expenseDescriptionController.dispose();
    expensePriceController.dispose();

    // Receipt
    receiptDescriptionController.dispose();
    receiptDateController.dispose();

    // Report
    reportEventNameController.dispose();
    reportDatePreparedController.dispose();
    reportNumberController.dispose();
    reportBudgetController.dispose();
    reportTotalIncomeController.dispose();
    reportTotalExpensesController.dispose();
    reportReimbursementController.dispose();
    reportPreviousFundController.dispose();
    reportBudgetInBankController.dispose();

    super.dispose();
  }

  // ---------- Helpers ----------

  Future<void> _pickDateInto(
    TextEditingController controller, {
    String pattern = 'yyyy-MM-dd',
  }) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() {
        controller.text = DateFormat(pattern).format(picked);
      });
    }
  }

  Widget _buildCancelButton(VoidCallback onTap) {
    return TextButton(
      onPressed: onTap,
      style: TextButton.styleFrom(
        minimumSize: const Size(70, 30),
        foregroundColor: Colors.black,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Colors.black),
        ),
      ),
      child: const Text(
        'Cancel',
        style: TextStyle(fontFamily: 'Poppins', fontSize: 12),
      ),
    );
  }

  Widget _buildPrimaryButton(String text, VoidCallback onTap,
      {Color color = const Color(0xFF8B3B08)}) {
    return TextButton(
      onPressed: onTap,
      style: TextButton.styleFrom(
        minimumSize: const Size(70, 30),
        backgroundColor: color,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      child: Text(
        text,
        style: const TextStyle(fontFamily: 'Poppins', fontSize: 12),
      ),
    );
  }

  // ---------- Sort menu ----------

  void showSortMenu() {
    final ctx = sortKey.currentContext;
    if (ctx == null) return;

    final renderObject = ctx.findRenderObject();
    if (renderObject is! RenderBox) return;
    final renderBox = renderObject;

    final overlay = Overlay.of(context);
    

    final overlayRenderObject = overlay.context.findRenderObject();
    if (overlayRenderObject is! RenderBox) return;
    final overlayBox = overlayRenderObject;

    final position =
        renderBox.localToGlobal(Offset.zero, ancestor: overlayBox);

    late OverlayEntry entry;

    entry = OverlayEntry(
      builder: (_) => Stack(
        children: [
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
            top: position.dy + renderBox.size.height + 4,
            child: Material(
              color: Colors.transparent,
              child: _buildSortMenuContent(entry),
            ),
          ),
        ],
      ),
    );

    overlay.insert(entry);
  }

  Widget _buildSortMenuContent(OverlayEntry entry) {
    return Container(
      width: 163,
      height: 130,
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
          _buildSortMenuRow('All', entry),
          _buildSortMenuRow('Expense', entry),
          _buildSortMenuRow('Income', entry),
        ],
      ),
    );
  }

  Widget _buildSortMenuRow(String label, OverlayEntry entry) {
    final bool selected = sortFilter == label;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        setState(() {
          sortFilter = label;
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
                  ? const Icon(Icons.check, size: 18, color: Colors.black)
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

  // ---------- Menu & popup state helpers ----------

  void toggleAddMenu() {
    setState(() {
      showAddMenu = !showAddMenu;
      activePopup = ActivePopup.none;
    });
  }

  void closeAllPopups() {
    setState(() {
      showAddMenu = false;
      activePopup = ActivePopup.none;
    });
  }

  void openPopup(ActivePopup popup) {
    setState(() {
      showAddMenu = false;
      activePopup = popup;
    });
  }

  bool get _anyPopupVisible => showAddMenu || activePopup != ActivePopup.none;

  // ---------- Transaction saving ----------

  Future<void> saveIncome() async {
    if (quantityController.text.isEmpty ||
        priceController.text.isEmpty ||
        selectedIncomeType == null) {
      return;
    }

    final int qty = int.tryParse(quantityController.text) ?? 0;
    final double price = double.tryParse(priceController.text) ?? 0;

    final String dateText = dateIssuedController.text.isEmpty
        ? DateFormat('yyyy-MM-dd').format(DateTime.now())
        : dateIssuedController.text;

    try {
      await WalletMonthDbHelper.saveIncome(
        widget.folderId,
        {
          'date': dateText,
          'quantity': qty,
          'income_type': selectedIncomeType!,
          'description': descriptionController.text,
          'price': price,
        },
      );

      await _loadTransactions();

      if (mounted) {
        setState(() {
          dateIssuedController.clear();
          quantityController.clear();
          descriptionController.clear();
          priceController.clear();
          selectedIncomeType = null;
          activePopup = ActivePopup.none;
        });
      }
    } catch (e) {
      debugPrint('Error saving income: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save income: $e')),
        );
      }
    }
  }

  Future<void> saveExpense() async {
    if (expenseQuantityController.text.isEmpty ||
        expensePriceController.text.isEmpty ||
        expenseParticularsController.text.isEmpty) {
      return;
    }

    final int qty = int.tryParse(expenseQuantityController.text) ?? 0;
    final double price = double.tryParse(expensePriceController.text) ?? 0;

    final String dateText = expenseDateController.text.isEmpty
        ? DateFormat('yyyy-MM-dd').format(DateTime.now())
        : expenseDateController.text;

    try {
      await WalletMonthDbHelper.saveExpense(
        widget.folderId,
        {
          'date': dateText,
          'quantity': qty,
          'particulars': expenseParticularsController.text,
          'description': expenseDescriptionController.text,
          'price': price,
        },
      );

      await _loadTransactions();

      if (mounted) {
        setState(() {
          expenseDateController.clear();
          expenseQuantityController.clear();
          expenseParticularsController.clear();
          expenseDescriptionController.clear();
          expensePriceController.clear();
          activePopup = ActivePopup.none;
        });
      }
    } catch (e) {
      debugPrint('Error saving expense: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save expense: $e')),
        );
      }
    }
  }

  Future<void> pickReceiptImage() async {
    final XFile? picked =
        await receiptPicker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;
    setState(() {
      receiptImage = File(picked.path);
    });
  }

  Future<void> saveReceipt() async {
    if (receiptDescriptionController.text.isEmpty ||
        receiptDateController.text.isEmpty ||
        receiptImage == null) {
      return;
    }

    try {
      await WalletMonthDbHelper.uploadReceipt(
        widget.folderId,
        receiptImage!,
        receiptDescriptionController.text,
        receiptDateController.text,
      );

      await _loadReceipts();

      if (mounted) {
        setState(() {
          receiptDescriptionController.clear();
          receiptDateController.clear();
          receiptImage = null;
          activePopup = ActivePopup.none;
        });
      }
    } catch (e) {
      debugPrint('Error saving receipt: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save receipt: $e')),
        );
      }
    }
  }

  List<TransactionItem> get filteredTransactions {
    if (sortFilter == 'All') return transactions;
    if (sortFilter == 'Income') {
      return transactions.where((t) => t.type == 'Income').toList();
    }
    if (sortFilter == 'Expense') {
      return transactions.where((t) => t.type == 'Expense').toList();
    }
    return transactions;
  }

  // ---------- Build ----------

  @override
  Widget build(BuildContext context) {
    final String sortLabel = 'Sort by $sortFilter';
    final double keyboardInset = MediaQuery.of(context).viewInsets.bottom;

    return Scaffold(
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: false,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.white,
        elevation: 0,
        toolbarHeight: 0,
      ),
      body: Stack(
        children: [
          // Main content
          SafeArea(
            child: Padding(
              padding:
                  const EdgeInsets.only(left: 20, top: 30.0, right: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Month text
                  Text(
                    widget.month,
                    style: const TextStyle(
                      fontStyle: FontStyle.italic,
                      fontFamily: 'PlayfairDisplay',
                      fontSize: 32,
                      fontWeight: FontWeight.w300,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Segmented tabs
                  Container(
                    height: 34,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF6F2E8),
                      borderRadius: BorderRadius.circular(5),
                    ),
                    child: Row(
                      children: [
                        SegmentTab(
                          label: 'Transaction',
                          isSelected: selectedTabIndex == 0,
                          onTap: () {
                            setState(() {
                              selectedTabIndex = 0;
                            });
                          },
                        ),
                        SegmentTab(
                          label: 'Reports',
                          isSelected: selectedTabIndex == 1,
                          onTap: () {
                            setState(() {
                                                            selectedTabIndex = 1;
                            });
                          },
                        ),
                        SegmentTab(
                          label: 'Receipts',
                          isSelected: selectedTabIndex == 2,
                          onTap: () {
                            setState(() {
                              selectedTabIndex = 2;
                            });
                          },
                        ),
                        SegmentTab(
                          label: 'Archive',
                          isSelected: selectedTabIndex == 3,
                          onTap: () {
                            setState(() {
                              selectedTabIndex = 3;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Sort row only for Transaction tab
                  if (selectedTabIndex == 0)
                    GestureDetector(
                      key: sortKey,
                      onTap: showSortMenu,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            sortLabel,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Colors.black,
                              fontFamily: 'Poppins',
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(
                            Icons.keyboard_arrow_down_rounded,
                            size: 18,
                            color: Colors.black,
                          ),
                        ],
                      ),
                    ),

                  if (selectedTabIndex == 0) const SizedBox(height: 16),

                  // Tab content
                  Expanded(
                    child: Builder(
                      builder: (context) {
                        if (selectedTabIndex == 0) {
                          // TRANSACTIONS TAB
                          if (_isLoadingData) {
                            return const Center(child: CircularProgressIndicator());
                          }
                          final txs = filteredTransactions;
                          if (txs.isEmpty) {
                            return const Align(
                              alignment: Alignment.center,
                              child: Padding(
                                padding: EdgeInsets.only(bottom: 100),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment:
                                      CrossAxisAlignment.center,
                                  children: [
                                    Image(
                                      image: AssetImage(
                                          'assets/Icons/navigation_icons/nav_history.png'),
                                      width: 61,
                                      height: 61,
                                      fit: BoxFit.contain,
                                    ),
                                    SizedBox(height: 16),
                                    Text(
                                      'No transactions found',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontFamily: 'Poppins',
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black,
                                      ),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      'There are no transactions for the selected filter',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontFamily: 'Poppins',
                                        fontSize: 12,
                                        color: Colors.black54,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }

                          // LIST OF TRANSACTIONS
                          return ListView.builder(
                            padding:
                                const EdgeInsets.only(bottom: 100, top: 0),
                            itemCount: txs.length,
                            itemBuilder: (context, index) {
                              final t = txs[index];
                              return TransactionCard(item: t);
                            },
                          );
                        } else if (selectedTabIndex == 1) {
                          // REPORTS TAB
                          return _buildReportsTab();
                        } else if (selectedTabIndex == 2) {
                          // RECEIPTS TAB
                          if (_isLoadingData) {
                            return const Center(child: CircularProgressIndicator());
                          }
                          if (receipts.isEmpty) {
                            return const Align(
                              alignment: Alignment.center,
                              child: Padding(
                                padding: EdgeInsets.only(bottom: 100),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment:
                                      CrossAxisAlignment.center,
                                  children: [
                                    Image(
                                      image: AssetImage(
                                          'assets/Icons/receipts.png'),
                                      width: 61,
                                      height: 61,
                                      fit: BoxFit.contain,
                                    ),
                                    SizedBox(height: 16),
                                    Text(
                                      'No receipts yet',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontFamily: 'Poppins',
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black,
                                      ),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      'Upload receipts to keep track of your expenses.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontFamily: 'Poppins',
                                        fontSize: 12,
                                        color: Colors.black54,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }

                          return ListView.builder(
                            padding:
                                const EdgeInsets.only(bottom: 100, top: 0),
                            itemCount: receipts.length,
                            itemBuilder: (context, index) {
                              final r = receipts[index];
                              return Padding(
                                padding:
                                    const EdgeInsets.only(bottom: 12.0),
                                child: ReceiptCard(
                                  item: r,
                                  onView: () {
                                    showDialog(
                                      context: context,
                                      builder: (ctx) {
                                        return Dialog(
                                          child: Column(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Padding(
                                                padding:
                                                    const EdgeInsets.all(
                                                        12),
                                                child: Text(
                                                  r.description,
                                                  style: const TextStyle(
                                                    fontFamily: 'Poppins',
                                                    fontSize: 14,
                                                    fontWeight:
                                                        FontWeight.w600,
                                                  ),
                                                ),
                                              ),
                                              if (File(r.imagePath)
                                                  .existsSync())
                                                Image.file(
                                                  File(r.imagePath),
                                                  fit: BoxFit.contain,
                                                )
                                              else
                                                const Padding(
                                                  padding:
                                                      EdgeInsets.all(16),
                                                  child: Text(
                                                    'Image not found.',
                                                    style: TextStyle(
                                                      fontFamily: 'Poppins',
                                                      fontSize: 12,
                                                    ),
                                                  ),
                                                ),
                                              TextButton(
                                                onPressed: () =>
                                                    Navigator.of(ctx)
                                                        .pop(),
                                                child: const Text('Close'),
                                              ),
                                            ],
                                          ),
                                        );
                                      },
                                    );
                                  },
                                  onDownload: () {
                                    // Placeholder: hook real download/gallery save here.
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Download not implemented in this demo.',
                                        ),
                                      ),
                                    );
                                  },
                                  onDelete: () async {
                                    try {
                                      await WalletMonthDbHelper.deleteReceipt(r.imagePath);
                                      await _loadReceipts();
                                    } catch (e) {
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text('Failed to delete: $e')),
                                        );
                                      }
                                    }
                                  },
                                ),
                              );
                            },
                          );
                        } else {
                          // ARCHIVE TAB
                          return const Align(
                            alignment: Alignment.center,
                            child: Padding(
                              padding: EdgeInsets.only(bottom: 100),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment:
                                    CrossAxisAlignment.center,
                                children: [
                                  Image(
                                    image: AssetImage(
                                        'assets/Icons/navigation_icons/nav_history.png'),
                                    width: 61,
                                    height: 61,
                                    fit: BoxFit.contain,
                                  ),
                                  SizedBox(height: 16),
                                  Text(
                                    'No archives found',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontFamily: 'Poppins',
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black,
                                    ),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    'There are no archived reports for this month.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontFamily: 'Poppins',
                                      fontSize: 12,
                                      color: Colors.black54,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Dark overlay for ANY popup
          if (_anyPopupVisible)
            Positioned.fill(
              child: GestureDetector(
                onTap: closeAllPopups,
                child: Container(
                  color: Colors.black.withAlpha(102),
                ),
              ),
            ),

          // Add menu
          if (showAddMenu)
            Positioned(
              bottom: 100,
              right: 20,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  AddMenuButton(
                    label: 'Add Income',
                    onTap: () => openPopup(ActivePopup.income),
                  ),
                  const SizedBox(height: 8),
                  AddMenuButton(
                    label: 'Add Expense',
                    onTap: () => openPopup(ActivePopup.expense),
                  ),
                  const SizedBox(height: 8),
                  AddMenuButton(
                    label: 'Add Receipt',
                    onTap: () => openPopup(ActivePopup.receipt),
                  ),
                ],
              ),
            ),

          // Popups
          if (activePopup == ActivePopup.income)
            Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: keyboardInset + 20),
                child: FormPopupShell(
                  width: 300,
                  height: 461,
                  title: 'Add Income Transaction',
                  subtitle:
                      'Record an income transaction for this wallet.',
                  actions: [
                    _buildCancelButton(closeAllPopups),
                    const SizedBox(width: 8),
                    _buildPrimaryButton('Save', saveIncome),
                  ],
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      LabeledField(
                        label: 'Date Issued',
                        field: SizedBox(
                          height: 40,
                          child: TextField(
                            controller: dateIssuedController,
                            readOnly: true,
                            onTap: () =>
                                _pickDateInto(dateIssuedController),
                            textAlignVertical: TextAlignVertical.center,
                            style: const TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                            ),
                            decoration: const InputDecoration(
                              hintText: 'Select date',
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 8,
                              ),
                              border: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: Colors.black54,
                                  width: 1,
                                ),
                              ),
                              isDense: true,
                              suffixIcon: Icon(
                                Icons.calendar_today_outlined,
                                size: 18,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      LabeledField(
                        label: 'Quantity',
                        field: PopupTextField(
                          controller: quantityController,
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(height: 8),
                      LabeledField(
                        label: 'Type of Income',
                        field: SizedBox(
                          height: 40,
                          child: DropdownButtonFormField<String>(
                            initialValue: selectedIncomeType,
                            items: incomeTypes
                                .map(
                                  (type) => DropdownMenuItem<String>(
                                    value: type,
                                    child: Text(
                                      type,
                                      style: const TextStyle(
                                        fontFamily: 'Poppins',
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                )
                                .toList(),
                            onChanged: (value) {
                              setState(() {
                                selectedIncomeType = value;
                              });
                            },
                            decoration: const InputDecoration(
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 8,
                              ),
                              border: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: Colors.black54,
                                  width: 1,
                                ),
                              ),
                              isDense: true,
                              hintText: 'Select Type',
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      LabeledField(
                        label: 'Description',
                        field: PopupTextField(
                          controller: descriptionController,
                        ),
                      ),
                      const SizedBox(height: 8),
                      LabeledField(
                        label: 'Price',
                        field: PopupTextField(
                          controller: priceController,
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          if (activePopup == ActivePopup.expense)
            Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: keyboardInset + 20),
                child: FormPopupShell(
                  width: 300,
                  height: 461,
                  title: 'Add Expense Transaction',
                  subtitle:
                      'Record an expense transaction for this wallet.',
                  actions: [
                    _buildCancelButton(closeAllPopups),
                    const SizedBox(width: 8),
                    _buildPrimaryButton('Save', saveExpense),
                  ],
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      LabeledField(
                        label: 'Date Issued',
                        field: SizedBox(
                          height: 40,
                          child: TextField(
                            controller: expenseDateController,
                            readOnly: true,
                            onTap: () =>
                                _pickDateInto(expenseDateController),
                            textAlignVertical: TextAlignVertical.center,
                            style: const TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                            ),
                            decoration: const InputDecoration(
                              hintText: 'Select date',
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 8,
                              ),
                              border: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: Colors.black54,
                                  width: 1,
                                ),
                              ),
                              isDense: true,
                              suffixIcon: Icon(
                                Icons.calendar_today_outlined,
                                size: 18,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      LabeledField(
                        label: 'Quantity',
                        field: PopupTextField(
                          controller: expenseQuantityController,
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(height: 8),
                      LabeledField(
                        label: 'Particulars',
                        field: PopupTextField(
                          controller: expenseParticularsController,
                        ),
                      ),
                      const SizedBox(height: 8),
                      LabeledField(
                        label: 'Description',
                        field: PopupTextField(
                          controller: expenseDescriptionController,
                        ),
                      ),
                      const SizedBox(height: 8),
                      LabeledField(
                        label: 'Price',
                        field: PopupTextField(
                          controller: expensePriceController,
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          if (activePopup == ActivePopup.receipt)
            Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: keyboardInset + 20),
                child: FormPopupShell(
                  width: 300,
                  height: 380,
                  title: 'Add Receipt',
                  subtitle: 'Upload a receipt image for this wallet.',
                  actions: [
                    _buildCancelButton(closeAllPopups),
                    const SizedBox(width: 8),
                    _buildPrimaryButton('Save', saveReceipt),
                  ],
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      LabeledField(
                        label: 'Receipt Image',
                        field: GestureDetector(
                          onTap: pickReceiptImage,
                          child: Container(
                            height: 40,
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFFCF5),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: const Color(0xFFE7D9C0),
                                width: 1,
                              ),
                                                          ),
                            alignment: Alignment.centerLeft,
                            padding:
                                const EdgeInsets.symmetric(horizontal: 8),
                            child: Text(
                              receiptImage == null ? '' : 'Image selected',
                              style: const TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 12,
                                color: Colors.black87,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      LabeledField(
                        label: 'Description',
                        field: PopupTextField(
                          controller: receiptDescriptionController,
                        ),
                      ),
                      const SizedBox(height: 12),
                      LabeledField(
                        label: 'Date',
                        field: SizedBox(
                          height: 40,
                          child: TextField(
                            controller: receiptDateController,
                            readOnly: true,
                            onTap: () =>
                                _pickDateInto(receiptDateController),
                            textAlignVertical: TextAlignVertical.center,
                            style: const TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                            ),
                            decoration: const InputDecoration(
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 8,
                              ),
                              border: OutlineInputBorder(
                                borderSide: BorderSide(
                                  color: Colors.black54,
                                  width: 1,
                                ),
                              ),
                              isDense: true,
                              suffixIcon: Icon(
                                Icons.calendar_today_outlined,
                                size: 18,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          if (activePopup == ActivePopup.reportDetails)
            Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: keyboardInset + 20),
                child: FormPopupShell(
                  width: 320,
                  height: 520,
                  title: 'Financial Report Details',
                  subtitle:
                      'Fill in the details for your Activity Financial Statement.',
                  actions: [
                    _buildCancelButton(closeAllPopups),
                    const SizedBox(width: 8),
                    _buildPrimaryButton('Generate', () async {
                      final messenger = ScaffoldMessenger.of(context);
                      try {
                        await WalletMonthDbHelper.generateReport(
                          widget.folderId,
                          {
                            'event_name': reportEventNameController.text,
                            'date_prepared': reportDatePreparedController.text,
                            'report_no': reportNumberController.text,
                            'budget': double.tryParse(reportBudgetController.text) ?? 0,
                            'total_income': double.tryParse(reportTotalIncomeController.text) ?? 0,
                            'total_expense': double.tryParse(reportTotalExpensesController.text) ?? 0,
                            'reimbursement': double.tryParse(reportReimbursementController.text) ?? 0,
                            'previous_fund': double.tryParse(reportPreviousFundController.text) ?? 0,
                            'budget_in_the_bank': double.tryParse(reportBudgetInBankController.text) ?? 0,
                          },
                        );
                        if (mounted) {
                          setState(() {
                            showReportActions = true;
                            activePopup = ActivePopup.none;
                          });
                        }
                      } catch (e) {
                        messenger.showSnackBar(
                          SnackBar(content: Text('Failed to generate report: $e')),
                        );
                      }
                    }),
                  ],
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        LabeledField(
                          label: 'Event Name',
                          field: PopupTextField(
                            controller: reportEventNameController,
                          ),
                        ),
                        const SizedBox(height: 8),
                        LabeledField(
                          label: 'Date Prepared',
                          field: SizedBox(
                            height: 40,
                            child: TextField(
                              controller: reportDatePreparedController,
                              readOnly: true,
                              onTap: () => _pickDateInto(
                                reportDatePreparedController,
                                pattern: 'dd/MM/yyyy',
                              ),
                              textAlignVertical: TextAlignVertical.center,
                              style: const TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 13,
                              ),
                              decoration: const InputDecoration(
                                hintText: 'Select date',
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 8,
                                ),
                                border: OutlineInputBorder(
                                  borderSide: BorderSide(
                                    color: Colors.black54,
                                    width: 1,
                                  ),
                                ),
                                isDense: true,
                                suffixIcon: Icon(
                                  Icons.calendar_today_outlined,
                                  size: 18,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        LabeledField(
                          label: 'Report Number',
                          field: PopupTextField(
                            controller: reportNumberController,
                          ),
                        ),
                        const SizedBox(height: 8),
                        LabeledField(
                          label: 'Budget',
                          field: PopupTextField(
                            controller: reportBudgetController,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(height: 8),
                        LabeledField(
                          label: 'Total Income',
                          field: PopupTextField(
                            controller: reportTotalIncomeController,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(height: 8),
                        LabeledField(
                          label: 'Total Expenses',
                          field: PopupTextField(
                            controller: reportTotalExpensesController,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(height: 8),
                        LabeledField(
                          label: 'Reimbursement',
                          field: PopupTextField(
                            controller: reportReimbursementController,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(height: 8),
                        LabeledField(
                          label: 'Previous Fund',
                          field: PopupTextField(
                            controller: reportPreviousFundController,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(height: 8),
                        LabeledField(
                          label: 'Budget in Bank',
                          field: PopupTextField(
                            controller: reportBudgetInBankController,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

          if (activePopup == ActivePopup.reportConfirm)
            Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: keyboardInset + 20),
                child: FormPopupShell(
                  width: 280,
                  height: 220,
                  title: 'Generate Report?',
                  subtitle:
                      'Generate an Activity Financial Statement using the details you entered.',
                  actions: [
                    _buildCancelButton(closeAllPopups),
                    const SizedBox(width: 8),
                    _buildPrimaryButton('Generate', () {
                      setState(() {
                        showReportActions = true;
                        activePopup = ActivePopup.none;
                      });
                    }),
                  ],
                  child: const Text(
                    'You can still edit, preview, print, or submit the report after it is generated.',
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 13,
                      color: Colors.black87,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 20),
        child: SizedBox(
          width: 60,
          height: 60,
          child: FloatingActionButton(
            onPressed: toggleAddMenu,
            backgroundColor: const Color(0xFF2F4366),
            shape: const CircleBorder(
              side: BorderSide(color: Colors.black, width: 1),
            ),
            child: const Icon(
              Icons.add,
              size: 32,
              color: Color(0xFFFFFFFF),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildReportsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Generate Financial Report card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [
                  Color(0xFFF2CF83),
                  Color(0xFFE69F2E),
                ],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Image.asset(
                  'assets/Icons/reports.png',
                  width: 52.47,
                  height: 41.52,
                  fit: BoxFit.contain,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Generate Financial Report',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Create an Activity Financial Statement for this wallet',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 10,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 6),
                      SizedBox(
                        height: 24,
                        child: showReportActions
                            ? Row(
                                mainAxisAlignment: MainAxisAlignment.start,
                                children: [
                                  _buildReportActionChip(
                                    label: 'Edit Report',
                                    background:
                                        const Color(0xFFFFFFFF),
                                    textColor: Colors.black,
                                  ),
                                  const SizedBox(width: 6),
                                  GestureDetector(
                                    onTap: () async {
                                      final messenger = ScaffoldMessenger.of(context);
                                      try {
                                        debugPrint('Preview button clicked');
                                        messenger.showSnackBar(
                                          const SnackBar(content: Text('Downloading report...')),
                                        );
                                        
                                        final url = await WalletMonthDbHelper.getPreviewUrl(widget.folderId);
                                        debugPrint('Preview URL: $url');
                                        
                                        final response = await http.get(Uri.parse(url), headers: ApiClient.getHeaders());
                                        debugPrint('Response status: ${response.statusCode}');
                                        debugPrint('Response body length: ${response.bodyBytes.length}');
                                        
                                        if (response.statusCode == 200) {
                                          final dir = Directory('/storage/emulated/0/Download');
                                          debugPrint('Download dir: ${dir.path}');
                                          debugPrint('Dir exists: ${await dir.exists()}');
                                          
                                          if (!await dir.exists()) {
                                            await dir.create(recursive: true);
                                            debugPrint('Created directory');
                                          }
                                          
                                          final fileName = 'financial_report_${DateTime.now().millisecondsSinceEpoch}.docx';
                                          final file = File('${dir.path}/$fileName');
                                          debugPrint('File path: ${file.path}');
                                          
                                          await file.writeAsBytes(response.bodyBytes);
                                          debugPrint('File written successfully');
                                          
                                          // Open file with available apps
                                          final result = await OpenFile.open(file.path);
                                          debugPrint('Open file result: ${result.message}');
                                          
                                          messenger.showSnackBar(
                                            SnackBar(
                                              content: Text('Opening: $fileName'),
                                              duration: const Duration(seconds: 2),
                                            ),
                                          );
                                        } else {
                                          debugPrint('HTTP error: ${response.statusCode}');
                                          messenger.showSnackBar(
                                            SnackBar(content: Text('Server error: ${response.statusCode}')),
                                          );
                                        }
                                      } catch (e, stackTrace) {
                                        debugPrint('Error downloading: $e');
                                        debugPrint('Stack trace: $stackTrace');
                                        messenger.showSnackBar(
                                          SnackBar(
                                            content: Text('Error: $e'),
                                            duration: const Duration(seconds: 5),
                                          ),
                                        );
                                      }
                                    },
                                    child: _buildReportActionChip(
                                      label: 'Preview',
                                      background:
                                          const Color(0xFFFFFFFF),
                                      textColor: Colors.black,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  _buildReportActionChip(
                                    label: 'Print',
                                    background:
                                        const Color(0xFF8B3B08),
                                    textColor: Colors.white,
                                  ),
                                  const SizedBox(width: 6),
                                  _buildReportActionChip(
                                    label: 'Submit',
                                    background:
                                        const Color(0xFF2D8A34),
                                    textColor: Colors.white,
                                  ),
                                ],
                              )
                            : Align(
                                alignment: Alignment.centerLeft,
                                child: ElevatedButton(
                                  onPressed: () {
                                    setState(() {
                                      activePopup =
                                          ActivePopup.reportDetails;
                                    });
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.white,
                                    foregroundColor: Colors.black,
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 5,
                                      vertical: 2,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius:
                                          BorderRadius.circular(4),
                                      side: const BorderSide(
                                        color: Color.fromARGB(
                                          255,
                                          255,
                                          255,
                                          255,
                                        ),
                                        width: 1,
                                      ),
                                    ),
                                  ),
                                  child: const Text(
                                    'Generate Report',
                                    style: TextStyle(
                                      fontFamily: 'Poppins',
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Summary cards 2x2 grid
          const Row(
            children: [
              Expanded(
                child: ReportSummaryCard(
                  title: 'Budget',
                  amountLabel: 'Php 0.00',
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: ReportSummaryCard(
                  title: 'Total amount of Income',
                  amountLabel: 'Php 0.00',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Row(
            children: [
              Expanded(
                child: ReportSummaryCard(
                  title: 'Total amount of expenses',
                  amountLabel: 'Php 0.00',
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: ReportSummaryCard(
                  title: 'Ending Cash',
                  amountLabel: 'Php 0.00',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReportActionChip({
    required String label,
    required Color background,
    required Color textColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.black.withValues(alpha: 0.1),
          width: 1,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: 'Poppins',
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: textColor,
        ),
      ),
    );
  }
}

// In-memory transaction model
class TransactionItem {
  final String date;
  final String monthLabel;
  final int quantity;
  final double price;
  final String description;
  // income type or expense particulars-description
  final String details;
  final double totalAmount;
  // 'Income' or 'Expense'
  final String type;

  TransactionItem({
    required this.date,
    required this.monthLabel,
    required this.quantity,
    required this.price,
    required this.description,
    required this.details,
    required this.totalAmount,
    required this.type,
  });
}

// Card UI for a transaction
class TransactionCard extends StatelessWidget {
  final TransactionItem item;

  const TransactionCard({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    final String topLine = item.monthLabel.toUpperCase();
    final String middleLine =
        '${item.quantity} x ${item.price.toStringAsFixed(0)} - ${item.details.isNotEmpty ? item.details : item.description}';
    final Color amountColor = item.type == 'Expense'
        ? const Color(0xFFC62828)
        : const Color(0xFF2E7D32);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
        color: const Color(0xFFFFFCF5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFF3E6CF),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // First row: month and amount
          Row(
            children: [
              Expanded(
                child: Text(
                  topLine,
                  style: const TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Colors.black,
                  ),
                ),
              ),
              Text(
                'PHP ${item.totalAmount.toStringAsFixed(0)}',
                style: TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: amountColor,
                ),
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.more_vert,
                size: 18,
                color: Colors.black54,
              ),
            ],
          ),
          const SizedBox(height: 4),
          // Middle line
          Text(
            middleLine,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontFamily: 'Poppins',
              fontSize: 12,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 6),
          // Date
          Text(
            item.date,
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

// In-memory receipt model
class ReceiptItem {
  final String description;
  final String date;
  final String imagePath;

  ReceiptItem({
    required this.description,
    required this.date,
    required this.imagePath,
  });
}

// Card UI for a receipt
class ReceiptCard extends StatelessWidget {
  final ReceiptItem item;
  final VoidCallback onView;
  final VoidCallback onDownload;
  final VoidCallback onDelete;

  const ReceiptCard({
    super.key,
    required this.item,
    required this.onView,
    required this.onDownload,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 140,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE7D9C0),
          width: 1,
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            children: [
              const Icon(
                Icons.insert_drive_file_outlined,
                size: 36,
                color: Color(0xFFB0B0B0),
              ),
              const SizedBox(height: 8),
              Text(
                item.description,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                item.date,
                style: const TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 11,
                  color: Colors.black54,
                ),
              ),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _ReceiptActionButton(
                label: 'View',
                backgroundColor: const Color(0xFFF6E4C8),
                textColor: Colors.black,
                onTap: onView,
              ),
              const SizedBox(width: 8),
              _ReceiptActionButton(
                label: 'Download',
                backgroundColor: const Color(0xFF8B3B08),
                textColor: Colors.white,
                onTap: onDownload,
              ),
              const SizedBox(width: 8),
              _ReceiptActionButton(
                label: 'Delete',
                backgroundColor: Colors.white,
                textColor: Colors.black,
                borderColor: const Color(0xFFE0D5C8),
                onTap: onDelete,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ReceiptActionButton extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;
  final Color? borderColor;
  final VoidCallback onTap;

  const _ReceiptActionButton({
    required this.label,
    required this.backgroundColor,
    required this.textColor,
    this.borderColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: backgroundColor,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: borderColor != null
                ? Border.all(color: borderColor!, width: 1)
                : null,
          ),
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'Poppins',
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: textColor,
            ),
          ),
        ),
      ),
    );
  }
}

// Summary card used in Reports tab
class ReportSummaryCard extends StatelessWidget {
  final String title;
  final String amountLabel;

  const ReportSummaryCard({
    super.key,
    required this.title,
    required this.amountLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 70,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF5),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: const Color(0xFFE7D9C0),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontFamily: 'Poppins',
              fontSize: 11,
              color: Colors.black,
            ),
          ),
          const Spacer(),
          Text(
            amountLabel,
            style: const TextStyle(
              fontFamily: 'Poppins',
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.black,
            ),
          ),
        ],
      ),
    );
  }
}

// Reusable text field for popups
class PopupTextField extends StatelessWidget {
  final TextEditingController controller;
  final TextInputType? keyboardType;

  const PopupTextField({
    super.key,
    required this.controller,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        textAlignVertical: TextAlignVertical.center,
        style: const TextStyle(
          fontFamily: 'Poppins',
          fontSize: 13,
        ),
        decoration: const InputDecoration(
          contentPadding: EdgeInsets.symmetric(
            horizontal: 8,
            vertical: 8,
          ),
          border: OutlineInputBorder(
            borderSide: BorderSide(
              color: Colors.black54,
              width: 1,
            ),
          ),
          isDense: true,
        ),
      ),
    );
  }
}

// Segmented tab widget
class SegmentTab extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const SegmentTab({
    super.key,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 34,
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFF3D58D) : Colors.transparent,
            borderRadius: BorderRadius.circular(5),
            border: Border.all(
              color: isSelected ? Colors.black : Colors.transparent,
              width: 1,
            ),
          ),
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontFamily: 'Poppins',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.black,
            ),
          ),
        ),
      ),
    );
  }
}

// Add menu button widget
class AddMenuButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const AddMenuButton({
    super.key,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 160,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.black, width: 1),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: const TextStyle(
            fontFamily: 'Poppins',
            fontSize: 13,
            color: Colors.black,
          ),
        ),
      ),
    );
  }
}

// Generic popup shell
class FormPopupShell extends StatelessWidget {
  final double width;
  final double height;
  final String title;
  final String subtitle;
  final List<Widget> actions;
  final Widget child;

  const FormPopupShell({
    super.key,
    required this.width,
    required this.height,
    required this.title,
    required this.subtitle,
    required this.actions,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.black, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontFamily: 'Poppins',
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: const TextStyle(
              fontFamily: 'Poppins',
              fontSize: 13,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 10),
          Expanded(child: child),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: actions,
          ),
        ],
      ),
    );
  }
}

// Label + field wrapper
class LabeledField extends StatelessWidget {
  final String label;
  final Widget field;

  const LabeledField({
    super.key,
    required this.label,
    required this.field,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'Poppins',
            fontSize: 13,
            color: Colors.black,
          ),
        ),
        const SizedBox(height: 4),
        field,
      ],
    );
  }
} 