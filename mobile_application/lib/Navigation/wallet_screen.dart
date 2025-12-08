import 'package:flutter/material.dart';

import '../api_client.dart';
import 'wallet_month.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  // Loaded from API
  List<WalletFolder> _folders = [];
  bool _isLoading = false;
  String? _errorMessage;

  String _selectedAcademicYear = '';
  List<String> _academicYears = const [];

  @override
  void initState() {
    super.initState();
    _initAcademicYears();
    _loadWalletFolders();
  }

  /// Initialize academic years list (e.g., "2023–2024", "2024–2025", etc.)
  void _initAcademicYears() {
    const int startYear = 2023;
    const int count = 50;
    
    final years = List.generate(count, (index) {
      final int y1 = startYear + index;
      final int y2 = y1 + 1;
      return '$y1–$y2';
    });

    _academicYears = years;
    
    // Set default to 2025–2026
    _selectedAcademicYear = years.firstWhere(
      (ay) => ay == '2025–2026',
      orElse: () => years[0],
    );
  }

  /// Load wallet folders, optionally filtered by Academic Year
  Future<void> _loadWalletFolders() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final apiClient = ApiClient();
      final data = await apiClient.getJsonList('/pres/api/wallets');
      
      List<WalletFolder> folders = [];
      for (var item in data) {
        folders.add(WalletFolder.fromJson(item as Map<String, dynamic>));
      }

      // Filter by academic year (Aug-May)
      final monthOrder = ['08', '09', '10', '11', '12', '01', '02', '03', '04', '05'];
      final parts = _selectedAcademicYear.split('–');
      
      if (parts.length == 2) {
        final startYear = int.parse(parts[0]);
        final endYear = int.parse(parts[1]);
        
        folders = folders.where((w) {
          final year = int.parse(w.month.substring(0, 4));
          final month = w.month.substring(5, 7);
          
          if (!monthOrder.contains(month)) return false;
          
          if (int.parse(month) >= 8 && int.parse(month) <= 12) {
            return year == startYear;
          } else {
            return year == endYear;
          }
        }).toList();
        
        folders.sort((a, b) {
          final aMonth = a.month.substring(5, 7);
          final bMonth = b.month.substring(5, 7);
          return monthOrder.indexOf(aMonth).compareTo(monthOrder.indexOf(bMonth));
        });
      }

      setState(() {
        _folders = folders;
      });
    } catch (e, st) {
      debugPrint('Error loading wallets: $e');
      debugPrint('$st');
      setState(() {
        _errorMessage = 'Failed to load wallets. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
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
                "Wallet",
                style: TextStyle(
                  fontStyle: FontStyle.italic,
                  fontFamily: 'Times New Roman',
                  fontSize: 32,
                  fontWeight: FontWeight.w300,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 8),
              
              // Academic Year Dropdown - SYNCED WITH WEB
              SizedBox(
                height: 28,
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedAcademicYear.isEmpty
                        ? null
                        : _selectedAcademicYear,
                    isDense: true,
                    hint: const Text(
                      'Select AY',
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 11,
                        color: Colors.black,
                      ),
                    ),
                    items: _academicYears
                        .map(
                          (ay) => DropdownMenuItem<String>(
                            value: ay,
                            child: Text(
                              ay,
                              style: const TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 11,
                                height: 1.0,
                                color: Colors.black,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value == null) return;
                      setState(() {
                        _selectedAcademicYear = value;
                      });
                      // Reload wallets when AY changes
                      // This will filter results to match selected AY
                      _loadWalletFolders();
                    },
                    borderRadius: BorderRadius.circular(6),
                    icon: const Icon(
                      Icons.arrow_drop_down,
                      size: 16,
                      color: Colors.black,
                    ),
                    style: const TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 11,
                      color: Colors.black,
                    ),
                    menuMaxHeight: 200,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Expanded(child: _buildBody()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontFamily: 'Poppins',
                fontSize: 13,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: _loadWalletFolders,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_folders.isEmpty) {
      return Center(
        child: Text(
          'No wallet folders found for AY $_selectedAcademicYear.',
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontFamily: 'Poppins',
            fontSize: 13,
            color: Colors.black,
          ),
        ),
      );
    }

    return GridView.builder(
      itemCount: _folders.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 150.74 / 128.13,
      ),
      itemBuilder: (context, index) {
        final folder = _folders[index];
        final name = folder.name;

        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => WalletMonthScreen(
                  month: name,
                  folderId: folder.id,
                ),
              ),
            );
          },
          child: SizedBox(
            width: 150.74,
            height: 128.13,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 3,
                    offset: Offset(0, 1),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(0),
                    child: Image.asset(
                      'assets/Icons/wallet_folder.png',
                      width: 150.74,
                      height: 128.13,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    left: 7,
                    bottom: 7,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.transparent,
                        border: Border.all(color: Colors.black, width: 1),
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: Text(
                        name,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: Colors.black,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

// Model for /pres/api/wallets row
class WalletFolder {
  final int id; // wallet_budgets.id
  final int walletId;
  final String name; // month name (e.g. "DECEMBER")
  final String month; // "2025-12" (YYYY-MM format)
  final double beginningCash;

  WalletFolder({
    required this.id,
    required this.walletId,
    required this.name,
    required this.month,
    required this.beginningCash,
  });

  factory WalletFolder.fromJson(Map<String, dynamic> json) {
    return WalletFolder(
      id: json['id'] as int,
      walletId: json['wallet_id'] as int,
      name: json['name'] as String,
      month: json['month'] as String,
      beginningCash: (json['beginning_cash'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
