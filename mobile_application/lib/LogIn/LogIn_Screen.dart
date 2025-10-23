import 'package:flutter/material.dart';

class SignUpScreen extends StatelessWidget {
  const SignUpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final emailController = TextEditingController();
    final passwordController = TextEditingController();

    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 255, 255, 255),
      resizeToAvoidBottomInset: false,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 30),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 🔹 Top Row (Back + Title)
                Container(
                  margin: const EdgeInsets.only(top: 30),
                  child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Text(
                      'Log In',
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 16,
                        fontWeight: FontWeight.w400,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                 ),  
                ),
                const SizedBox(height: 30),

                // 🔹 App Icon
                Center(
                  child: Image.asset(
                    'assets/Icons/wallet-icon2.png',
                    height: 171.67,
                    width: 174,
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(height: 40),

                // 🔹 Email Field
                const Text(
                  'Username',
                  style: TextStyle(
                    fontFamily: 'Poppins',
                    fontSize: 16, 
                    fontWeight: FontWeight.w400
                  ),
                ),
                const SizedBox(height: 2),
                TextField(
                  controller: emailController,
                  decoration: InputDecoration(
                    contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(5),
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
                    fontWeight: FontWeight.w400),
                ),
                const SizedBox(height: 2),
                TextField(
                  controller: passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
                ),
                const SizedBox(height: 150),
              ],
            ),
          ),
        ),
      ),

      // 🔹 Bottom section
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(30, 0, 30, 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  // ✅ Go directly to home_screen.dart via named route
                  Navigator.pushNamed(context, '/home');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF3D58D),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  side: BorderSide(color: Colors.black, width: 1,),
                  elevation: 0,
                ),
                child: const Text(
                  'Log in',
                  style: TextStyle(
                    fontFamily: 'Poppins',
                    color: Colors.black,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
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
