import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

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
  int _selectedOrgTabIndex = 0;

  // edit mode for Organization Information section
  bool _isEditingOrgInfo = false;

  // controllers for text fields (Organization Information)
  final TextEditingController _orgNameController = TextEditingController();
  final TextEditingController _shortNameController = TextEditingController();
  final TextEditingController _departmentController = TextEditingController();
  final TextEditingController _schoolController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();

  // officers data (starts empty)
  final List<Map<String, String>> _officers = [];

  // organization image (picked from gallery)
  File? _orgImageFile;
  final ImagePicker _picker = ImagePicker();

  // shared horizontal controller for officers table
  final ScrollController _officersHorizontalController = ScrollController();

  Future<void> _pickOrgImage() async {
    final XFile? picked =
        await _picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;

    setState(() {
      _orgImageFile = File(picked.path);
    });
  }

  @override
  void dispose() {
    _orgNameController.dispose();
    _shortNameController.dispose();
    _departmentController.dispose();
    _schoolController.dispose();
    _emailController.dispose();
    _officersHorizontalController.dispose();
    super.dispose();
  }

  // open Add Officer dialog
  Future<void> _openAddOfficerDialog() async {
    final nameController = TextEditingController();
    final positionController = TextEditingController();
    DateTime? termStart;
    DateTime? termEnd;
    String status = 'Active';

    Future<void> pickDate(bool isStart) async {
      final now = DateTime.now();
      final picked = await showDatePicker(
        context: context,
        initialDate: now,
        firstDate: DateTime(now.year - 5),
        lastDate: DateTime(now.year + 5),
      );
      if (picked != null) {
        if (isStart) {
          termStart = picked;
        } else {
          termEnd = picked;
        }
      }
    }

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return Dialog(
          insetPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: StatefulBuilder(
            builder: (context, setStateDialog) {
              String formatDate(DateTime? d) =>
                  d == null ? '----------' : '${d.month}/${d.day}/${d.year}';

              return Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Add Officer',
                          style: TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Colors.black,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Divider(height: 1),

                    const SizedBox(height: 16),
                    const Text(
                      'Name',
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        hintText: 'Enter officer name',
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(8)),
                          borderSide:
                              BorderSide(color: Color(0xFFE2D2B7), width: 1),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(8)),
                          borderSide:
                              BorderSide(color: Color(0xFFE2D2B7), width: 1),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(8)),
                          borderSide:
                              BorderSide(color: Color(0xFF8B3B08), width: 1.2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Position',
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: positionController,
                      decoration: const InputDecoration(
                        hintText: 'Enter position',
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(8)),
                          borderSide:
                              BorderSide(color: Color(0xFFE2D2B7), width: 1),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(8)),
                          borderSide:
                              BorderSide(color: Color(0xFFE2D2B7), width: 1),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(8)),
                          borderSide:
                              BorderSide(color: Color(0xFF8B3B08), width: 1.2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Term Start',
                                style: TextStyle(
                                  fontFamily: 'Poppins',
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 6),
                              InkWell(
                                onTap: () async {
                                  await pickDate(true);
                                  setStateDialog(() {});
                                },
                                child: Container(
                                  height: 42,
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: const Color(0xFFE2D2B7),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        formatDate(termStart),
                                        style: const TextStyle(
                                          fontFamily: 'Poppins',
                                          fontSize: 13,
                                          color: Colors.black87,
                                        ),
                                      ),
                                      const Icon(
                                        Icons.calendar_today_outlined,
                                        size: 18,
                                        color: Colors.black54,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Term End',
                                style: TextStyle(
                                  fontFamily: 'Poppins',
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 6),
                              InkWell(
                                onTap: () async {
                                  await pickDate(false);
                                  setStateDialog(() {});
                                },
                                child: Container(
                                  height: 42,
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: const Color(0xFFE2D2B7),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        formatDate(termEnd),
                                        style: const TextStyle(
                                          fontFamily: 'Poppins',
                                          fontSize: 13,
                                          color: Colors.black87,
                                        ),
                                      ),
                                      const Icon(
                                        Icons.calendar_today_outlined,
                                        size: 18,
                                        color: Colors.black54,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Status',
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: const Color(0xFFE2D2B7),
                        ),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: status,
                          isExpanded: true,
                          items: const [
                            DropdownMenuItem(
                              value: 'Active',
                              child: Text('Active'),
                            ),
                            DropdownMenuItem(
                              value: 'Inactive',
                              child: Text('Inactive'),
                            ),
                          ],
                          onChanged: (val) {
                            if (val == null) return;
                            setStateDialog(() {
                              status = val;
                            });
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Divider(height: 1),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        SizedBox(
                          height: 40,
                          child: TextButton(
                            style: TextButton.styleFrom(
                              backgroundColor: const Color(0xFFE0E0E0),
                              foregroundColor: Colors.black87,
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 20),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            onPressed: () => Navigator.pop(context),
                            child: const Text(
                              'Cancel',
                              style: TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        SizedBox(
                          height: 40,
                          child: TextButton(
                            style: TextButton.styleFrom(
                              backgroundColor: const Color(0xFF28A745),
                              foregroundColor: Colors.white,
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 24),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            onPressed: () {
                              if (nameController.text.trim().isEmpty ||
                                  positionController.text.trim().isEmpty) {
                                return;
                              }
                              setState(() {
                                _officers.add({
                                  'name': nameController.text.trim(),
                                  'position': positionController.text.trim(),
                                  'start': termStart == null
                                      ? '-'
                                      : '${termStart!.month}/${termStart!.day}/${termStart!.year}',
                                  'end': termEnd == null
                                      ? '-'
                                      : '${termEnd!.month}/${termEnd!.day}/${termEnd!.year}',
                                  'status': status,
                                });
                              });
                              Navigator.pop(context);
                            },
                            child: const Text(
                              'Save Officer',
                              style: TextStyle(
                                fontFamily: 'Poppins',
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
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

              // Organization card
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
                    // Left: photo + button
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
                    // Right: details
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
                            _orgNameController.text.isEmpty
                                ? '-'
                                : _orgNameController.text,
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
                            _schoolController.text.isEmpty
                                ? '-'
                                : _schoolController.text,
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

              // Segmented tabs
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

              Expanded(
                child: SingleChildScrollView(
                  child: _buildOrgTabContent(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Content switcher
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

  Widget _buildOrganizationInformationForm() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color.fromARGB(255, 255, 255, 255),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFECDDC6), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Organization Name',
            style: TextStyle(
              fontFamily: 'Poppins',
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _orgNameController,
            readOnly: true,
            decoration: _inputDecoration().copyWith(
              filled: true,
              fillColor: const Color(0xFFF5F5F5),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Org. Shorten Name',
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _shortNameController,
                      readOnly: !_isEditingOrgInfo,
                      decoration: _inputDecoration().copyWith(
                        filled: true,
                        fillColor: _isEditingOrgInfo
                            ? Colors.white
                            : const Color(0xFFF9F7F2),
                      ),
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
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _departmentController,
                      readOnly: true,
                      decoration: _inputDecoration().copyWith(
                        filled: true,
                        fillColor: const Color(0xFFF9F7F2),
                      ),
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
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _schoolController,
            readOnly: true,
            decoration: _inputDecoration().copyWith(
              filled: true,
              fillColor: const Color(0xFFF9F7F2),
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'Email',
            style: TextStyle(
              fontFamily: 'Poppins',
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _emailController,
            readOnly: !_isEditingOrgInfo,
            keyboardType: TextInputType.emailAddress,
            decoration: _inputDecoration().copyWith(
              filled: true,
              fillColor:
                  _isEditingOrgInfo ? Colors.white : const Color(0xFFF9F7F2),
            ),
          ),
          const SizedBox(height: 24),
          Align(
            alignment: Alignment.centerRight,
            child: _isEditingOrgInfo
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        height: 40,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF28A745),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          onPressed: () {
                            setState(() {
                              _isEditingOrgInfo = false;
                            });
                          },
                          child: const Text(
                            'Save Changes',
                            style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        height: 40,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE0E0E0),
                            foregroundColor: Colors.black54,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          onPressed: () {
                            setState(() {
                              _isEditingOrgInfo = false;
                            });
                          },
                          child: const Text(
                            'Cancel',
                            style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  )
                : SizedBox(
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
                        setState(() {
                          _isEditingOrgInfo = true;
                        });
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

  Widget _buildOfficersSection() {
    final double tableWidth = MediaQuery.of(context).size.width - 40;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
                onPressed: _openAddOfficerDialog,
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
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            controller: _officersHorizontalController,
            physics: const ClampingScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(minWidth: tableWidth),
              child: Column(
                children: [
                  Container(
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
                  SizedBox(
                    height: 180,
                    child: _officers.isEmpty
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: Text(
                                'No officers added yet.',
                                style: TextStyle(
                                  fontFamily: 'Poppins',
                                  fontSize: 12,
                                  color: Colors.black54,
                                ),
                              ),
                            ),
                          )
                        : SingleChildScrollView(
                            scrollDirection: Axis.vertical,
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
                                      _DataCellText(
                                          officer['position']!, flex: 2),
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
                                              borderRadius:
                                                  BorderRadius.circular(16),
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
                                          mainAxisAlignment:
                                              MainAxisAlignment.end,
                                          children: [
                                            _SmallActionButton(
                                              label: 'Edit',
                                              color: const Color(0xFF4BA3FF),
                                              onTap: () {},
                                            ),
                                            const SizedBox(width: 6),
                                            _SmallActionButton(
                                              label: 'Delete',
                                              color: const Color(0xFFFF6B6B),
                                              onTap: () {},
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
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

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

  InputDecoration _inputDecoration() {
    return const InputDecoration(
      filled: true,
      fillColor: Colors.white,
      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(6)),
        borderSide: BorderSide(color: Color(0xFFE2D2B7), width: 1),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(6)),
        borderSide: BorderSide(color: Color(0xFFE2D2B7), width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(6)),
        borderSide: BorderSide(color: Color(0xFF8B3B08), width: 1.2),
      ),
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
