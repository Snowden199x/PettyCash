import 'package:flutter/material.dart';

class CreateIdScreen extends StatefulWidget {
  const CreateIdScreen({super.key});

  @override
  State<CreateIdScreen> createState() => _CreateIdScreenState();
}

class _CreateIdScreenState extends State<CreateIdScreen> {
  // Controllers
  final TextEditingController orgNameController = TextEditingController();
  final TextEditingController shortOrgNameController = TextEditingController();
  final TextEditingController deptController = TextEditingController();
  final TextEditingController schoolController = TextEditingController();

  // Values for live preview
  String displayedName = '';
  String displayedDept = '';

  @override
  void initState() {
    super.initState();
    orgNameController.addListener(() {
      setState(() => displayedName = orgNameController.text);
    });
    deptController.addListener(() {
      setState(() => displayedDept = deptController.text);
    });
  }

  @override
  void dispose() {
    orgNameController.dispose();
    shortOrgNameController.dispose();
    deptController.dispose();
    schoolController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final smallInputDecoration = InputDecoration(
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: Colors.black),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: Colors.black, width: 1.5),
      ),
    );

    final normalInputDecoration = InputDecoration(
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: Colors.black),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: Colors.black, width: 1.5),
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create ID'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // === TOP CARD PREVIEW ===
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3E0C8),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const CircleAvatar(
                      radius: 50,
                      backgroundColor: Colors.grey,
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hi, ${displayedName.isEmpty ? "[name]" : displayedName}',
                            style: const TextStyle(
                              fontStyle: FontStyle.italic,
                              fontSize: 16,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Org Name',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                          ),
                          const SizedBox(height: 6),
                          SizedBox(
                            width: 160,
                            height: 32,
                            child: TextField(
                              controller: orgNameController,
                              decoration: smallInputDecoration,
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'Department',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                          ),
                          const SizedBox(height: 6),
                          SizedBox(
                            width: 160,
                            height: 32,
                            child: TextField(
                              controller: deptController,
                              decoration: smallInputDecoration,
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),

              // === LOWER FORM SECTION ===
              const Text('Name of the Organization',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              const SizedBox(height: 6),
              TextField(controller: orgNameController, decoration: normalInputDecoration),
              const SizedBox(height: 16),

              const Text('Shortened Name of the Organization',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              const SizedBox(height: 6),
              TextField(controller: shortOrgNameController, decoration: normalInputDecoration),
              const SizedBox(height: 16),

              const Text('Department',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              const SizedBox(height: 6),
              TextField(controller: deptController, decoration: normalInputDecoration),
              const SizedBox(height: 16),

              const Text('School',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              const SizedBox(height: 6),
              TextField(controller: schoolController, decoration: normalInputDecoration),
              const SizedBox(height: 30),

              // === CONTINUE BUTTON ===
              ElevatedButton(
                onPressed: () {
                  // ✅ Navigate to HomeScreen via named route
                  Navigator.pushNamed(
                    context,
                    '/home',
                    arguments: orgNameController.text,
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF3E0C8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Text(
                    'Sign up',
                    style: TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                    ),
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
