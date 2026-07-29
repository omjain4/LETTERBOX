import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _liftController;
  late Animation<double> _liftAnimation;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    // Pulse animation
    _pulseController = AnimationController(vsync: this, duration: const Duration(seconds: 1))..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));

    // Lift animation
    _liftController = AnimationController(vsync: this, duration: const Duration(seconds: 1));
    _liftAnimation = Tween<double>(begin: 0.0, end: -1.0).animate(CurvedAnimation(
      parent: _liftController,
      curve: const Cubic(0.75, 0, 0.25, 1),
    ));

    // Wait 1 second before lifting
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        _liftController.forward();
      }
    });

    // Navigate when animation is done
    Future.delayed(const Duration(milliseconds: 2200), () {
      if (mounted) {
        final auth = context.read<AuthProvider>();
        if (auth.isAuthenticated) {
          context.go('/home');
        } else {
          context.go('/login');
        }
      }
    });
  }

  @override
  void dispose() {
    _liftController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: const Color(0xFF111111), // Underlying dark screen
      body: Stack(
        children: [
          AnimatedBuilder(
            animation: _liftAnimation,
            builder: (context, child) {
              return Positioned(
                left: 0,
                right: 0,
                top: size.height * _liftAnimation.value,
                height: size.height,
                child: Container(
                  decoration: const BoxDecoration(
                    color: Color(0xFF8A0A19),
                    boxShadow: [
                      BoxShadow(color: Colors.black87, blurRadius: 40, offset: Offset(0, 20)),
                    ],
                  ),
                  child: Stack(
                    children: [
                      // Curtain folds simulation
                      Row(
                        children: List.generate(
                          10,
                          (index) => Expanded(
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.black.withOpacity(0.5),
                                    Colors.transparent,
                                    Colors.transparent,
                                    Colors.black.withOpacity(0.5)
                                  ],
                                  stops: const [0.0, 0.15, 0.85, 1.0],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      // Center Content
                      Center(
                        child: AnimatedBuilder(
                          animation: _pulseAnimation,
                          builder: (context, child) {
                            return Transform.scale(
                              scale: _pulseAnimation.value,
                              child: Opacity(
                                opacity: _liftAnimation.isCompleted ? 0 : 1,
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Image.asset(
                                      'assets/logo.png',
                                      width: 80,
                                      height: 80,
                                      fit: BoxFit.contain,
                                    ),
                                    const SizedBox(height: 12),
                                    const Text(
                                      'MOSIAC',
                                      style: TextStyle(
                                        color: Color(0xFFF9D976),
                                        fontSize: 48,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 4.8,
                                        shadows: [Shadow(color: Colors.black87, blurRadius: 15, offset: Offset(0, 5))],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      // Gold Fringe
                      Positioned(
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 24,
                        child: Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Color(0xFFF9D976), Color(0xFFE9B646), Color(0xFFC4962C), Color(0xFF8C6812)],
                              stops: [0.0, 0.4, 0.6, 1.0],
                            ),
                            border: Border(bottom: BorderSide(color: Color(0xFF5A4106), width: 4)),
                            boxShadow: [BoxShadow(color: Colors.black54, blurRadius: 15, offset: Offset(0, -2))],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
