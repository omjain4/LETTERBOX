import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../shared/theme/app_theme.dart';

class ScaffoldWithNav extends StatelessWidget {
  final Widget child;

  const ScaffoldWithNav({
    Key? key,
    required this.child,
  }) : super(key: key);

  int _calculateSelectedIndex(BuildContext context) {
    final String location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/home')) return 0;
    if (location.startsWith('/activity')) return 1;
    if (location.startsWith('/explore')) return 2;
    if (location.startsWith('/diary')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/home');
        break;
      case 1:
        context.go('/activity');
        break;
      case 2:
        context.go('/explore');
        break;
      case 3:
        context.go('/diary');
        break;
      case 4:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      // Minimalist flat bottom bar mapping directly to web headers
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: AppTheme.borderLight, width: 1)),
        ),
        child: BottomNavigationBar(
          backgroundColor: AppTheme.darkBackground,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: AppTheme.primary,
          unselectedItemColor: AppTheme.textMuted,
          showSelectedLabels: true,
          showUnselectedLabels: true,
          currentIndex: _calculateSelectedIndex(context),
          onTap: (index) => _onItemTapped(index, context),
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11, letterSpacing: 0.5),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w400, fontSize: 11, letterSpacing: 0.5),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.search), label: 'HOME'),
            BottomNavigationBarItem(icon: Icon(Icons.flash_on), label: 'ACTIVITY'),
            BottomNavigationBarItem(icon: Icon(Icons.explore), label: 'EXPLORE'),
            BottomNavigationBarItem(icon: Icon(Icons.book), label: 'DIARY'),
            BottomNavigationBarItem(icon: Icon(Icons.person), label: 'PROFILE'),
          ],
        ),
      ),
    );
  }
}
