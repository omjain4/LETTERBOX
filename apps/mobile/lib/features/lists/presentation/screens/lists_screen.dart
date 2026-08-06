import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/network/api_service.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../../auth/providers/auth_provider.dart';
import 'list_detail_screen.dart';

class ListsScreen extends StatefulWidget {
  final String? username;
  const ListsScreen({Key? key, this.username}) : super(key: key);

  @override
  State<ListsScreen> createState() => _ListsScreenState();
}

class _ListsScreenState extends State<ListsScreen> {
  bool _isLoading = true;
  List<dynamic> _lists = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchLists();
  }

  Future<void> _fetchLists() async {
    final self = context.read<AuthProvider>().user;
    final target = widget.username ?? self?['username'];
    if (target == null) return;
    
    try {
      final response = await api.get('/users/$target/lists');
      if (mounted) {
        setState(() {
          _lists = response.data['data'] as List<dynamic>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load lists.';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _createList() async {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    bool isPublic = true;

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateSB) => AlertDialog(
          backgroundColor: AppTheme.darkBackground,
          title: const Text('CREATE LIST', style: TextStyle(color: AppTheme.textInvert, letterSpacing: 1.5, fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                style: const TextStyle(color: AppTheme.textInvert),
                decoration: const InputDecoration(
                  labelText: 'List Name',
                  labelStyle: TextStyle(color: AppTheme.textMuted),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: descriptionController,
                style: const TextStyle(color: AppTheme.textInvert),
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Description (optional)',
                  labelStyle: TextStyle(color: AppTheme.textMuted),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text('Public List', style: TextStyle(color: AppTheme.textInvert)),
                value: isPublic,
                onChanged: (val) => setStateSB(() => isPublic = val),
                activeColor: AppTheme.primary,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('CANCEL', style: TextStyle(color: AppTheme.textMuted)),
            ),
            TextButton(
              onPressed: () async {
                if (titleController.text.trim().isEmpty) return;
                try {
                  await api.post('/lists', data: {
                    'name': titleController.text.trim(),
                    'description': descriptionController.text.trim(),
                    'isPublic': isPublic,
                  });
                  if (mounted) Navigator.pop(context, true);
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to create list')));
                }
              },
              child: const Text('CREATE', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );

    if (result == true) {
      setState(() => _isLoading = true);
      _fetchLists();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSelf = widget.username == null || widget.username == context.read<AuthProvider>().user?['username'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('LISTS', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2.0)),
        centerTitle: true,
        backgroundColor: AppTheme.background,
        elevation: 0,
      ),
      floatingActionButton: isSelf ? FloatingActionButton(
        onPressed: _createList,
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: AppTheme.textOnPrimary),
      ) : null,
      body: _isLoading
          ? const Align(alignment: Alignment.topCenter, child: LinearProgressIndicator(color: AppTheme.primary, backgroundColor: AppTheme.darkBackground))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: AppTheme.primary)))
              : _lists.isEmpty
                  ? const Center(child: Text('NO LISTS FOUND', style: TextStyle(color: AppTheme.textMuted, letterSpacing: 1.5)))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16.0),
                      itemCount: _lists.length,
                      itemBuilder: (context, index) {
                        final list = _lists[index];
                        return Card(
                          color: AppTheme.darkBackground,
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(
                            side: const BorderSide(color: AppTheme.borderLight),
                            borderRadius: BorderRadius.circular(0),
                          ),
                          child: ListTile(
                            onTap: () {
                              Navigator.push(context, MaterialPageRoute(
                                builder: (_) => ListDetailScreen(listId: list['id'])
                              ));
                            },
                            title: Text(list['name'], style: const TextStyle(color: AppTheme.textInvert, fontWeight: FontWeight.bold)),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (list['description'] != null && list['description'].toString().isNotEmpty)
                                  Text(list['description'], style: const TextStyle(color: AppTheme.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(list['isPublic'] ? Icons.public : Icons.lock, size: 14, color: AppTheme.textDim),
                                    const SizedBox(width: 4),
                                    Text('${list['_count']?['items'] ?? 0} items', style: const TextStyle(color: AppTheme.textDim, fontSize: 12)),
                                  ],
                                )
                              ],
                            ),
                            trailing: const Icon(Icons.chevron_right, color: AppTheme.textMuted),
                          ),
                        );
                      },
                    ),
    );
  }
}
