import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../../../core/network/api_service.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../../auth/providers/auth_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    final self = context.read<AuthProvider>().user;
    if (self == null) return;
    
    try {
      final response = await api.get('/users/${self['username']}');
      if (mounted) {
        setState(() {
          _profile = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildStatBox(String label, int value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: AppTheme.darkBackground,
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        children: [
          Text(
            value.toString(),
            style: const TextStyle(color: AppTheme.textInvert, fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            label.toUpperCase(),
            style: const TextStyle(color: AppTheme.textMuted, fontSize: 10, letterSpacing: 0.5),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppTheme.primary)));
    }

    if (_profile == null) {
      return const Scaffold(body: Center(child: Text('Profile not found', style: TextStyle(color: AppTheme.textMuted))));
    }

    final stats = _profile!['_count'] ?? {};
    final favorites = _profile!['favoritePicks'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text(_profile!['username'].toString().toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2)),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings, color: AppTheme.textMuted),
            onPressed: () {
              // Sign out as rudimentary setting for now
              context.read<AuthProvider>().logout();
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: AppTheme.borderLight,
                  backgroundImage: _profile!['avatarUrl'] != null ? NetworkImage(_profile!['avatarUrl']) : null,
                  child: _profile!['avatarUrl'] == null ? const Icon(Icons.person, size: 40, color: AppTheme.textMuted) : null,
                ),
                const SizedBox(width: 24),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_profile!['displayName'] ?? _profile!['username'], style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                      if (_profile!['bio'] != null) ...[
                        const SizedBox(height: 4),
                        Text(_profile!['bio'], style: const TextStyle(color: AppTheme.textMuted)),
                      ]
                    ],
                  ),
                )
              ],
            ),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Expanded(child: _buildStatBox('Logged', stats['diaryEntries'] ?? 0)),
                const SizedBox(width: 8),
                Expanded(child: _buildStatBox('Reviews', stats['reviews'] ?? 0)),
                const SizedBox(width: 8),
                Expanded(child: _buildStatBox('Followers', stats['followers'] ?? 0)),
              ],
            ),
            const SizedBox(height: 32),
            const Text('FAVORITE PICKS', style: TextStyle(color: AppTheme.textMuted, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
            const SizedBox(height: 16),
            SizedBox(
              height: 140,
              child: Row(
                children: List.generate(4, (index) {
                  final pick = index < favorites.length ? favorites[index] : null;
                  return Expanded(
                    child: Container(
                      margin: EdgeInsets.only(right: index < 3 ? 8 : 0),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.borderLight),
                        color: AppTheme.darkBackground,
                      ),
                      child: pick != null && pick['media']['posterUrl'] != null
                        ? CachedNetworkImage(
                            imageUrl: pick['media']['posterUrl'],
                            fit: BoxFit.cover,
                          )
                        : const Center(child: Text('Empty', style: TextStyle(color: AppTheme.textMuted, fontSize: 12))),
                    ),
                  );
                }),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
