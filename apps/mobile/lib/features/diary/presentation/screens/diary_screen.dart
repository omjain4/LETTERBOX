import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../../../core/network/api_service.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../../../shared/widgets/media_action_modal.dart';
import '../../../auth/providers/auth_provider.dart';

class DiaryScreen extends StatefulWidget {
  final String? username;
  const DiaryScreen({Key? key, this.username}) : super(key: key);

  @override
  State<DiaryScreen> createState() => _DiaryScreenState();
}

class _DiaryScreenState extends State<DiaryScreen> {
  bool _isLoading = true;
  List<dynamic> _entries = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchDiary();
  }

  Future<void> _fetchDiary() async {
    final self = context.read<AuthProvider>().user;
    final target = widget.username ?? self?['username'];
    if (target == null) return;
    
    try {
      final response = await api.get('/users/$target/diary?limit=50');
      if (mounted) {
        setState(() {
          _entries = response.data['data'] as List<dynamic>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load diary entries.';
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
          size: 16,
        );
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('DIARY', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2.0)),
        centerTitle: true,
        backgroundColor: AppTheme.background,
        elevation: 0,
      ),
      body: _isLoading
          ? const Align(alignment: Alignment.topCenter, child: LinearProgressIndicator(color: AppTheme.primary, backgroundColor: AppTheme.darkBackground))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: AppTheme.primary)))
              : _entries.isEmpty
                  ? const Center(child: Text('YOUR DIARY IS EMPTY', style: TextStyle(color: AppTheme.textMuted, letterSpacing: 1.5)))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16.0),
                      itemCount: _entries.length,
                      itemBuilder: (context, index) {
                        final entry = _entries[index];
                        final media = entry['media'] ?? {};
                        final title = media['title'] ?? 'Unknown';
                        final year = media['releaseYear'] != null ? ' (${media['releaseYear']})' : '';
                        final hasReview = entry['review'] != null && entry['review'].toString().isNotEmpty;

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
                                SizedBox(
                                  width: 100,
                                  height: 150,
                                  child: media['posterUrl'] != null
                                      ? CachedNetworkImage(
                                          imageUrl: media['posterUrl'],
                                          fit: BoxFit.cover,
                                          errorWidget: (context, url, error) => const ColoredBox(color: AppTheme.background, child: Icon(Icons.movie, color: AppTheme.textMuted)),
                                        )
                                      : const ColoredBox(color: AppTheme.background, child: Icon(Icons.movie, color: AppTheme.textMuted)),
                                ),
                                Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.all(12.0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text.rich(
                                          TextSpan(
                                            children: [
                                              TextSpan(text: title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.textInvert)),
                                              TextSpan(text: year, style: const TextStyle(color: AppTheme.textMuted, fontSize: 14)),
                                            ],
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            if (entry['rating'] != null) _buildStars(entry['rating']),
                                            const SizedBox(width: 8),
                                            if (entry['liked'] == true) const Icon(Icons.favorite, color: AppTheme.primary, size: 16),
                                          ],
                                        ),
                                        if (hasReview) ...[
                                          const SizedBox(height: 12),
                                          Text(
                                            entry['review'],
                                            style: const TextStyle(color: AppTheme.textInvert, fontSize: 13),
                                            maxLines: 3,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
