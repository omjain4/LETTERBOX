import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/network/api_service.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../../../shared/widgets/media_action_modal.dart';

class ActivityScreen extends StatefulWidget {
  const ActivityScreen({Key? key}) : super(key: key);

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> {
  List<dynamic> _feed = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchFeed();
  }

  Future<void> _fetchFeed() async {
    try {
      final response = await api.get('/users/feed');
      if (mounted) {
        setState(() {
          _feed = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildStars(num rating) {
    return Row(
      children: List.generate(5, (index) {
        return Icon(
          index < rating ? Icons.star : Icons.star_border,
          color: AppTheme.success,
          size: 16,
        );
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ACTIVITY', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2)),
      ),
      body: _isLoading 
        ? const Align(
            alignment: Alignment.topCenter,
            child: LinearProgressIndicator(color: AppTheme.primary, backgroundColor: Colors.transparent),
          )
        : _feed.isEmpty 
          ? const Center(child: Text("No recent activity from your friends.", style: TextStyle(color: AppTheme.textMuted)))
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _feed.length,
              itemBuilder: (context, index) {
                final entry = _feed[index];
                final user = entry['user'];
                final media = entry['media'];
                final hasReview = entry['review'] != null;

                return Card(
                  color: AppTheme.darkBackground,
                  clipBehavior: Clip.antiAlias,
                  shape: RoundedRectangleBorder(
                    side: const BorderSide(color: AppTheme.borderLight),
                    borderRadius: BorderRadius.circular(0),
                  ),
                  margin: const EdgeInsets.only(bottom: 12),
                  child: InkWell(
                    onTap: () {
                      MediaActionModal.show(context, media);
                    },
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                      // Poster
                      SizedBox(
                        width: 100,
                        height: 150,
                        child: media['posterUrl'] != null
                          ? CachedNetworkImage(
                              imageUrl: media['posterUrl'],
                              fit: BoxFit.cover,
                            )
                          : const ColoredBox(
                              color: AppTheme.background,
                              child: Icon(Icons.movie, color: AppTheme.textMuted),
                            ),
                      ),
                      // Details
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                media['title'] ?? 'Unknown',
                                style: const TextStyle(
                                  color: AppTheme.textInvert,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 10,
                                    backgroundImage: user['avatarUrl'] != null ? NetworkImage(user['avatarUrl']) : null,
                                    backgroundColor: AppTheme.borderLight,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    user['username'],
                                    style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              if (entry['rating'] != null) ...[
                                _buildStars(entry['rating']),
                                const SizedBox(height: 8),
                              ],
                              if (entry['liked']) ...[
                                const Icon(Icons.favorite, color: AppTheme.primary, size: 16),
                                const SizedBox(height: 8),
                              ],
                              if (hasReview)
                                Text(
                                  entry['review'] ?? '',
                                  style: const TextStyle(color: AppTheme.textInvert, fontSize: 13),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                            ],
                          ),
                        ),
                      )
                    ],
                  ),
                  ), // End InkWell
                );
              },
            ),
    );
  }
}
