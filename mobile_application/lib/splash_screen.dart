import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _iconFade;
  late Animation<double> _iconSlide;

  // One animation per word
  static const _words = ['Every', 'coin', 'counts', 'with', 'PockiTrack'];
  late List<Animation<double>> _wordSlide;
  late List<Animation<double>> _wordFade;

  @override
  void initState() {
    super.initState();

    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
    ));

    // Total duration: icon (0–0.3) + words staggered (0.3–0.9) + hold
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3200),
    );

    // Icon slides + fades in first (0% – 20%)
    _iconFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.1, curve: Curves.easeOut),
      ),
    );

    _iconSlide = Tween<double>(begin: 40.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.2, curve: ElasticOutCurve(0.6)),
      ),
    );

    // Words stagger from 22% to 85%
    // Each word occupies a window of ~11% with a 11% gap between starts
    const double wordStart = 0.22;
    const double wordWindow = 0.16; // how long each word animates
    const double wordStep = 0.13;   // gap between each word's start

    _wordSlide = List.generate(_words.length, (i) {
      final start = wordStart + i * wordStep;
      final end = (start + wordWindow).clamp(0.0, 1.0);
      return Tween<double>(begin: 30.0, end: 0.0).animate(
        CurvedAnimation(
          parent: _controller,
          curve: Interval(start, end, curve: const ElasticOutCurve(0.6)),
        ),
      );
    });

    _wordFade = List.generate(_words.length, (i) {
      final start = wordStart + i * wordStep;
      // Fade completes faster than the bounce so the word is visible during bounce
      final end = (start + wordWindow * 0.5).clamp(0.0, 1.0);
      return Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(
          parent: _controller,
          curve: Interval(start, end, curve: Curves.easeOut),
        ),
      );
    });

    _controller.forward();

    Future.delayed(const Duration(milliseconds: 4200), () {
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/login');
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0x1FFFFFFF), // ~12% white
              Color(0xFF8B3B08), // 100% #8B3B08
            ],
          ),
        ),
        child: Center(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Icon
                  FadeTransition(
                    opacity: _iconFade,
                    child: Transform.translate(
                      offset: Offset(0, _iconSlide.value),
                      child: Image.asset(
                        'assets/Icons/wallet-icon2.png',
                        width: 160,
                        height: 160,
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  // Words — each rises and fades in one at a time
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 8,
                    runSpacing: 0,
                    children: List.generate(_words.length, (i) {
                      return Opacity(
                        opacity: _wordFade[i].value,
                        child: Transform.translate(
                          offset: Offset(0, _wordSlide[i].value),
                          child: Text(
                            _words[i],
                            style: const TextStyle(
                              fontFamily: 'Poppins',
                              fontWeight: FontWeight.w600,
                              fontSize: 28,
                              color: Colors.white,
                              height: 1.4,
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
