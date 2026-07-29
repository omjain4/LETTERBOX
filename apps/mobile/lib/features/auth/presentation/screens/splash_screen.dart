import 'package:flutter/material.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    // Simulate the exact 1 second CurtainLoader
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 1));
    _animation = Tween<double>(begin: 1.0, end: 0.0).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOutExpo, // Mimics the CSS transition ease
    ));
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Underlying UI will go here soon. For now, solid dark.
          Container(color: const Color(0xFF111111)),
          
          // Left Curtain
          AnimatedBuilder(
            animation: _animation,
            builder: (context, child) {
              return Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                width: MediaQuery.of(context).size.width * 0.5 * _animation.value,
                child: Container(color: const Color(0xFFF4F4F4)), // White brutalist curtain
              );
            },
          ),
          
          // Right Curtain
          AnimatedBuilder(
            animation: _animation,
            builder: (context, child) {
              return Positioned(
                right: 0,
                top: 0,
                bottom: 0,
                width: MediaQuery.of(context).size.width * 0.5 * _animation.value,
                child: Container(color: const Color(0xFFF4F4F4)),
              );
            },
          ),
        ],
      ),
    );
  }
}
