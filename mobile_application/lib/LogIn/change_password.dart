import 'package:flutter/material.dart';

class NewPasswordScreen extends StatefulWidget {
  const NewPasswordScreen({super.key});

  @override
  State<NewPasswordScreen> createState() => _NewPasswordScreenState();
}

class _NewPasswordScreenState extends State<NewPasswordScreen>
    with TickerProviderStateMixin {
  final TextEditingController pass = TextEditingController();
  final TextEditingController confirmPass = TextEditingController();

  bool error = false;

  late AnimationController _passController;
  late AnimationController _confirmController;
  late Animation<double> _passShake;
  late Animation<double> _confirmShake;

  @override
  void initState() {
    super.initState();

    _passController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _confirmController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    // Consistent shake effect as in login screen
    _passShake = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: -4.0), weight: 1),
      TweenSequenceItem(tween: Tween(begin: -4.0, end: 4.0), weight: 2),
      TweenSequenceItem(tween: Tween(begin: 4.0, end: -4.0), weight: 2),
      TweenSequenceItem(tween: Tween(begin: -4.0, end: 0.0), weight: 1),
    ]).animate(_passController);
    _confirmShake = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: -4.0), weight: 1),
      TweenSequenceItem(tween: Tween(begin: -4.0, end: 4.0), weight: 2),
      TweenSequenceItem(tween: Tween(begin: 4.0, end: -4.0), weight: 2),
      TweenSequenceItem(tween: Tween(begin: -4.0, end: 0.0), weight: 1),
    ]).animate(_confirmController);
  }

  void submit() {
    setState(() {
      error = pass.text != confirmPass.text || pass.text.isEmpty;
    });

    if (error) {
      _passController.forward(from: 0);
      _confirmController.forward(from: 0);
      return;
    }
    Navigator.pushReplacementNamed(context, "/home");
  }

  @override
  void dispose() {
    _passController.dispose();
    _confirmController.dispose();
    pass.dispose();
    confirmPass.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: LayoutBuilder(
        builder: (context, constraints) {
          return SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 28),
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minHeight: constraints.maxHeight,
                      ),
                      child: IntrinsicHeight(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 40),
                            const Center(
                              child: Text(
                                "New Password",
                                style: TextStyle(
                                  fontFamily: "Poppins",
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Center(
                              child: Text(
                                "Create new password to sign in to your account.",
                                style: TextStyle(
                                  fontFamily: "Poppins",
                                  fontSize: 13,
                                  color: Colors.black87,
                                ),
                              ),
                            ),
                            const SizedBox(height: 40),
                            const Text(
                              "Password",
                              style: TextStyle(
                                  fontFamily: "Poppins", fontSize: 14),
                            ),
                            const SizedBox(height: 5),
                            AnimatedBuilder(
                              animation: _passShake,
                              builder: (context, child) {
                                return Transform.translate(
                                  offset: Offset(_passShake.value, 0),
                                  child: child,
                                );
                              },
                              child: TextField(
                                controller: pass,
                                obscureText: true,
                                cursorColor: Colors.black,
                                decoration: InputDecoration(
                                  border: const OutlineInputBorder(),
                                  enabledBorder: OutlineInputBorder(
                                    borderSide: const BorderSide(
                                        color: Colors.grey, width: 1),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderSide: const BorderSide(
                                        color: Color(0xFFE59E2C), width: 1),
                                  ),
                                  errorBorder: OutlineInputBorder(
                                    borderSide: const BorderSide(
                                        color: Colors.red, width: 1),
                                  ),
                                  focusedErrorBorder: OutlineInputBorder(
                                    borderSide: const BorderSide(
                                        color: Color(0xFFE59E2C), width: 1),
                                  ),
                                  errorText: error ? "Passwords do not match." : null,
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
                            const Text(
                              "Confirm Password",
                              style: TextStyle(
                                  fontFamily: "Poppins", fontSize: 14),
                            ),
                            const SizedBox(height: 5),
                            AnimatedBuilder(
                              animation: _confirmShake,
                              builder: (context, child) {
                                return Transform.translate(
                                  offset: Offset(_confirmShake.value, 0),
                                  child: child,
                                );
                              },
                              child: TextField(
                                controller: confirmPass,
                                obscureText: true,
                                cursorColor: Colors.black,
                                decoration: InputDecoration(
                                  border: const OutlineInputBorder(),
                                  enabledBorder: OutlineInputBorder(
                                    borderSide: const BorderSide(
                                        color: Colors.grey, width: 1),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderSide: const BorderSide(
                                        color: Color(0xFFE59E2C), width: 1),
                                  ),
                                  errorBorder: OutlineInputBorder(
                                    borderSide: const BorderSide(
                                        color: Colors.red, width: 1),
                                  ),
                                  focusedErrorBorder: OutlineInputBorder(
                                    borderSide: const BorderSide(
                                        color: Color(0xFFE59E2C), width: 1),
                                  ),
                                  errorText: error ? "Passwords do not match." : null,
                                ),
                              ),
                            ),
                            const Spacer(),
                            const SizedBox(height: 12),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 0, 28, 28),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF3D58D),
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                          side: const BorderSide(color: Colors.black),
                        ),
                      ),
                      child: const Text(
                        "Submit",
                        style: TextStyle(
                          fontFamily: "Poppins",
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}