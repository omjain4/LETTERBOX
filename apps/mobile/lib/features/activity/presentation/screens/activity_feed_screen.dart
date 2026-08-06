import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/network/api_service.dart';
import '../../../../shared/theme/app_theme.dart';
import 'package:timeago/timeago.dart' as timeago;

class ActivityFeedScreen extends StatefulWidget {
  const ActivityFeedScreen({Key? key}) : super(key: key);

  @override
  State<ActivityFeedScreen> createState() => _ActivityFeedScreenState();
}

class _ActivityFeedScreenState extends State<ActivityFeedScreen> {
  bool _isLoading = true;
  List<dynamic> _activities = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchActivity();
  }

  Future<void> _fetchActivity() async {
    try {
      final response = await api.get('/activity/social?limit=50');
      if (mounted) {
        setState(() {
          _activities = response.data['data'] as List<dynamic>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load activity feed.';
          _isLoading = false;
        });
      }
    }
  }

  Widget _buildStars(dynamic rating) {
    if (rating == null) return const SizedBox.shrink();
    final num rate = (rating is num) ? rating : double.tryParse(rating.toString()) ?? 0;
    
    return Row(
      children: List.generate(5, (index) {
        return Icon(
          index < rate ? Icons.star : Icons.star_border,
          color: AppTheme.success,
          size: 14,
        );
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ACTIVITY', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2.0)),
        centerTitle: true,
        backgroundColor: AppTheme.background,
        elevation: 0,
      ),
      body: _isLoading
          ? const Align(alignment: Alignment.topCenter, child: LinearProgressIndicator(color: AppTheme.primary, backgroundColor: AppTheme.darkBackground))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: AppTheme.primary)))
              : _activities.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.people_outline, size: 48, color: AppTheme.textMuted),
                          SizedBox(height: 16),
                          Text('NO ACTIVITY YET', style: TextStyle(color: AppTheme.textMuted, letterSpacing: 1.5, fontWeight: FontWeight.bold)),
                          SizedBox(height: 8),
                          Text('Follow users to see their reviews here.', style: TextStyle(color: AppTheme.textDim, fontSize: 12)),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      itemCount: _activities.length,
                      separatorBuilder: (context, index) => const Divider(color: AppTheme.borderLight, height: 24),
                      itemBuilder: (context, index) {
                        final activity = _activities[index];
                        final user = activity['user'];
                        final media = activity['media'];
                        final date = DateTime.parse(activity['createdAt']);

                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // User Header
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundColor: AppTheme.darkBackground,
                                    backgroundImage: user['avatarUrl'] != null ? NetworkImage(user['avatarUrl']) : null,
                                    child: user['avatarUrl'] == null 
                                      ? Text((user['displayName'] ?? user['username'])[0].toUpperCase(), style: const TextStyle(color: AppTheme.textInvert, fontSize: 12, fontWeight: FontWeight.bold))
                                      : null,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(user['displayName'] ?? user['username'], style: const TextStyle(color: AppTheme.textInvert, fontWeight: FontWeight.bold, fontSize: 14)),
                                  const Spacer(),
                                  Text(timeago.format(date), style: const TextStyle(color: AppTheme.textDim, fontSize: 12)),
                                ],
                              ),
                              const SizedBox(height: 12),
                              
                              // Media & Review
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  SizedBox(
                                    width: 70,
                                    height: 105,
                                    child: media['posterUrl'] != null
                                        ? CachedNetworkImage(
                                            imageUrl: media['posterUrl'],
                                            fit: BoxFit.cover,
                                            errorWidget: (c, u, e) => const ColoredBox(color: AppTheme.darkBackground, child: Icon(Icons.movie, color: AppTheme.textMuted)),
                                          )
                                        : const ColoredBox(color: AppTheme.darkBackground, child: Icon(Icons.movie, color: AppTheme.textMuted)),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text.rich(
                                          TextSpan(
                                            children: [
                                              TextSpan(text: media['title'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.textInvert)),
                                              if (media['releaseYear'] != null)
                                                TextSpan(text: ' (${media['releaseYear']})', style: const TextStyle(color: AppTheme.textMuted, fontSize: 14)),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            if (activity['rating'] != null) _buildStars(activity['rating']),
                                            if (activity['rating'] != null && activity['liked'] == true) const SizedBox(width: 8),
                                            if (activity['liked'] == true) const Icon(Icons.favorite, color: AppTheme.primary, size: 14),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        if (activity['review'] != null)
                                          Text(
                                            activity['review'],
                                            style: const TextStyle(color: AppTheme.textInvert, fontSize: 13, height: 1.4),
                                          ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
    );
  }
}
