import 'dart:io';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart'; // make sure you add intl in pubspec.yaml
import 'package:image_picker/image_picker.dart'; // add image_picker in pubspec.yaml

class WalletMonthScreen extends StatefulWidget {
  final String month;

  const WalletMonthScreen({super.key, required this.month});

  @override
  State<WalletMonthScreen> createState() => _WalletMonthScreenState();
}

class _WalletMonthScreenState extends State<WalletMonthScreen> {
  // Sort state
  String _sortFilter = 'Expense'; // All, Expense, Income
  String _sortOrder = 'New to old'; // New to old, Old to new

  final GlobalKey _sortKey = GlobalKey();

  bool _showAddMenu = false; // controls the add menu visibility
  bool _showAddIncomeForm = false; // controls the Add Income popup
  bool _showAddExpenseForm = false; // controls the Add Expense popup
  bool _showAddReceiptForm = false; // controls the Add Receipt popup

  // Tabs: 0 = Transaction, 1 = Reports, 2 = Receipts
  int _selectedTabIndex = 0;

  // Controllers / state for Add Income form
  final TextEditingController _dateIssuedController = TextEditingController();
  final TextEditingController _quantityController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _priceController = TextEditingController();

  String? _selectedIncomeType;
  final List<String> _incomeTypes = const [
    'Income Generating Projects',
    'Registration Fee',
    'Membership Fee',
  ];

  // Controllers / state for Add Expense form
  final TextEditingController _expenseDateController = TextEditingController();
  final TextEditingController _expenseQuantityController =
      TextEditingController();
  final TextEditingController _expenseParticularsController =
      TextEditingController();
  final TextEditingController _expenseDescriptionController =
      TextEditingController();
  final TextEditingController _expensePriceController =
      TextEditingController();

  // Controllers / state for Add Receipt form
  final TextEditingController _receiptDescriptionController =
      TextEditingController();
  final TextEditingController _receiptDateController =
      TextEditingController();
  final ImagePicker _receiptPicker = ImagePicker();
  File? _receiptImage;

  @override
  void dispose() {
    // Income controllers
    _dateIssuedController.dispose();
    _quantityController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();

    // Expense controllers
    _expenseDateController.dispose();
    _expenseQuantityController.dispose();
    _expenseParticularsController.dispose();
    _expenseDescriptionController.dispose();
    _expensePriceController.dispose();

    // Receipt controllers
    _receiptDescriptionController.dispose();
    _receiptDateController.dispose();

    super.dispose();
  }

