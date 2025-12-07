import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'home_screen.dart';
import 'transaction_history_screen.dart';
import 'wallet_screen.dart';

class ProfileScreen extends StatefulWidget {
  final String orgName;
  final int orgId;

  const ProfileScreen({
    super.key,
    this.orgName = 'Organization',
    this.orgId = 0,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final int _selectedIndex = 3;

  // segmented tab index
  int _selectedOrgTabIndex = 0;

  // controllers for text fields (Organization Information)
  final TextEditingController _orgNameController =
      TextEditingController(text: 'ITUH');
  final TextEditingController _shortNameController =
      TextEditingController(text: 'ITUH');
  final TextEditingController _departmentController =
      TextEditingController(text: 'President');
  final TextEditingController _schoolController =
      TextEditingController(text: 'Laguna State Polytechnic University');

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

  // dummy officers data
  final List<Map<String, String>> _officers = [
    {
      'name': 'Zamuel..',
      'position': 'President',
      'start': 'August 2024',
      'end': 'May 2025',
      'status': 'Active',
    },
    {
      'name': 'Rashed..',
      'position': 'Vice Pre..',
      'start': 'August 2024',
      'end': 'May 2025',
      'status': 'Active',
    },
    {
      'name': 'Rhea M..',
      'position': 'Secretar..',
      'start': 'August 2024',
      'end': 'May 2025',
      'status': 'Active',
    },
  ];

  // organization image (picked from gallery)
  File? _orgImageFile;
  final ImagePicker _picker = ImagePicker();

  // shared horizontal controller for header + body
  final ScrollController _officersHorizontalController = ScrollController();

  Future<void> _pickOrgImage() async {
    final XFile? picked =
        await _picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;

    setState(() {
      _orgImageFile = File(picked.path);
    });
  }

  void _onItemTapped(int index) {
    if (index == _selectedIndex) return;

    Widget nextScreen;
    switch (index) {
      case 0:
        nextScreen = HomeScreen(
          orgName: widget.orgName,
          orgId: widget.orgId,
        );
        break;
      case 1:
        nextScreen = TransactionHistoryScreen(
          orgName: widget.orgName,
          orgId: widget.orgId,
        );
        break;
      case 2:
        nextScreen = const WalletScreen();
        break;
      case 3:
        nextScreen = ProfileScreen(
          orgName: widget.orgName,
          orgId: widget.orgId,
        );
        break;
      default:
        return;
    }

    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder: (_, _, _) => nextScreen,
        transitionDuration: Duration.zero,
        reverseTransitionDuration: Duration.zero,
      ),
    );
  }

