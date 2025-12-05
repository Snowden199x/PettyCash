import 'package:flutter/material.dart';
import 'forgot_password.dart'; // Correct relative import for your folder structure

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  bool emailError = false;
  bool passwordError = false;

  late AnimationController _emailController;
  late AnimationController _passwordController;
  late Animation<double> _emailShake;
  late Animation<double> _passwordShake;

  @override
  void initState() {
    super.initState();

    _emailController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _passwordController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _emailShake = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: -4.0), weight: 1),
      TweenSequenceItem(tween: Tween(begin: -4.0, end: 4.0), weight: 2),
      TweenSequenceItem(tween: Tween(begin: 4.0, end: -4.0), weight: 2),
      TweenSequenceItem(tween: Tween(begin: -4.0, end: 0.0), weight: 1),
    ]).animate(_emailController);
    _passwordShake = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: -4.0), weight: 1),
      TweenSequenceItem(tween: Tween(begin: -4.0, end: 4.0), weight: 2),
      TweenSequenceItem(tween: Tween(begin: 4.0, end: -4.0), weight: 2),
      TweenSequenceItem(tween: Tween(begin: -4.0, end: 0.0), weight: 1),
    ]).animate(_passwordController);
  }

  void _validateAndLogin() {
    setState(() {
      emailError = emailController.text.isEmpty;
      passwordError = passwordController.text.isEmpty;
    });

    if (emailError) _emailController.forward(from: 0);
    if (passwordError) _passwordController.forward(from: 0);

    if (emailError || passwordError) return;

    Navigator.pushNamed(context, '/new-password');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: false,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 30),
                // Header
                const Center(
                  child: Text(
                    'Log In',
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 18,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ),
                const SizedBox(height: 40),
                // Icon at the top
                Center(
                  child: Image.asset(
                    'assets/Icons/wallet-icon2.png',
                    height: 160,
                  ),
                ),
                const SizedBox(height: 40),
                // Username label
                const Text(
                  "Username",
                  style: TextStyle(fontFamily: "Poppins", fontSize: 16),
                ),
                const SizedBox(height: 5),
                // Username input
                AnimatedBuilder(
                  animation: _emailShake,
                  builder: (context, child) {
                    return Transform.translate(
                      offset: Offset(_emailShake.value, 0),
                      child: child,
                    );
                  },
                  child: TextField(
                    controller: emailController,
                    cursorColor: Colors.black, // 👈 Always black caret
                    decoration: InputDecoration(
                      border: const OutlineInputBorder(),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.grey, width: 1),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                            color: Color(0xFFE59E2C), width: 1),
                      ),
                      errorBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.red, width: 1),
                      ),
                      focusedErrorBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                            color: Color(0xFFE59E2C), width: 1),
                      ),
                      errorText: emailError
                          ? "Incorrect username. Please try again"
                          : null,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                // Password label
                const Text(
                  "Password",
                  style: TextStyle(fontFamily: "Poppins", fontSize: 16),
                ),
                const SizedBox(height: 5),
                // Password input
                AnimatedBuilder(
                  animation: _passwordShake,
                  builder: (context, child) {
                    return Transform.translate(
                      offset: Offset(_passwordShake.value, 0),
                      child: child,
                    );
                  },
                  child: TextField(
                    controller: passwordController,
                    obscureText: true,
                    cursorColor: Colors.black, // 👈 Always black caret
                    decoration: InputDecoration(
                      border: const OutlineInputBorder(),
                      enabledBorder: OutlineInputBorder(
                        borderSide:
                            BorderSide(color: Colors.grey, width: 1),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                            color: Color(0xFFE59E2C), width: 1),
                      ),
                      errorBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.red, width: 1),
                      ),
                      focusedErrorBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                            color: Color(0xFFE59E2C), width: 1),
                      ),
                      errorText: passwordError
                          ? "Incorrect password. Please try again"
                          : null,
                    ),
                  ),
                ),
                // Forgot Password link below password field
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (context) => const ForgotPassword()),
                        );
                      },
                      child: const Text(
                        'Forgot Password',
                        style: TextStyle(
                          color: Color(0xFF8B5A2B),
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 100),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _validateAndLogin,
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFFF5D37D),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                  side: const BorderSide(color: Colors.black),
                ),
              ),
              child: const Text(
                "Log In",
                style: TextStyle(
                  fontFamily: "Poppins",
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 2,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
