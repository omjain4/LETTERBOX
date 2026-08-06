import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/network/api_service.dart';
import '../../../../shared/theme/app_theme.dart';

class ListDetailScreen extends StatefulWidget {
  final String listId;
  const ListDetailScreen({Key? key, required this.listId}) : super(key: key);

  @override
  State<ListDetailScreen> createState() => _ListDetailScreenState();
}

class _ListDetailScreenState extends State<ListDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _listData;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchList();
  }

  Future<void> _fetchList() async {
    try {
      final response = await api.get('/lists/${widget.listId}');
      if (mounted) {
        setState(() {
          _listData = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load list details.';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_listData?['name']?.toUpperCase() ?? 'LIST', style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2.0)),
        centerTitle: true,
        backgroundColor: AppTheme.background,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.textInvert),
      ),
      body: _isLoading
          ? const Align(alignment: Alignment.topCenter, child: LinearProgressIndicator(color: AppTheme.primary, backgroundColor: AppTheme.darkBackground))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: AppTheme.primary)))
              : _listData == null
                  ? const Center(child: Text('Not found', style: TextStyle(color: AppTheme.textMuted)))
                  : _buildContent(),
    );
  }

  Widget _buildContent() {
    final items = _listData!['items'] as List<dynamic>? ?? [];

    return Column(
      children: [
        if (_listData!['description'] != null && _listData!['description'].toString().isNotEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: AppTheme.darkBackground,
            child: Text(
              _listData!['description'],
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 14),
              textAlign: TextAlign.center,
            ),
          ),
        Expanded(
          child: items.isEmpty
              ? const Center(child: Text('EMPTY LIST', style: TextStyle(color: AppTheme.textMuted, letterSpacing: 1.5)))
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    childAspectRatio: 2 / 3,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                  ),
                  itemCount: items.length,
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final media = item['media'];
                    return Container(
                      decoration: BoxDecoration(
                        color: AppTheme.darkBackground,
                        border: Border.all(color: AppTheme.borderLight),
                      ),
                      child: media['posterUrl'] != null
                          ? CachedNetworkImage(
                              imageUrl: media['posterUrl'],
                              fit: BoxFit.cover,
                              errorWidget: (c, u, e) => const Center(child: Icon(Icons.movie, color: AppTheme.textMuted)),
                            )
                          : const Center(child: Icon(Icons.movie, color: AppTheme.textMuted)),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
