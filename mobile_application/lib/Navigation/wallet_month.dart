import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';

class WalletMonthScreen extends StatefulWidget {
  final String month;

  const WalletMonthScreen({super.key, required this.month});

  @override
  State<WalletMonthScreen> createState() => WalletMonthScreenState();
}

class WalletMonthScreenState extends State<WalletMonthScreen> {
  // Sort state
  String sortFilter = 'Expense';
  String sortOrder = 'New to old';
  final GlobalKey sortKey = GlobalKey();

  bool showAddMenu = false;
  bool showAddIncomeForm = false;
  bool showAddExpenseForm = false;
  bool showAddReceiptForm = false;

  // Tabs: 0 Transaction, 1 Reports, 2 Receipts, 3 Archive
  int selectedTabIndex = 0;

  // Controllers – Income
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

  // Controllers – Expense
  final TextEditingController expenseDateController = TextEditingController();
  final TextEditingController expenseQuantityController =
      TextEditingController();
  final TextEditingController expenseParticularsController =
      TextEditingController();
  final TextEditingController expenseDescriptionController =
      TextEditingController();
  final TextEditingController expensePriceController = TextEditingController();

  // Controllers – Receipt
  final TextEditingController receiptDescriptionController =
      TextEditingController();
  final TextEditingController receiptDateController = TextEditingController();
  final ImagePicker receiptPicker = ImagePicker();
  File? receiptImage;

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
    super.dispose();
  }

  // SORT MENU
  void showSortMenu() {
    final renderBox =
        sortKey.currentContext?.findRenderObject() as RenderBox?;
    if (renderBox == null) return;

    final overlay = Overlay.of(context);
    final overlayBox = overlay.context.findRenderObject() as RenderBox;
    final position =
        renderBox.localToGlobal(Offset.zero, ancestor: overlayBox);

    late OverlayEntry entry;

    entry = OverlayEntry(
      builder: (_) => Stack(
        children: [
          GestureDetector(
            onTap: entry.remove,
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
              child: buildSortMenuContent(entry),
            ),
          ),
        ],
      ),
    );

    overlay.insert(entry);
  }

  Widget buildSortMenuContent(OverlayEntry entry) {
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
          const Text(
            'Sort by',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 6),
          buildMenuRow('All', entry, isFilter: true),
          buildMenuRow('Expense', entry, isFilter: true),
          buildMenuRow('Income', entry, isFilter: true),
          const Divider(height: 14, thickness: 1),
          buildMenuRow('New to old', entry, isFilter: false),
          buildMenuRow('Old to new', entry, isFilter: false),
        ],
      ),
    );
  }

  Widget buildMenuRow(
    String label,
    OverlayEntry entry, {
    required bool isFilter,
  }) {
    final bool selected =
        isFilter ? sortFilter == label : sortOrder == label;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        setState(() {
          if (isFilter) {
            sortFilter = label;
          } else {
            sortOrder = label;
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

  // ADD MENU HANDLERS
  void toggleAddMenu() {
    setState(() {
      showAddIncomeForm = false;
      showAddExpenseForm = false;
      showAddReceiptForm = false;
      showAddMenu = !showAddMenu;
    });
  }

  void closeAddMenu() {
    if (showAddMenu ||
        showAddIncomeForm ||
        showAddExpenseForm ||
        showAddReceiptForm) {
      setState(() {
        showAddMenu = false;
        showAddIncomeForm = false;
        showAddExpenseForm = false;
        showAddReceiptForm = false;
      });
    }
  }

  void openAddIncomeForm() {
    setState(() {
      showAddMenu = false;
      showAddIncomeForm = true;
      showAddExpenseForm = false;
      showAddReceiptForm = false;
    });
  }

  void openAddExpenseForm() {
    setState(() {
      showAddMenu = false;
      showAddIncomeForm = false;
      showAddExpenseForm = true;
      showAddReceiptForm = false;
    });
  }

  void openAddReceiptForm() {
    setState(() {
      showAddMenu = false;
      showAddIncomeForm = false;
      showAddExpenseForm = false;
      showAddReceiptForm = true;
    });
  }

  // PICKERS
  Future<void> pickDateIssued() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      final formatted = DateFormat('yyyy-MM-dd').format(picked);
      setState(() => dateIssuedController.text = formatted);
    }
  }

  Future<void> pickExpenseDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      final formatted = DateFormat('yyyy-MM-dd').format(picked);
      setState(() => expenseDateController.text = formatted);
    }
  }

  Future<void> pickReceiptDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      final formatted = DateFormat('yyyy-MM-dd').format(picked);
      setState(() => receiptDateController.text = formatted);
    }
  }

  Future<void> pickReceiptImage() async {
    final XFile? picked =
        await receiptPicker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;
    setState(() => receiptImage = File(picked.path));
  }

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
                  // Segmented TABS
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
                          onTap: () =>
                              setState(() => selectedTabIndex = 0),
                        ),
                        SegmentTab(
                          label: 'Reports',
                          isSelected: selectedTabIndex == 1,
                          onTap: () =>
                              setState(() => selectedTabIndex = 1),
                        ),
                        SegmentTab(
                          label: 'Receipts',
                          isSelected: selectedTabIndex == 2,
                          onTap: () =>
                              setState(() => selectedTabIndex = 2),
                        ),
                        SegmentTab(
                          label: 'Archive',
                          isSelected: selectedTabIndex == 3,
                          onTap: () =>
                              setState(() => selectedTabIndex = 3),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Sort by row ONLY for Transaction tab
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
                          // TRANSACTION TAB EMPTY STATE
                          return Align(
                            alignment: Alignment.center,
                            child: Padding(
                              padding:
                                  const EdgeInsets.only(bottom: 100),
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
                        } else if (selectedTabIndex == 1) {
                          // REPORTS TAB – UPDATED DESIGN
                          return SingleChildScrollView(
                            padding:
                                const EdgeInsets.only(bottom: 100),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Gradient Generate Financial Report card
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(14),
                                  margin:
                                      const EdgeInsets.only(bottom: 16),
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
                                    border: Border.all(
                                      color: Colors.black,
                                      width: 1,
                                    ),
                                  ),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      // reports.png without inner square
                                      Image.asset(
                                        'assets/Icons/reports.png',
                                        width: 52.47,
                                        height: 41.52,
                                        fit: BoxFit.contain,
                                      ),
                                      const SizedBox(width: 10),
                                      // Title, subtitle and button stacked vertically
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Text(
                                              'Generate Financial Report',
                                              style: TextStyle(
                                                fontFamily: 'Poppins',
                                                fontSize: 14,
                                                fontWeight:
                                                    FontWeight.w600,
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
                                            const SizedBox(height: 10),
                                            SizedBox(
                                              height: 20,
                                              child: ElevatedButton(
                                                onPressed: () {
                                                  // todo: generate report logic
                                                },
                                                style:
                                                    ElevatedButton.styleFrom(
                                                  backgroundColor:
                                                      Colors.white,
                                                  foregroundColor:
                                                      Colors.black,
                                                  elevation: 0,
                                                  padding:
                                                      const EdgeInsets
                                                          .symmetric(
                                                    horizontal: 5,
                                                    vertical: 2,
                                                  ),
                                                  shape:
                                                      RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius
                                                            .circular(4),
                                                    side: const BorderSide(
                                                      color: Colors.black,
                                                      width: 1,
                                                    ),
                                                  ),
                                                ),
                                                child: const Text(
                                                  'Generate Report',
                                                  style: TextStyle(
                                                    fontFamily: 'Poppins',
                                                    fontSize: 12,
                                                    fontWeight:
                                                        FontWeight.w600,
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
                                // Summary cards in 2x2 grid like image
                                Row(
                                  children: const [
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
                                Row(
                                  children: const [
                                    Expanded(
                                      child: ReportSummaryCard(
                                        title:
                                            'Total amount of expenses',
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
                        } else if (selectedTabIndex == 2) {
                          // RECEIPTS TAB
                          return const Center(
                            child: Text(
                              'No receipts yet',
                              style: TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 14,
                                color: Colors.black,
                              ),
                            ),
                          );
                        } else {
                          // ARCHIVE TAB
                          return const Center(
                            child: Text(
                              'No archived items yet',
                              style: TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 14,
                                color: Colors.black,
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

          // Dark overlay
          if (showAddMenu ||
              showAddIncomeForm ||
              showAddExpenseForm ||
              showAddReceiptForm)
            Positioned.fill(
              child: GestureDetector(
                onTap: closeAddMenu,
                child: Container(
                  color: Colors.black.withValues(alpha: 0.4),
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
                    onTap: openAddIncomeForm,
                  ),
                  const SizedBox(height: 8),
                  AddMenuButton(
                    label: 'Add Expense',
                    onTap: openAddExpenseForm,
                  ),
                  const SizedBox(height: 8),
                  AddMenuButton(
                    label: 'Add Receipt',
                    onTap: openAddReceiptForm,
                  ),
                ],
              ),
            ),

          // Add Income popup
          if (showAddIncomeForm)
            Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: keyboardInset + 20),
                child: Container(
                  width: 300,
                  height: 461,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.black, width: 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Add Income Transaction',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Record an income transaction for this wallet.',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Date Issued',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      SizedBox(
                        height: 40,
                        child: TextField(
                          controller: dateIssuedController,
                          readOnly: true,
                          onTap: pickDateIssued,
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
                              borderSide:
                                  BorderSide(color: Colors.black54),
                            ),
                            isDense: true,
                            suffixIcon: Icon(
                              Icons.calendar_today_outlined,
                              size: 18,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Quantity',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      PopupTextField(
                        controller: quantityController,
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Type of Income',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      SizedBox(
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
                            setState(() => selectedIncomeType = value);
                          },
                          decoration: const InputDecoration(
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 8,
                            ),
                            border: OutlineInputBorder(
                              borderSide:
                                  BorderSide(color: Colors.black54),
                            ),
                            isDense: true,
                            hintText: 'Select Type',
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Description',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      PopupTextField(controller: descriptionController),
                      const SizedBox(height: 8),
                      const Text(
                        'Price',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      PopupTextField(
                        controller: priceController,
                        keyboardType: TextInputType.number,
                      ),
                      const Spacer(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton(
                            onPressed: closeAddMenu,
                            style: TextButton.styleFrom(
                              minimumSize: const Size(70, 30),
                              foregroundColor: Colors.black,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: const BorderSide(
                                  color: Colors.black,
                                ),
                              ),
                            ),
                            child: const Text(
                              'Cancel',
                              style: TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          TextButton(
                            onPressed: () {
                              // todo: save income
                              closeAddMenu();
                            },
                            style: TextButton.styleFrom(
                              minimumSize: const Size(70, 30),
                              backgroundColor: const Color(0xFF8B3B08),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: const Text(
                              'Save',
                              style: TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Add Expense popup
          if (showAddExpenseForm)
            Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: keyboardInset + 20),
                child: Container(
                  width: 300,
                  height: 461,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.black, width: 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Add Expense Transaction',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Record an expense transaction for this wallet.',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Date Issued',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      SizedBox(
                        height: 40,
                        child: TextField(
                          controller: expenseDateController,
                          readOnly: true,
                          onTap: pickExpenseDate,
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
                              borderSide:
                                  BorderSide(color: Colors.black54),
                            ),
                            isDense: true,
                            suffixIcon: Icon(
                              Icons.calendar_today_outlined,
                              size: 18,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Quantity',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      PopupTextField(
                        controller: expenseQuantityController,
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Particulars',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      PopupTextField(
                        controller: expenseParticularsController,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Description',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      PopupTextField(
                        controller: expenseDescriptionController,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Price',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      PopupTextField(
                        controller: expensePriceController,
                        keyboardType: TextInputType.number,
                      ),
                      const Spacer(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton(
                            onPressed: closeAddMenu,
                            style: TextButton.styleFrom(
                              minimumSize: const Size(70, 30),
                              foregroundColor: Colors.black,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: const BorderSide(
                                  color: Colors.black,
                                ),
                              ),
                            ),
                            child: const Text(
                              'Cancel',
                              style: TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          TextButton(
                            onPressed: () {
                              // todo: save expense
                              closeAddMenu();
                            },
                            style: TextButton.styleFrom(
                              minimumSize: const Size(70, 30),
                              backgroundColor: const Color(0xFF8B3B08),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: const Text(
                              'Save',
                              style: TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Add Receipt popup
          if (showAddReceiptForm)
            Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: keyboardInset + 20),
                child: Container(
                  width: 300,
                  height: 380,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.black, width: 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Add Receipt',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Upload a receipt image for this wallet.',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Receipt image',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          ElevatedButton(
                            onPressed: pickReceiptImage,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2F4366),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 10,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                                side: const BorderSide(
                                  color: Colors.black,
                                ),
                              ),
                            ),
                            child: const Text(
                              'Upload file',
                              style: TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 13,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (receiptImage != null)
                            const Icon(
                              Icons.check_circle,
                              color: Colors.green,
                              size: 20,
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Description',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      PopupTextField(
                        controller: receiptDescriptionController,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Date',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      SizedBox(
                        height: 40,
                        child: TextField(
                          controller: receiptDateController,
                          readOnly: true,
                          onTap: pickReceiptDate,
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
                              borderSide:
                                  BorderSide(color: Colors.black54),
                            ),
                            isDense: true,
                            suffixIcon: Icon(
                              Icons.calendar_today_outlined,
                              size: 18,
                            ),
                          ),
                        ),
                      ),
                      const Spacer(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton(
                            onPressed: closeAddMenu,
                            style: TextButton.styleFrom(
                              minimumSize: const Size(70, 30),
                              foregroundColor: Colors.black,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: const BorderSide(
                                  color: Colors.black,
                                ),
                              ),
                            ),
                            child: const Text(
                              'Cancel',
                              style: TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          TextButton(
                            onPressed: () {
                              // todo: save receipt
                              closeAddMenu();
                            },
                            style: TextButton.styleFrom(
                              minimumSize: const Size(70, 30),
                              backgroundColor: const Color(0xFF8B3B08),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: const Text(
                              'Save',
                              style: TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 12,
                              ),
                            ),
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
}

// Reusable widgets

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
            borderSide: BorderSide(color: Colors.black54),
          ),
          isDense: true,
        ),
      ),
    );
  }
}

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
    return SizedBox(
      height: 60, // keep consistent box height
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(12, 12, 2, 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFF3D58D), 
          width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment:
              MainAxisAlignment.spaceBetween, // pushes Php 0.00 to bottom
          children: [
            Text(
              title,
              style: const TextStyle(
                fontFamily: 'Poppins',
                fontSize: 11,
                color: Colors.black87,
              ),
            ),
            Text(
              amountLabel,
              style: const TextStyle(
                fontFamily: 'Poppins',
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
