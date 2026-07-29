import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/network/api_service.dart';
import '../../../../shared/theme/app_theme.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({Key? key}) : super(key: key);

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  String _type = 'MOVIE';
  String _genre = '';
  String _year = '';
  String _sort = 'popularity.desc';

  List<dynamic> _results = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchExplore();
  }

  Future<void> _fetchExplore() async {
    setState(() => _isLoading = true);
    try {
      final response = await api.get('/media/discover', queryParameters: {
        if (_type.isNotEmpty) 'type': _type,
        if (_genre.isNotEmpty) 'genre': _genre,
        if (_year.isNotEmpty) 'year': _year,
        'sort': _sort,
      });
      if (mounted) {
        setState(() {
          _results = response.data['data'] ?? [];
        });
      }
    } catch (e) {
      print(e);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildDropdown(String value, List<String> items, Function(String?) onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppTheme.darkBackground,
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          dropdownColor: AppTheme.darkBackground,
          style: const TextStyle(color: AppTheme.textInvert, fontSize: 13, fontWeight: FontWeight.bold),
          icon: const Icon(Icons.arrow_drop_down, color: AppTheme.textMuted),
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e.isEmpty ? 'Any' : e))).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('EXPLORE', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildDropdown(_type, ['MOVIE', 'TV_SHOW'], (v) { setState(() => _type = v!); _fetchExplore(); }),
                  const SizedBox(width: 8),
                  _buildDropdown(_genre, ['', 'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi'], (v) { setState(() => _genre = v!); _fetchExplore(); }),
                  const SizedBox(width: 8),
                  _buildDropdown(_year, ['', '2024', '2023', '2022', '2021', '2020'], (v) { setState(() => _year = v!); _fetchExplore(); }),
                ],
              ),
            ),
          ),
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
        : GridView.builder(
            padding: const EdgeInsets.all(8),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              childAspectRatio: 2 / 3,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
            ),
            itemCount: _results.length,
            itemBuilder: (context, index) {
              final media = _results[index];
              return Container(
                decoration: BoxDecoration(
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: media['posterUrl'] != null 
                  ? CachedNetworkImage(
                      imageUrl: media['posterUrl'],
                      fit: BoxFit.cover,
                      placeholder: (context, url) => const ColoredBox(color: AppTheme.darkBackground),
                      errorWidget: (context, url, err) => const Icon(Icons.broken_image),
                    )
                  : const ColoredBox(
                      color: AppTheme.darkBackground,
                      child: Icon(Icons.movie, color: AppTheme.textMuted),
                    ),
              );
            },
          ),
    );
  }
}