  void _showSortMenu() {
    final renderBox =
        _sortKey.currentContext?.findRenderObject() as RenderBox?;
    if (renderBox == null) return;

    final overlay = Overlay.of(context);
    final overlayBox = overlay.context.findRenderObject() as RenderBox;
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
            // overlaps the "Sort by" row
            top: position.dy,
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
      height: 160,
      decoration: BoxDecoration(
        color: const Color(0xFFE8D7AA),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.black, width: 1),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Sort by',
              style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 6),
          _buildMenuRow('All', entry, isFilter: true),
          _buildMenuRow('Expense', entry, isFilter: true),
          _buildMenuRow('Income', entry, isFilter: true),
          const Divider(height: 14, thickness: 1),
          _buildMenuRow('New to old', entry, isFilter: false),
          _buildMenuRow('Old to new', entry, isFilter: false),
        ],
      ),
    );
  }

  Widget _buildMenuRow(
    String label,
    OverlayEntry entry, {
    required bool isFilter,
  }) {
    final bool selected =
        isFilter ? _sortFilter == label : _sortOrder == label;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        setState(() {
          if (isFilter) {
            _sortFilter = label;
          } else {
            _sortOrder = label;
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
                  ? const Icon(Icons.check, size: 18, color: Colors.black)
                  : const SizedBox.shrink(),
            ),
            const SizedBox(width: 6),
            Text(label,
                style: const TextStyle(
                    fontSize: 12,
                    color: Colors.black,
                    fontFamily: 'Poppins')),
          ],
        ),
      ),
    );
  }

  void _toggleAddMenu() {
    setState(() {
      // close forms if open
      _showAddIncomeForm = false;
      _showAddExpenseForm = false;
      _showAddReceiptForm = false;
      _showAddMenu = !_showAddMenu;
    });
  }

  void _closeAddMenu() {
    if (_showAddMenu ||
        _showAddIncomeForm ||
        _showAddExpenseForm ||
        _showAddReceiptForm) {
      setState(() {
        _showAddMenu = false;
        _showAddIncomeForm = false;
        _showAddExpenseForm = false;
        _showAddReceiptForm = false;
      });
    }
  }

  void _openAddIncomeForm() {
    setState(() {
      _showAddMenu = false;
      _showAddIncomeForm = true;
      _showAddExpenseForm = false;
      _showAddReceiptForm = false;
    });
  }

  void _openAddExpenseForm() {
    setState(() {
      _showAddMenu = false;
      _showAddIncomeForm = false;
      _showAddExpenseForm = true;
      _showAddReceiptForm = false;
    });
  }

  void _openAddReceiptForm() {
    setState(() {
      _showAddMenu = false;
      _showAddIncomeForm = false;
      _showAddExpenseForm = false;
      _showAddReceiptForm = true;
    });
  }

  Future<void> _pickDateIssued() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      final formatted = DateFormat('yyyy-MM-dd').format(picked);
      setState(() {
        _dateIssuedController.text = formatted;
      });
    }
  }

  Future<void> _pickExpenseDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      final formatted = DateFormat('yyyy-MM-dd').format(picked);
      setState(() {
        _expenseDateController.text = formatted;
      });
    }
  }

  Future<void> _pickReceiptDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      final formatted = DateFormat('yyyy-MM-dd').format(picked);
      setState(() {
        _receiptDateController.text = formatted;
      });
    }
  }

  Future<void> _pickReceiptImage() async {
    final XFile? picked =
        await _receiptPicker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;
    setState(() {
      _receiptImage = File(picked.path);
    });
  }

  @override
  Widget build(BuildContext context) {
    final String sortLabel = 'Sort by $_sortFilter';
    final double keyboardInset =
        MediaQuery.of(context).viewInsets.bottom;

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
                        color: Colors.black),
                  ),
                  const SizedBox(height: 24),

                  // Tabs: Transaction, Reports, Receipts
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _WalletTab(
                        label: 'Transaction',
                        isSelected: _selectedTabIndex == 0,
                        onTap: () {
                          setState(() => _selectedTabIndex = 0);
                        },
                      ),
                      _WalletTab(
                        label: 'Reports',
                        isSelected: _selectedTabIndex == 1,
                        onTap: () {
                          setState(() => _selectedTabIndex = 1);
                        },
                      ),
                      _WalletTab(
                        label: 'Receipts',
                        isSelected: _selectedTabIndex == 2,
                        onTap: () {
                          setState(() => _selectedTabIndex = 2);
                        },
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Sort by row ONLY for Transaction tab
                  if (_selectedTabIndex == 0) ...[
                    GestureDetector(
                      key: _sortKey,
                      onTap: _showSortMenu,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            sortLabel,
                            style: const TextStyle(
                                fontSize: 14,
                                color: Colors.black,
                                fontFamily: 'Poppins',
                                fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.keyboard_arrow_down_rounded,
                              size: 18, color: Colors.black),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Tab content
                  Expanded(
                    child: Builder(
                      builder: (context) {
                        if (_selectedTabIndex == 0) {
                          // Transaction tab
                          return Align(
                            alignment: Alignment.center,
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 100),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment:
                                    CrossAxisAlignment.center,
                                children: const [
                                  Image(
                                    image: AssetImage(
                                      'assets/Icons/navigation_icons/nav_history.png',
                                    ),
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
                        } else if (_selectedTabIndex == 1) {
                          // Reports tab
                          return SingleChildScrollView(
                            padding: const EdgeInsets.only(bottom: 100),
                            child: Column(
                              children: [
                                // Generate Financial Report card
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(10),
                                  margin:
                                      const EdgeInsets.only(bottom: 12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF3D58D),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                        color: Colors.black, width: 1),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Row(
                                          children: [
                                            Container(
                                              width: 50,
                                              height: 40,
                                              decoration: BoxDecoration(
                                                color:
                                                    const Color(0xFFB7671A),
                                                borderRadius:
                                                    BorderRadius.circular(6),
                                              ),
                                              child: const Icon(
                                                  Icons.folder,
                                                  color: Colors.white,
                                                  size: 28),
                                            ),
                                            const SizedBox(width: 10),
                                            const Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment
                                                        .start,
                                                mainAxisSize:
                                                    MainAxisSize.min,
                                                children: [
                                                  Text(
                                                    'Generate Financial Report',
                                                    style: TextStyle(
                                                      fontFamily: 'Poppins',
                                                      fontSize: 13,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                      color: Colors.black,
                                                    ),
                                                  ),
                                                  SizedBox(height: 2),
                                                  Text(
                                                    'Create an Activity Financial Statement for this wallet.',
                                                    style: TextStyle(
                                                      fontFamily: 'Poppins',
                                                      fontSize: 11,
                                                      color: Colors.black87,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      SizedBox(
                                        height: 40,
                                        child: ElevatedButton(
                                          onPressed: () {
                                            // todo: generate report
                                          },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.white,
                                            foregroundColor: Colors.black,
                                            elevation: 0,
                                            padding:
                                                const EdgeInsets.symmetric(
                                                    horizontal: 10),
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                              side: const BorderSide(
                                                  color: Colors.black),
                                            ),
                                          ),
                                          child: const Text('Generate',
                                              style: TextStyle(
                                                  fontFamily: 'Poppins',
                                                  fontSize: 12,
                                                  fontWeight:
                                                      FontWeight.w600)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                // Summary cards
                                const _ReportSummaryCard(
                                    title: 'Budget',
                                    amountLabel: 'Php 0.00'),
                                const _ReportSummaryCard(
                                    title: 'Total amount of expenses',
                                    amountLabel: 'Php 0.00'),
                                const _ReportSummaryCard(
                                    title: 'Total amount of  Income',
                                    amountLabel: 'Php 0.00'),
                                const _ReportSummaryCard(
                                    title: 'Budget in Bank',
                                    amountLabel: 'Php 0.00'),
                                const _ReportSummaryCard(
                                    title: 'Ending Cash',
                                    amountLabel: 'Php 0.00'),
                              ],
                            ),
                          );
                        } else {
                          // Receipts tab
                          return const Center(
                            child: Text(
                              'No receipts yet',
                              style: TextStyle(
                                  fontFamily: 'Poppins',
                                  fontSize: 14,
                                  color: Colors.black),
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

          // Dark overlay when either menu or any form is visible
          if (_showAddMenu ||
              _showAddIncomeForm ||
              _showAddExpenseForm ||
              _showAddReceiptForm)
            Positioned.fill(
              child: GestureDetector(
                onTap: _closeAddMenu,
                child: Container(
                  color: Colors.black.withValues(alpha: 0.4),
                ),
              ),
            ),

          // Three-option menu when + is tapped
          if (_showAddMenu)
            Positioned(
              bottom: 100,
              right: 20,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _AddMenuButton(
                      label: 'Add Income', onTap: _openAddIncomeForm),
                  const SizedBox(height: 8),
                  _AddMenuButton(
                      label: 'Add Expense', onTap: _openAddExpenseForm),
                  const SizedBox(height: 8),
                  _AddMenuButton(
                      label: 'Add Receipt', onTap: _openAddReceiptForm),
                ],
              ),
            ),

          // Add Income popup
          if (_showAddIncomeForm)
            Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: keyboardInset + 20),
                child: Container(
                  width: 300,
                  height: 461,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.black, width: 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Add Income Transaction',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.black)),
                      const SizedBox(height: 2),
                      const Text('Record an income transaction for this wallet.',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black87)),
                      const SizedBox(height: 10),

                      const Text('Date Issued',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black)),
                      const SizedBox(height: 4),
                      SizedBox(
                        height: 40,
                        child: TextField(
                          controller: _dateIssuedController,
                          readOnly: true,
                          onTap: _pickDateIssued,
                          textAlignVertical: TextAlignVertical.center,
                          style: const TextStyle(
                              fontFamily: 'Poppins', fontSize: 13),
                          decoration: const InputDecoration(
                            hintText: 'Select date',
                            contentPadding:
                                EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                            border: OutlineInputBorder(
                                borderSide: BorderSide(color: Colors.black54)),
                            isDense: true,
                            suffixIcon:
                                Icon(Icons.calendar_today_outlined, size: 18),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),

                      const Text('Quantity',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black)),
                      const SizedBox(height: 4),
                      _PopupTextField(
                          controller: _quantityController,
                          keyboardType: TextInputType.number),
                      const SizedBox(height: 8),

                      const Text('Type of Income',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black)),
                      const SizedBox(height: 4),
                      SizedBox(
                        height: 40,
                        child: DropdownButtonFormField<String>(
                          initialValue: _selectedIncomeType,
                          items: _incomeTypes
                              .map(
                                (type) => DropdownMenuItem<String>(
                                  value: type,
                                  child: Text(type,
                                      style: const TextStyle(
                                          fontFamily: 'Poppins', fontSize: 13)),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            setState(() {
                              _selectedIncomeType = value;
                            });
                          },
                          decoration: const InputDecoration(
                            contentPadding:
                                EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                            border: OutlineInputBorder(
                                borderSide: BorderSide(color: Colors.black54)),
                            isDense: true,
                            hintText: 'Select Type',
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),

                      const Text('Description',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black)),
                      const SizedBox(height: 4),
                      _PopupTextField(controller: _descriptionController),
                      const SizedBox(height: 8),

                      const Text('Price',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black)),
                      const SizedBox(height: 4),
                      _PopupTextField(
                          controller: _priceController,
                          keyboardType: TextInputType.number),

                      const Spacer(),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton(
                            onPressed: _closeAddMenu,
                            style: TextButton.styleFrom(
                              minimumSize: const Size(70, 30),
                              foregroundColor: Colors.black,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: const BorderSide(color: Colors.black),
                              ),
                            ),
                            child: const Text('Cancel',
                                style: TextStyle(
                                    fontFamily: 'Poppins', fontSize: 12)),
                          ),
                          const SizedBox(width: 8),
                          TextButton(
                            onPressed: () {
                              // todo: save income
                              _closeAddMenu();
                            },
                            style: TextButton.styleFrom(
                              minimumSize: const Size(70, 30),
                              backgroundColor: const Color(0xFF8B3B08),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: const Text('Save',
                                style: TextStyle(
                                    fontFamily: 'Poppins', fontSize: 12)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Add Expense popup
          if (_showAddExpenseForm)
            Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: keyboardInset + 20),
                child: Container(
                  width: 300,
                  height: 461,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.black, width: 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Add Expense Transaction',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.black)),
                      const SizedBox(height: 2),
                      const Text('Record an expense transaction for this wallet.',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black87)),
                      const SizedBox(height: 10),

                      const Text('Date Issued',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black)),
                      const SizedBox(height: 4),
                      SizedBox(
                        height: 40,
                        child: TextField(
                          controller: _expenseDateController,
                          readOnly: true,
                          onTap: _pickExpenseDate,
                          textAlignVertical: TextAlignVertical.center,
                          style: const TextStyle(
                              fontFamily: 'Poppins', fontSize: 13),
                          decoration: const InputDecoration(
                            hintText: 'Select date',
                            contentPadding:
                                EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                            border: OutlineInputBorder(
                                borderSide: BorderSide(color: Colors.black54)),
                            isDense: true,
                            suffixIcon:
                                Icon(Icons.calendar_today_outlined, size: 18),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),

                      const Text('Quantity',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black)),
                      const SizedBox(height: 4),
                      _PopupTextField(
                          controller: _expenseQuantityController,
                          keyboardType: TextInputType.number),
                      const SizedBox(height: 8),

                      const Text('Particulars',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black)),
                      const SizedBox(height: 4),
                      _PopupTextField(
                          controller: _expenseParticularsController),
                      const SizedBox(height: 8),

                      const Text('Description',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black)),
                      const SizedBox(height: 4),
                      _PopupTextField(
                          controller: _expenseDescriptionController),
                      const SizedBox(height: 8),

                      const Text('Price',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black)),
                      const SizedBox(height: 4),
                      _PopupTextField(
                          controller: _expensePriceController,
                          keyboardType: TextInputType.number),

                      const Spacer(),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton(
                            onPressed: _closeAddMenu,
                            style: TextButton.styleFrom(
                              minimumSize: const Size(70, 30),
                              foregroundColor: Colors.black,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: const BorderSide(color: Colors.black),
                              ),
                            ),
                            child: const Text('Cancel',
                                style: TextStyle(
                                    fontFamily: 'Poppins', fontSize: 12)),
                          ),
                          const SizedBox(width: 8),
                          TextButton(
                            onPressed: () {
                              // todo: save expense
                              _closeAddMenu();
                            },
                            style: TextButton.styleFrom(
                              minimumSize: const Size(70, 30),
                              backgroundColor: const Color(0xFF8B3B08),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: const Text('Save',
                                style: TextStyle(
                                    fontFamily: 'Poppins', fontSize: 12)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Add Receipt popup
          if (_showAddReceiptForm)
            Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: keyboardInset + 20),
                child: Container(
                  width: 300,
                  height: 380,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.black, width: 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Add Receipt',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.black)),
                      const SizedBox(height: 2),
                      const Text('Upload a receipt image for this wallet.',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black87)),
                      const SizedBox(height: 12),

                      const Text('Receipt image',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          ElevatedButton(
                            onPressed: _pickReceiptImage,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2F4366),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 10),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                                side: const BorderSide(color: Colors.black),
                              ),
                            ),
                            child: const Text('Upload file',
                                style: TextStyle(
                                    fontFamily: 'Poppins', fontSize: 13)),
                          ),
                          const SizedBox(width: 8),
                          if (_receiptImage != null)
                            const Icon(Icons.check_circle,
                                color: Colors.green, size: 20),
                        ],
                      ),
                      const SizedBox(height: 8),

                      const Text('Description',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black)),
                      const SizedBox(height: 4),
                      _PopupTextField(
                          controller: _receiptDescriptionController),
                      const SizedBox(height: 8),

                      const Text('Date',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              color: Colors.black)),
                      const SizedBox(height: 4),
                      SizedBox(
                        height: 40,
                        child: TextField(
                          controller: _receiptDateController,
                          readOnly: true,
                          onTap: _pickReceiptDate,
                          textAlignVertical: TextAlignVertical.center,
                          style: const TextStyle(
                              fontFamily: 'Poppins', fontSize: 13),
                          decoration: const InputDecoration(
                            hintText: 'Select date',
                            contentPadding:
                                EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                            border: OutlineInputBorder(
                                borderSide: BorderSide(color: Colors.black54)),
                            isDense: true,
                            suffixIcon:
                                Icon(Icons.calendar_today_outlined, size: 18),
                          ),
                        ),
                      ),

                      const Spacer(),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton(
                            onPressed: _closeAddMenu,
                            style: TextButton.styleFrom(
                              minimumSize: const Size(70, 30),
                              foregroundColor: Colors.black,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: const BorderSide(color: Colors.black),
                              ),
                            ),
                            child: const Text('Cancel',
                                style: TextStyle(
                                    fontFamily: 'Poppins', fontSize: 12)),
                          ),
                          const SizedBox(width: 8),
                          TextButton(
                            onPressed: () {
                              // todo: save receipt
                              _closeAddMenu();
                            },
                            style: TextButton.styleFrom(
                              minimumSize: const Size(70, 30),
                              backgroundColor: const Color(0xFF8B3B08),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: const Text('Save',
                                style: TextStyle(
                                    fontFamily: 'Poppins', fontSize: 12)),
                          ),
                        ],
                      ),
                    ],
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
            onPressed: _toggleAddMenu,
            backgroundColor: const Color(0xFF2F4366),
            shape: const CircleBorder(
              side: BorderSide(color: Colors.black, width: 1),
            ),
            child: const Icon(Icons.add, size: 32, color: Color(0xFFFFFFFF)),
          ),
        ),
      ),
    );
  }
}

