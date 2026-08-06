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
    if (location.startsWith('/lists')) return 4;
    if (location.startsWith('/profile')) return 5;
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
        context.go('/lists');
        break;
      case 5:
        context.go('/profile');
        break;
    }
  }

  Widget _buildNavItem(BuildContext context, int index, int selectedIndex, IconData icon, String label) {
    final isSelected = index == selectedIndex;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => _onItemTapped(index, context),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              decoration: isSelected 
                ? BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withOpacity(0.6),
                        blurRadius: 12,
                        spreadRadius: 2,
                      )
                    ]
                  )
                : null,
              child: Icon(
                icon,
                color: isSelected ? AppTheme.primary : AppTheme.textMuted,
                size: 24,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? AppTheme.textInvert : AppTheme.textMuted,
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w400,
                letterSpacing: 0.5,
              ),
            )
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final selectedIdx = _calculateSelectedIndex(context);
    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        height: 65,
        decoration: const BoxDecoration(
          color: AppTheme.darkBackground,
          border: Border(top: BorderSide(color: AppTheme.borderLight, width: 1)),
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              _buildNavItem(context, 0, selectedIdx, Icons.search, 'HOME'),
              _buildNavItem(context, 1, selectedIdx, Icons.flash_on, 'ACTIVITY'),
              _buildNavItem(context, 2, selectedIdx, Icons.explore, 'EXPLORE'),
              _buildNavItem(context, 3, selectedIdx, Icons.book, 'DIARY'),
              _buildNavItem(context, 4, selectedIdx, Icons.list, 'LISTS'),
              _buildNavItem(context, 5, selectedIdx, Icons.person, 'PROFILE'),
            ],
          ),
        ),
      ),
    );
  }
}