  @override
  void dispose() {
    _orgNameController.dispose();
    _shortNameController.dispose();
    _departmentController.dispose();
    _schoolController.dispose();
    _officersHorizontalController.dispose();
    super.dispose();
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
                "Profile",
                style: TextStyle(
                  fontStyle: FontStyle.italic,
                  fontFamily: 'Times New Roman',
                  fontSize: 32,
                  fontWeight: FontWeight.w300,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 24),

              // Organization Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF4EEDF),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Left: circular photo + change button
                    Column(
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Color(0xFFD9D9D9),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: _orgImageFile == null
                              ? const Icon(
                                  Icons.person,
                                  size: 40,
                                  color: Colors.white70,
                                )
                              : Image.file(
                                  _orgImageFile!,
                                  fit: BoxFit.cover,
                                ),
                        ),
                        const SizedBox(height: 8),
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            side: const BorderSide(
                              color: Color(0xFFCCCCCC),
                            ),
                            foregroundColor: Colors.black87,
                            textStyle: const TextStyle(
                              fontSize: 11,
                              fontFamily: 'Poppins',
                            ),
                          ),
                          onPressed: _pickOrgImage,
                          icon: const Icon(
                            Icons.photo_camera_outlined,
                            size: 16,
                          ),
                          label: const Text('Change Photo'),
                        ),
                      ],
                    ),
                    const SizedBox(width: 16),
                    // Right: organization details (summary)
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Organization Name",
                            style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _orgNameController.text,
                            style: const TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            "Department",
                            style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              fontWeight: FontWeight.w400,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _schoolController.text,
                            style: const TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 12,
                              fontWeight: FontWeight.w400,
                              color: Colors.black87,
                              height: 1.3,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFF28A745),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.check_circle,
                                  size: 16,
                                  color: Colors.white,
                                ),
                                SizedBox(width: 4),
                                Text(
                                  "Accredited",
                                  style: TextStyle(
                                    fontFamily: 'Poppins',
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Segmented options
              Container(
                height: 34,
                decoration: BoxDecoration(
                  color: const Color(0xFFF6F2E8),
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Row(
                  children: [
                    _OrgSegmentTab(
                      label: 'Organization Information',
                      isSelected: _selectedOrgTabIndex == 0,
                      onTap: () {
                        setState(() {
                          _selectedOrgTabIndex = 0;
                        });
                      },
                    ),
                    _OrgSegmentTab(
                      label: 'Officers',
                      isSelected: _selectedOrgTabIndex == 1,
                      onTap: () {
                        setState(() {
                          _selectedOrgTabIndex = 1;
                        });
                      },
                    ),
                    _OrgSegmentTab(
                      label: 'Accreditation Details',
                      isSelected: _selectedOrgTabIndex == 2,
                      onTap: () {
                        setState(() {
                          _selectedOrgTabIndex = 2;
                        });
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Content under segmented control
              Expanded(
                child: SingleChildScrollView(
                  child: _buildOrgTabContent(),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  // builds content depending on selected tab
  Widget _buildOrgTabContent() {
    switch (_selectedOrgTabIndex) {
      case 0:
        return _buildOrganizationInformationForm();
      case 1:
        return _buildOfficersSection();
      case 2:
        return _buildAccreditationInfo();
      default:
        return const SizedBox.shrink();
    }
  }

  // ORGANIZATION INFORMATION FORM
  Widget _buildOrganizationInformationForm() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF4EEDF),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Organization Name',
            style: TextStyle(
              fontFamily: 'Poppins',
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _orgNameController,
            decoration: _inputDecoration(),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Organization Shorten Name',
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _shortNameController,
                      decoration: _inputDecoration(),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Department',
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _departmentController,
                      decoration: _inputDecoration(),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'School University',
            style: TextStyle(
              fontFamily: 'Poppins',
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _schoolController,
            decoration: _inputDecoration(),
          ),
          const SizedBox(height: 24),
          Align(
            alignment: Alignment.centerRight,
            child: SizedBox(
              width: 110,
              height: 40,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8B3B08),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                onPressed: () {
                  setState(() {});
                },
                child: const Text(
                  'Edit',
                  style: TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // OFFICERS SECTION (header + button + synced horizontal scroll)
  Widget _buildOfficersSection() {
    const double tableWidth = 600; // total logical width of columns

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header + Add Officer button
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Organization Officers',
              style: TextStyle(
                fontFamily: 'Poppins',
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.black,
              ),
            ),
            SizedBox(
              height: 36,
              child: ElevatedButton(
                onPressed: () {
                  // todo: open add officer flow
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFB75A11),
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  '+ Add Officer',
                  style: TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Card with fixed height; header + body share horizontal controller
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: const Color(0xFFF4EEDF),
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(
                color: Colors.black12,
                offset: Offset(0, 3),
                blurRadius: 5,
              ),
            ],
          ),
          child: Column(
            children: [
              // Header row (horizontal scroll controlled)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                controller: _officersHorizontalController,
                physics: const ClampingScrollPhysics(),
                child: SizedBox(
                  width: tableWidth,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    decoration: const BoxDecoration(
                      color: Color(0xFFE2C98F),
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                      ),
                    ),
                    child: Row(
                      children: const [
                        _HeaderCell('Name', flex: 2),
                        _HeaderCell('Position', flex: 2),
                        _HeaderCell('Term Start'),
                        _HeaderCell('Term End'),
                        _HeaderCell('Status'),
                        _HeaderCell('Actions', flex: 2),
                      ],
                    ),
                  ),
                ),
              ),

              // Body
              SizedBox(
                height: 180,
                child: SingleChildScrollView(
                  scrollDirection: Axis.vertical,
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    controller: _officersHorizontalController,
                    physics: const ClampingScrollPhysics(),
                    child: SizedBox(
                      width: tableWidth,
                      child: Column(
                        children: _officers.map((officer) {
                          return Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 10),
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              border: Border(
                                bottom: BorderSide(
                                  color: Color(0xFFE0E0E0),
                                  width: 0.5,
                                ),
                              ),
                            ),
                            child: Row(
                              children: [
                                _DataCellText(officer['name']!, flex: 2),
                                _DataCellText(officer['position']!, flex: 2),
                                _DataCellText(officer['start']!),
                                _DataCellText(officer['end']!),
                                SizedBox(
                                  width: 110,
                                  child: Align(
                                    alignment: Alignment.centerLeft,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFBDEBC8),
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: Text(
                                        officer['status']!,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontFamily: 'Poppins',
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: Color(0xFF2F7D38),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                SizedBox(
                                  width: 140,
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      _SmallActionButton(
                                        label: 'Edit',
                                        color: const Color(0xFF4BA3FF),
                                        onTap: () {
                                          // edit action
                                        },
                                      ),
                                      const SizedBox(width: 6),
                                      _SmallActionButton(
                                        label: 'Delete',
                                        color: const Color(0xFFFF6B6B),
                                        onTap: () {
                                          // delete action
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ACCREDITATION INFORMATION CARD
  Widget _buildAccreditationInfo() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFFFF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEAD9BC), width: 1),
        boxShadow: const [
          BoxShadow(
            color: Colors.black12,
            offset: Offset(0, 3),
            blurRadius: 6,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text(
            'Accreditation Information',
            style: TextStyle(
              fontFamily: 'Poppins',
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.black,
            ),
          ),
          SizedBox(height: 16),
          _AccreditationRow(
            label: 'Date of Accreditation:',
            value: 'September 15, 2024',
          ),
          Divider(
            height: 24,
            thickness: 1,
            color: Color(0xFFE5E5E5),
          ),
          _AccreditationRow(
            label: 'Current Status:',
            value: 'Accredited',
            valueColor: Color(0xFF2F7D38),
          ),
        ],
      ),
    );
  }

  // shared decoration for all TextFields
  InputDecoration _inputDecoration() {
    return InputDecoration(
      filled: true,
      fillColor: Colors.white,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: Color(0xFFE2D2B7), width: 1),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: Color(0xFFE2D2B7), width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: Color(0xFF8B3B08), width: 1.2),
      ),
    );
  }

  // bottom nav bar
  Widget _buildBottomNavigationBar() {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Colors.black12, width: 1)),
      ),
      child: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: const Color(0xFF8B3B08),
        unselectedItemColor: Colors.black,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        selectedLabelStyle: const TextStyle(
          fontFamily: 'Poppins',
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
        items: [
          _buildNavItem(0, 'Home', iconPaths['home']!),
          _buildNavItem(1, 'History', iconPaths['history']!),
          _buildNavItem(2, 'Wallets', iconPaths['wallet']!),
          _buildNavItem(3, 'Profile', iconPaths['profile']!),
        ],
      ),
    );
  }

  BottomNavigationBarItem _buildNavItem(
    int index,
    String label,
    Map<String, String> icons,
  ) {
    final isSelected = _selectedIndex == index;
    return BottomNavigationBarItem(
      icon: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF8B3B08) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Image.asset(
          isSelected ? icons['active']! : icons['inactive']!,
          height: 28,
          color: isSelected ? Colors.white : Colors.black,
        ),
      ),
      label: label,
    );
  }
}

// Reusable segmented tab widget
class _OrgSegmentTab extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _OrgSegmentTab({
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
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: Colors.black,
            ),
          ),
        ),
      ),
    );
  }
}

// header cell for officers table
class _HeaderCell extends StatelessWidget {
  final String title;
  final int flex;

  const _HeaderCell(this.title, {this.flex = 1});

  double get _width => flex == 2 ? 140 : 110;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _width,
      child: Text(
        title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontFamily: 'Poppins',
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: Colors.black,
        ),
      ),
    );
  }
}

// data cell text
class _DataCellText extends StatelessWidget {
  final String text;
  final int flex;

  const _DataCellText(this.text, {this.flex = 1});

  double get _width => flex == 2 ? 140 : 110;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _width,
      child: Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontFamily: 'Poppins',
          fontSize: 11,
          fontWeight: FontWeight.w400,
          color: Colors.black87,
        ),
      ),
    );
  }
}

// small action buttons (Edit / Delete)
class _SmallActionButton extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _SmallActionButton({
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color, width: 1),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Poppins',
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      ),
    );
  }
}

// row used in accreditation card
class _AccreditationRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _AccreditationRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const SizedBox(width: 4),
        Expanded(
          flex: 2,
          child: Text(
            label,
            style: const TextStyle(
              fontFamily: 'Poppins',
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF7A7A7A),
            ),
          ),
        ),
        Expanded(
          flex: 3,
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontFamily: 'Poppins',
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: valueColor ?? Colors.black,
            ),
          ),
        ),
      ],
    );
  }
}