// Simple input used in popup
class _PopupTextField extends StatelessWidget {
  final TextEditingController controller;
  final TextInputType? keyboardType;

  const _PopupTextField({required this.controller, this.keyboardType});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        textAlignVertical: TextAlignVertical.center,
        style: const TextStyle(fontFamily: 'Poppins', fontSize: 13),
        decoration: const InputDecoration(
          contentPadding:
              EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          border:
              OutlineInputBorder(borderSide: BorderSide(color: Colors.black54)),
          isDense: true,
        ),
      ),
    );
  }
}

// Reusable tab widget
class _WalletTab extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _WalletTab(
      {required this.label, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 36,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFF3D58D) : Colors.white,
            borderRadius: BorderRadius.circular(5),
            border: Border.all(
                color:
                    isSelected ? const Color.fromARGB(255, 0, 0, 0) : Colors.black12),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
                fontFamily: 'Poppins',
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.black : Colors.black87),
          ),
        ),
      ),
    );
  }
}

// Small white buttons in the add menu
class _AddMenuButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _AddMenuButton({required this.label, required this.onTap});

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
        child: Text(label,
            style: const TextStyle(
                fontFamily: 'Poppins', fontSize: 13, color: Colors.black)),
      ),
    );
  }
}

// Yellow summary card used in Reports tab
class _ReportSummaryCard extends StatelessWidget {
  final String title;
  final String amountLabel;

  const _ReportSummaryCard({required this.title, required this.amountLabel});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF3D58D),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.black, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  fontFamily: 'Poppins', fontSize: 13, color: Colors.black)),
          const SizedBox(height: 4),
          Text(amountLabel,
              style: const TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Colors.black)),
        ],
      ),
    );
  }
}
