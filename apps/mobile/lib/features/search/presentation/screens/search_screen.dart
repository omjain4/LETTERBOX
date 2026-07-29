import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/network/api_service.dart';
import '../../../../shared/theme/app_theme.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({Key? key}) : super(key: key);

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;
  
  bool _isLoading = false;
  List<dynamic> _movies = [];
  List<dynamic> _tvShows = [];
  List<dynamic> _music = [];
  List<dynamic> _youtube = [];

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      _performSearch(_searchController.text);
    });
  }

  Future<void> _performSearch(String query) async {
    if (query.length < 2) {
      if (mounted) {
        setState(() {
          _movies = []; _tvShows = []; _music = []; _youtube = [];
          _isLoading = false;
        });
      }
      return;
    }

    setState(() => _isLoading = true);

    try {
      final response = await api.get('/search?q=$query&limit=5');
      final data = response.data['data'] as List<dynamic>;

      setState(() {
        _movies = data.where((m) => m['mediaType'] == 'MOVIE').toList();
        _tvShows = data.where((m) => m['mediaType'] == 'TV_SHOW').toList();
        _music = data.where((m) => m['mediaType'] == 'SONG').toList();
        _youtube = data.where((m) => m['mediaType'] == 'YOUTUBE_VIDEO').toList();
      });
    } catch (e) {
      print("Search failed: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Widget _buildHorizontalStrip(String title, List<dynamic> items) {
    if (items.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.0,
              color: AppTheme.textMuted,
            ),
          ),
        ),
        SizedBox(
          height: 180,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12.0),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              return Container(
                width: 120,
                margin: const EdgeInsets.symmetric(horizontal: 4.0),
                decoration: BoxDecoration(
                  color: AppTheme.darkBackground,
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: item['posterUrl'] != null
                    ? CachedNetworkImage(
                        imageUrl: item['posterUrl'],
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const Center(
                            child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2)),
                        errorWidget: (context, url, error) => const Icon(Icons.movie, color: AppTheme.textMuted),
                      )
                    : const Center(child: Icon(Icons.movie, size: 40, color: AppTheme.textMuted)),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search films, tv shows, songs...',
                  prefixIcon: const Icon(Icons.search, color: AppTheme.textMuted),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(0),
                    borderSide: const BorderSide(color: AppTheme.borderLight),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(0),
                    borderSide: const BorderSide(color: AppTheme.primary, width: 2),
                  ),
                ),
              ),
            ),
            if (_isLoading)
              const Expanded(
                child: Center(
                  child: CircularProgressIndicator(color: AppTheme.primary),
                ),
              )
            else if (_movies.isEmpty && _tvShows.isEmpty && _music.isEmpty && _youtube.isEmpty && _searchController.text.length >= 2)
              const Expanded(
                child: Center(
                  child: Text('NO RESULTS FOUND', style: TextStyle(color: AppTheme.textMuted, letterSpacing: 1.0)),
                ),
              )
            else if (_searchController.text.length < 2)
              const Expanded(
                child: Center(
                  child: Text('SEARCH EVERYTHING', style: TextStyle(color: AppTheme.textMuted, letterSpacing: 2.0, fontSize: 18, fontWeight: FontWeight.bold)),
                ),
              )
            else
              Expanded(
                child: ListView(
                  children: [
                    _buildHorizontalStrip('MOVIES', _movies),
                    _buildHorizontalStrip('TV SHOWS', _tvShows),
                    _buildHorizontalStrip('SONGS', _music),
                    _buildHorizontalStrip('YOUTUBE', _youtube),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
