import 'package:flutter/material.dart';

class NewPasswordScreen extends StatefulWidget {
  const NewPasswordScreen({super.key});

  @override
  State<NewPasswordScreen> createState() => _NewPasswordScreenState();
}

class _NewPasswordScreenState extends State<NewPasswordScreen> {
  final TextEditingController pass = TextEditingController();
  final TextEditingController confirmPass = TextEditingController();

  bool error = false;

  void submit() {
    setState(() {
      error = pass.text != confirmPass.text || pass.text.isEmpty;
    });

    if (!error) {
      Navigator.pushReplacementNamed(context, "/home");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
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

                const Text("Password",
                    style:
                        TextStyle(fontFamily: "Poppins", fontSize: 14)),

                const SizedBox(height: 5),

                TextField(
                  controller: pass,
                  obscureText: true,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(),
                  ),
                ),

                const SizedBox(height: 20),

                const Text("Confirm Password",
                    style:
                        TextStyle(fontFamily: "Poppins", fontSize: 14)),

                const SizedBox(height: 5),

                TextField(
                  controller: confirmPass,
                  obscureText: true,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(),
                  ),
                ),

                if (error)
                  const Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: Text(
                      "Passwords do not match.",
                      style: TextStyle(color: Colors.red),
                    ),
                  ),

                const Spacer(),

                SizedBox(
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

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
