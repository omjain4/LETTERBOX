import 'package:flutter/material.dart';
import '../../core/network/api_service.dart';
import '../theme/app_theme.dart';

class MediaActionModal extends StatefulWidget {
  final Map<String, dynamic> media;

  const MediaActionModal({Key? key, required this.media}) : super(key: key);

  static void show(BuildContext context, Map<String, dynamic> media) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => MediaActionModal(media: media),
    );
  }

  @override
  State<MediaActionModal> createState() => _MediaActionModalState();
}

class _MediaActionModalState extends State<MediaActionModal> {
  num _rating = 0;
  bool _liked = false;
  final TextEditingController _reviewController = TextEditingController();
  bool _isSubmitting = false;
  bool _isWatched = true;
  bool _inWatchlist = false;

  Widget _buildActionButton(IconData icon, String label, bool isActive, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, color: isActive ? AppTheme.success : AppTheme.textMuted, size: 24),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: isActive ? AppTheme.success : AppTheme.textMuted, fontSize: 10)),
        ],
      ),
    );
  }

  Future<void> _submitReview() async {
    if (_rating == 0 && _reviewController.text.trim().isEmpty) {
      Navigator.pop(context); // Nothing to submit
      return;
    }
    
    setState(() => _isSubmitting = true);
    
    try {
      final now = DateTime.now();
      final dateStr = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
      
      final Map<String, dynamic> data = {
        'mediaId': widget.media['id'],
        'watchedDate': dateStr,
        'liked': _liked,
      };
      
      if (_rating > 0) data['rating'] = _rating;
      if (_reviewController.text.trim().isNotEmpty) data['review'] = _reviewController.text.trim();
      
      final tags = <String>[];
      if (_inWatchlist) tags.add('Watchlist');
      if (tags.isNotEmpty) data['tags'] = tags;
      
      if (_isWatched || _rating > 0 || _reviewController.text.trim().isNotEmpty) {
        await api.post('/diary', data: data);
      }

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Media logged successfully!', style: TextStyle(color: AppTheme.textInvert)), backgroundColor: AppTheme.success),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to log media', style: TextStyle(color: AppTheme.textInvert)), backgroundColor: AppTheme.primary),
        );
      }
    }
  }

  Widget _buildInteractiveStars() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (index) {
        return GestureDetector(
          onTap: () {
            setState(() {
              _rating = index + 1;
            });
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4.0),
            child: Icon(
              index < _rating ? Icons.star : Icons.star_border,
              color: AppTheme.success,
              size: 40,
            ),
          ),
        );
      }),
    );
  }

  @override
  void dispose() {
    _reviewController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mediaInfo = widget.media;
    final year = mediaInfo['releaseYear'] != null ? ' (${mediaInfo['releaseYear']})' : '';

    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.darkBackground,
        borderRadius: BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
        border: Border(top: BorderSide(color: AppTheme.borderLight, width: 2)),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              if (mediaInfo['posterUrl'] != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: Image.network(mediaInfo['posterUrl'], width: 60, height: 90, fit: BoxFit.cover),
                )
              else
                Container(width: 60, height: 90, color: AppTheme.background, child: const Icon(Icons.movie, color: AppTheme.textMuted)),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'I WATCHED...',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 12, letterSpacing: 1.5, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${mediaInfo['title'] ?? 'Unknown'}$year',
                      style: const TextStyle(color: AppTheme.textInvert, fontSize: 20, fontWeight: FontWeight.bold),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildActionButton(Icons.remove_red_eye, "Watched", _isWatched, () {
                          setState(() {
                            _isWatched = !_isWatched;
                            if (_isWatched) _inWatchlist = false;
                          });
                        }),
                        const SizedBox(width: 16),
                        _buildActionButton(Icons.watch_later, "Watchlist", _inWatchlist, () {
                          setState(() {
                            _inWatchlist = !_inWatchlist;
                            if (_inWatchlist) _isWatched = false;
                          });
                        }),
                      ],
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(_liked ? Icons.favorite : Icons.favorite_border, color: _liked ? AppTheme.primary : AppTheme.textMuted, size: 28),
                onPressed: () {
                  setState(() => _liked = !_liked);
                },
              )
            ],
          ),
          const SizedBox(height: 24),
          _buildInteractiveStars(),
          const SizedBox(height: 24),
          TextField(
            controller: _reviewController,
            style: const TextStyle(color: AppTheme.textInvert),
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Add a review...',
              hintStyle: TextStyle(color: AppTheme.textMuted),
              filled: true,
              fillColor: Colors.black45,
              border: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppTheme.borderLight)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: AppTheme.primary)),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submitReview,
              child: _isSubmitting 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: AppTheme.textInvert, strokeWidth: 2))
                  : const Text('SAVE', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2)),
            ),
          )
        ],
      ),
    );
  }
}
