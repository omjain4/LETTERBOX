import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/theme/app_theme.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController(text: 'omjain@gmail.com');
  final _passwordController = TextEditingController(text: 'password123');
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final success = await context.read<AuthProvider>().login(
      _emailController.text.trim(),
      _passwordController.text.trim(),
    );

    if (mounted) {
      setState(() => _isLoading = false);
      if (success) {
        context.go('/home');
      } else {
        setState(() => _errorMessage = 'Invalid email or password. Please try again.');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Minimalist Logo Text mirroring UI string
                const Text(
                  'MOSIAC',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -1.5,
                  ),
                ),
                const SizedBox(height: 48),

                if (_errorMessage != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 24),
                    color: AppTheme.primary.withOpacity(0.1),
                    border: Border.all(color: AppTheme.primary),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: AppTheme.primary),
                      textAlign: TextAlign.center,
                    ),
                  ),

                TextField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'EMAIL',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: AppTheme.borderLight),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: AppTheme.primary, width: 2),
                    ),
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 16),
                
                TextField(
                  controller: _passwordController,
                  decoration: const InputDecoration(
                    labelText: 'PASSWORD',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: AppTheme.borderLight),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.zero,
                      borderSide: BorderSide(color: AppTheme.primary, width: 2),
                    ),
                  ),
                  obscureText: true,
                ),
                const SizedBox(height: 32),

                ElevatedButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  child: _isLoading 
                      ? const SizedBox(
                          height: 20, 
                          width: 20, 
                          child: CircularProgressIndicator(color: AppTheme.textInvert, strokeWidth: 2)
                        )
                      : const Text('LOGIN', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
