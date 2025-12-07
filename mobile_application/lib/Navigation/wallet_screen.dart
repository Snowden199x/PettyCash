import 'package:flutter/material.dart';
import 'wallet_month.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final List<String> _months = [
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER',
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
  ];

  String _selectedAcademicYear = '';
  List<String> _academicYears = const [];

  @override
  void initState() {
    super.initState();
    _initAcademicYears();
  }

  void _initAcademicYears() {
    const int startYear = 2020;
    const int count = 50;
    final years = List.generate(count, (index) {
      final int y1 = startYear + index;
      final int y2 = y1 + 1;
      return '$y1–$y2';
    });

    _academicYears = years;
    _selectedAcademicYear =
        years.firstWhere((ay) => ay == '2025–2026', orElse: () => years[0]);
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
              Expanded(
                child: GridView.builder(
                  itemCount: _months.length,
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 150.74 / 128.13,
                  ),
                  itemBuilder: (context, index) {
                    final name = _months[index];
                    return GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => WalletMonthScreen(month: name),
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
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.transparent,
                                    border: Border.all(
                                        color: Colors.black, width: 1),
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
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
