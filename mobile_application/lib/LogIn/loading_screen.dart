import 'package:flutter/material.dart';
import '../api_client.dart';

class LoadingScreen extends StatefulWidget {
  final String orgName;
  final int orgId;

  const LoadingScreen({
    super.key,
    required this.orgName,
    required this.orgId,
  });

  @override
  State<LoadingScreen> createState() => _LoadingScreenState();
}

class _LoadingScreenState extends State<LoadingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeIn,
    );

    _fadeController.forward();
    _preloadAndNavigate();
  }

  Future<void> _preloadAndNavigate() async {
    // Run the dashboard prefetch in parallel with a minimum display time
    // so the loading screen is never just a flash.
    await Future.wait([
      _prefetchDashboard(),
      Future.delayed(const Duration(milliseconds: 1800)),
    ]);

    if (!mounted) return;

    // Fade out before navigating
    await _fadeController.reverse();

    if (!mounted) return;

    Navigator.pushReplacementNamed(
      context,
      '/home',
      arguments: {
        'orgName': widget.orgName,
        'orgId': widget.orgId,
      },
    );
  }

  Future<void> _prefetchDashboard() async {
    try {
      final api = ApiClient();
      await api.getJson('/pres/api/dashboard/summary');
    } catch (_) {
      // Silently ignore — home screen handles its own error state
    }
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Logo
              Image.asset(
                'assets/Icons/wallet-icon2.png',
                width: 120,
                height: 120,
              ),
              const SizedBox(height: 32),
              // App name
              const Text(
                'PockiTrack',
                style: TextStyle(
                  fontFamily: 'PlayFairDisplay',
                  fontStyle: FontStyle.italic,
                  fontSize: 28,
                  fontWeight: FontWeight.w400,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 8),
              // Greeting
              Text(
                'Welcome, ${widget.orgName}',
                style: const TextStyle(
                  fontFamily: 'Poppins',
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.black54,
                ),
              ),
              const SizedBox(height: 48),
              // Spinner
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFE59E2C)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
