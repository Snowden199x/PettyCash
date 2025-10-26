import 'package:flutter/material.dart';
import 'forgot_password.dart';

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

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  void _validateAndLogin() {
    setState(() {
      emailError = emailController.text.isEmpty;
      passwordError = passwordController.text.isEmpty;
    });

    if (emailError) _emailController.forward(from: 0);
    if (passwordError) _passwordController.forward(from: 0);

    if (emailError || passwordError) return;

    Navigator.pushNamed(context, '/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: false,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: 28,
          ), // adjusted slightly left
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 🔹 Title
                Container(
                  margin: const EdgeInsets.only(top: 30),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Log In',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 16,
                          fontWeight: FontWeight.w300,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 30),

                // 🔹 Icon
                Center(
                  child: Image.asset(
                    'assets/Icons/wallet-icon2.png',
                    height: 171.67,
                    width: 174,
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(height: 40),

                // 🔹 Username Field
                const Text(
                  'Username',
                  style: TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 16,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 2),

                AnimatedBuilder(
                  animation: _emailShake,
                  builder: (context, child) {
                    return Transform.translate(
                      offset: Offset(_emailShake.value, 0),
                      child: child,
                    );
                  },
                  child: Container(
                    margin: const EdgeInsets.only(
                      right: 4,
                    ), // fixes right cutoff
                    child: TextField(
                      controller: emailController,
                      onChanged: (_) {
                        if (emailError) setState(() => emailError = false);
                      },
                      decoration: InputDecoration(
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 12,
                          horizontal: 12,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(6),
                          borderSide: BorderSide(
                            color: emailError ? Colors.red : Colors.black,
                            width: 0.8, // smaller border for visibility
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(6),
                          borderSide: BorderSide(
                            color: emailError
                                ? Colors.red
                                : const Color(0xFFE59E2C),
                            width: 1.0,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                if (emailError)
                  const Padding(
                    padding: EdgeInsets.only(top: 4, left: 4),
                    child: Text(
                      "Incorrect username. Please try again",
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.red,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
                const SizedBox(height: 20),

                // 🔹 Password Field
                const Text(
                  'Password',
                  style: TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 16,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 2),

                AnimatedBuilder(
                  animation: _passwordShake,
                  builder: (context, child) {
                    return Transform.translate(
                      offset: Offset(_passwordShake.value, 0),
                      child: child,
                    );
                  },
                  child: Container(
                    margin: const EdgeInsets.only(
                      right: 4,
                    ), // fixes right cutoff
                    child: TextField(
                      controller: passwordController,
                      obscureText: true,
                      onChanged: (_) {
                        if (passwordError) {
                          setState(() => passwordError = false);
                        }
                      },
                      decoration: InputDecoration(
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 12,
                          horizontal: 12,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(6),
                          borderSide: BorderSide(
                            color: passwordError ? Colors.red : Colors.black,
                            width: 0.8,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(6),
                          borderSide: BorderSide(
                            color: passwordError
                                ? Colors.red
                                : const Color(0xFFE59E2C),
                            width: 1.0,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                if (passwordError)
                  const Padding(
                    padding: EdgeInsets.only(top: 4, left: 4),
                    child: Text(
                      "Incorrect password. Please try again",
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.red,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),

                const SizedBox(height: 8),

                // 🔹 Forgot Password button
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const ForgotPassword(),
                        ),
                      );
                    },
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(0, 0),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'Forgot Password?',
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 14,
                        color: Color(0xFF8B3B08),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 150),
              ],
            ),
          ),
        ),
      ),

      // 🔹 Login Button
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(30, 0, 30, 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _validateAndLogin,
                style: ButtonStyle(
                  backgroundColor: WidgetStateProperty.resolveWith<Color>((
                    states,
                  ) {
                    if (states.contains(WidgetState.pressed)) {
                      return const Color(0xFFE59E2C);
                    }
                    return const Color(0xFFF3D58D);
                  }),
                  foregroundColor: WidgetStateProperty.resolveWith<Color>((
                    states,
                  ) {
                    if (states.contains(WidgetState.pressed)) {
                      return Colors.white;
                    }
                    return Colors.black;
                  }),
                  padding: WidgetStateProperty.all(
                    const EdgeInsets.symmetric(vertical: 16),
                  ),
                  shape: WidgetStateProperty.all(
                    RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                      side: const BorderSide(color: Colors.black, width: 1),
                    ),
                  ),
                  elevation: WidgetStateProperty.all(0),
                ),
                child: const Text(
                  'Log in',
                  style: TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 2.0,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 15),
          ],
        ),
      ),
    );
  }
}
