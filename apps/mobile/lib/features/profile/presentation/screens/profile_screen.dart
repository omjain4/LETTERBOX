import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../../../core/network/api_service.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../diary/presentation/screens/diary_screen.dart';

class ProfileScreen extends StatefulWidget {
  final String? username;
  const ProfileScreen({Key? key, this.username}) : super(key: key);

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
    final targetUsername = widget.username ?? self?['username'];
    if (targetUsername == null) return;
    
    try {
      final response = await api.get('/users/$targetUsername');
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

  Widget _buildStatBox(String label, int value, {VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        decoration: BoxDecoration(
          color: AppTheme.darkBackground,
          border: Border.all(color: AppTheme.borderLight),
        ),
        child: Column(
          children: [
            Text(
              value.toString(),
              style: const TextStyle(color: AppTheme.textInvert, fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              label.toUpperCase(),
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 10, letterSpacing: 0.5),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showUsersList(String title, String endpoint) async {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.darkBackground,
      builder: (context) {
        return FutureBuilder(
          future: api.get(endpoint),
          builder: (context, AsyncSnapshot snapshot) {
            return Padding(
              padding: const EdgeInsets.only(top: 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title, style: const TextStyle(color: AppTheme.textMuted, letterSpacing: 1.5, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  if (snapshot.connectionState == ConnectionState.waiting)
                    const Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator(color: AppTheme.primary))
                  else if (snapshot.hasError || !snapshot.hasData)
                    const Padding(padding: EdgeInsets.all(32), child: Text("Failed to load", style: TextStyle(color: AppTheme.primary)))
                  else
                    SizedBox(
                      height: 350,
                      child: ListView.builder(
                        itemCount: (snapshot.data.data as List).length,
                        itemBuilder: (context, index) {
                          final u = snapshot.data.data[index];
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundImage: u['avatarUrl'] != null ? NetworkImage(u['avatarUrl']) : null,
                              child: u['avatarUrl'] == null ? const Icon(Icons.person) : null,
                            ),
                            title: Text(u['username'], style: const TextStyle(color: AppTheme.textInvert)),
                            subtitle: Text(u['displayName'] ?? '', style: const TextStyle(color: AppTheme.textMuted)),
                            onTap: () {
                              Navigator.pop(context); // close modal
                              Navigator.push(context, MaterialPageRoute(
                                builder: (context) => ProfileScreen(username: u['username']),
                              ));
                            },
                          );
                        },
                      ),
                    ),
                ],
              ),
            );
          }
        );
      }
    );
  }

  Future<void> _pickFavorite(int slot) async {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.darkBackground,
      builder: (context) {
        final searchCtrl = TextEditingController();
        List<dynamic> results = [];
        bool searching = false;

        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(top: 24, left: 16, right: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('SEARCH MEDIA FOR FAVORITE', style: TextStyle(color: AppTheme.textMuted, letterSpacing: 1.5, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: searchCtrl,
                    style: const TextStyle(color: AppTheme.textInvert),
                    decoration: const InputDecoration(
                      hintText: 'Search...',
                      hintStyle: TextStyle(color: AppTheme.textMuted),
                      filled: true,
                      fillColor: Colors.black45,
                      border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppTheme.borderLight)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppTheme.primary)),
                    ),
                    onSubmitted: (query) async {
                      if (query.length < 2) return;
                      setModalState(() => searching = true);
                      try {
                        final res = await api.get('/search?q=$query&limit=5');
                        setModalState(() {
                          results = res.data['data'];
                          searching = false;
                        });
                      } catch (e) {
                        setModalState(() => searching = false);
                      }
                    },
                  ),
                  const SizedBox(height: 16),
                  if (searching) const CircularProgressIndicator(color: AppTheme.primary)
                  else if (results.isNotEmpty)
                    SizedBox(
                      height: 250,
                      child: ListView.builder(
                        itemCount: results.length,
                        itemBuilder: (context, index) {
                          final item = results[index];
                          return ListTile(
                            leading: item['posterUrl'] != null 
                              ? Image.network(item['posterUrl'], width: 40, fit: BoxFit.cover) 
                              : const Icon(Icons.movie, color: AppTheme.textMuted),
                            title: Text(item['title'] ?? 'Unknown', style: const TextStyle(color: AppTheme.textInvert)),
                            subtitle: Text(item['mediaType'] ?? '', style: const TextStyle(color: AppTheme.textMuted)),
                            onTap: () async {
                              Navigator.pop(context);
                              setState(() => _isLoading = true);
                              try {
                                await api.post('/users/favorites', data: {
                                  'mediaId': item['id'],
                                  'slotInt': slot + 1,
                                });
                                _fetchProfile();
                              } catch (e) {
                                setState(() => _isLoading = false);
                              }
                            },
                          );
                        },
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
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
                const SizedBox(width: 6),
                Expanded(child: _buildStatBox('Reviews', stats['reviews'] ?? 0)),
                const SizedBox(width: 6),
                Expanded(child: _buildStatBox('Following', stats['following'] ?? 0, onTap: () {
                  _showUsersList("FOLLOWING", '/users/${_profile!['username']}/following');
                })),
                const SizedBox(width: 6),
                Expanded(child: _buildStatBox('Followers', stats['followers'] ?? 0, onTap: () {
                  _showUsersList("FOLLOWERS", '/users/${_profile!['username']}/followers');
                })),
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
                    child: InkWell(
                      onTap: () => _pickFavorite(index),
                      child: Container(
                        margin: EdgeInsets.only(right: index < 3 ? 8 : 0),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppTheme.borderLight),
                          color: AppTheme.darkBackground,
                        ),
                        child: pick != null && pick['media'] != null && pick['media']['posterUrl'] != null
                          ? CachedNetworkImage(
                              imageUrl: pick['media']['posterUrl'],
                              fit: BoxFit.cover,
                            )
                          : const Center(child: Icon(Icons.add, color: AppTheme.textMuted)),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('RECENT DIARY', style: TextStyle(color: AppTheme.textMuted, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                TextButton(
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (c) => DiaryScreen(username: _profile!['username'])));
                  },
                  child: const Text('SEE ALL', style: TextStyle(color: AppTheme.primary, fontSize: 12)),
                )
              ],
            ),
            const SizedBox(height: 8),
            ...(_profile!['recentDiary'] as List<dynamic>? ?? []).map((entry) {
              final media = entry['media'] ?? {};
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.darkBackground,
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (media['posterUrl'] != null)
                      Image.network(media['posterUrl'], width: 50, height: 75, fit: BoxFit.cover)
                    else
                      Container(width: 50, height: 75, color: AppTheme.background, child: const Icon(Icons.movie, color: AppTheme.textMuted)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(media['title'] ?? 'Unknown', style: const TextStyle(color: AppTheme.textInvert, fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          if (entry['rating'] != null)
                            Row(
                              children: List.generate(5, (idx) => Icon(idx < entry['rating'] ? Icons.star : Icons.star_border, size: 14, color: AppTheme.success)),
                            ),
                          if (entry['review'] != null) ...[
                            const SizedBox(height: 8),
                            Text(entry['review'], maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                          ]
                        ],
                      ),
                    )
                  ],
                ),
              );
            }).toList(),
          ],
        ),
      ),
    );
  }
}
