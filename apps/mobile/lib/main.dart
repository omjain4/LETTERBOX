import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import 'features/auth/providers/auth_provider.dart';
import 'features/auth/presentation/screens/splash_screen.dart';
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/auth/presentation/screens/signup_screen.dart';
import 'features/search/presentation/screens/search_screen.dart';
import 'features/explore/presentation/screens/explore_screen.dart';
import 'features/activity/presentation/screens/activity_screen.dart';
import 'features/diary/presentation/screens/diary_screen.dart';
import 'features/lists/presentation/screens/lists_screen.dart';
import 'features/profile/presentation/screens/profile_screen.dart';
import 'features/scaffold/presentation/scaffold_with_nav.dart';
import 'shared/theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: const MosiacApp(),
    ),
  );
}

class MosiacApp extends StatefulWidget {
  const MosiacApp({Key? key}) : super(key: key);

  @override
  State<MosiacApp> createState() => _MosiacAppState();
}

class _MosiacAppState extends State<MosiacApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    final authProvider = context.read<AuthProvider>();

    _router = GoRouter(
      initialLocation: '/',
      refreshListenable: authProvider,
      redirect: (context, state) {
        final isLoggedIn = authProvider.isAuthenticated;
        final isSplash = state.matchedLocation == '/';
        final goingToLogin = state.matchedLocation == '/login';
        final goingToSignup = state.matchedLocation == '/signup';

        if (isSplash) return null; // Let splash screen render and handle its own transition
        
        if (!isLoggedIn && !goingToLogin && !goingToSignup) {
          return '/login';
        }
        
        if (isLoggedIn && (goingToLogin || goingToSignup)) {
          return '/home';
        }
        
        return null;
      },
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const SplashScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/signup',
          builder: (context, state) => const SignupScreen(),
        ),
        ShellRoute(
          builder: (context, state, child) => ScaffoldWithNav(child: child),
          routes: [
            GoRoute(
              path: '/home',
              pageBuilder: (context, state) => CustomTransitionPage(
                key: state.pageKey,
                child: const SearchScreen(),
                transitionsBuilder: (c, a, s, child) => FadeTransition(opacity: a, child: child),
                transitionDuration: const Duration(milliseconds: 150),
              ),
            ),
            GoRoute(
              path: '/activity',
              pageBuilder: (context, state) => CustomTransitionPage(
                key: state.pageKey,
                child: const ActivityScreen(),
                transitionsBuilder: (c, a, s, child) => FadeTransition(opacity: a, child: child),
                transitionDuration: const Duration(milliseconds: 150),
              ),
            ),
            GoRoute(
              path: '/explore',
              pageBuilder: (context, state) => CustomTransitionPage(
                key: state.pageKey,
                child: const ExploreScreen(),
                transitionsBuilder: (c, a, s, child) => FadeTransition(opacity: a, child: child),
                transitionDuration: const Duration(milliseconds: 150),
              ),
            ),
            GoRoute(
              path: '/diary',
              pageBuilder: (context, state) => CustomTransitionPage(
                key: state.pageKey,
                child: const DiaryScreen(),
                transitionsBuilder: (c, a, s, child) => FadeTransition(opacity: a, child: child),
                transitionDuration: const Duration(milliseconds: 150),
              ),
            ),
            GoRoute(
              path: '/lists',
              pageBuilder: (context, state) => CustomTransitionPage(
                key: state.pageKey,
                child: const ListsScreen(),
                transitionsBuilder: (c, a, s, child) => FadeTransition(opacity: a, child: child),
                transitionDuration: const Duration(milliseconds: 150),
              ),
            ),
            GoRoute(
              path: '/profile',
              pageBuilder: (context, state) => CustomTransitionPage(
                key: state.pageKey,
                child: const ProfileScreen(),
                transitionsBuilder: (c, a, s, child) => FadeTransition(opacity: a, child: child),
                transitionDuration: const Duration(milliseconds: 150),
              ),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Mosiac',
      theme: AppTheme.lightTheme,
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}
