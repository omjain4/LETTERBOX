import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import 'features/auth/providers/auth_provider.dart';
import 'features/auth/presentation/screens/splash_screen.dart';
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/search/presentation/screens/search_screen.dart';
import 'features/explore/presentation/screens/explore_screen.dart';
import 'features/activity/presentation/screens/activity_screen.dart';
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
        final isLoading = authProvider.isLoading;
        final goingToLogin = state.matchedLocation == '/login';

        if (isLoading) return '/'; // Stay on splash screen
        
        if (!isLoggedIn && !goingToLogin) {
          return '/login';
        }
        
        if (isLoggedIn && (goingToLogin || state.matchedLocation == '/')) {
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
        ShellRoute(
          builder: (context, state, child) => ScaffoldWithNav(child: child),
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const SearchScreen(),
            ),
            GoRoute(
              path: '/activity',
              builder: (context, state) => const ActivityScreen(),
            ),
            GoRoute(
              path: '/explore',
              builder: (context, state) => const ExploreScreen(),
            ),
            GoRoute(
              path: '/diary',
              builder: (context, state) => const Scaffold(body: Center(child: Text("DIARY: My Logs"))),
            ),
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
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
