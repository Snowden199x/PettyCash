import 'package:flutter/material.dart';

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

      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            children: [
              const SizedBox(height: 30),

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

              Center(
                child: Image.asset(
                  'assets/Icons/wallet-icon2.png',
                  height: 160,
                ),
              ),

              const SizedBox(height: 40),

              const Align(
                alignment: Alignment.centerLeft,
                child: Text("Username",
                    style: TextStyle(fontFamily: "Poppins", fontSize: 16)),
              ),
              const SizedBox(height: 5),

              /// FIX → Apply shake animation
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
                  decoration: InputDecoration(
                    border: OutlineInputBorder(),
                    errorText: emailError
                        ? "Incorrect username. Please try again"
                        : null,
                  ),
                ),
              ),

              const SizedBox(height: 20),

              const Align(
                alignment: Alignment.centerLeft,
                child: Text("Password",
                    style: TextStyle(fontFamily: "Poppins", fontSize: 16)),
              ),
              const SizedBox(height: 5),

              /// FIX → Apply shake animation
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
                  decoration: InputDecoration(
                    border: OutlineInputBorder(),
                    errorText: passwordError
                        ? "Incorrect password. Please try again"
                        : null,
                  ),
                ),
              ),

              const Spacer(),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _validateAndLogin,
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
                    "Log In",
                    style: TextStyle(
                        fontFamily: "Poppins",
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 2),
                  ),
                ),
              ),

              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}
