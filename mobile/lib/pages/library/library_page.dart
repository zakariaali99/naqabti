import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../../models/library_item.dart';
import '../../services/api_service.dart';
import '../../widgets/general_app_bar.dart';
import '../../utils/external_links.dart';
import '../../utils/app_snackbar.dart';

class LibraryPage extends StatefulWidget {
  const LibraryPage({super.key});

  @override
  State<LibraryPage> createState() => _LibraryPageState();
}

class _LibraryPageState extends State<LibraryPage> with SingleTickerProviderStateMixin {
  final ApiService _apiService = Get.find<ApiService>();
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  
  List<LibraryItem> _items = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _searchQuery = "";
  
  final List<String> _tabs = ['all', 'pdf', 'video', 'link'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_handleTabSelection);
    _loadItems();
  }

  @override
  void dispose() {
    _tabController.removeListener(_handleTabSelection);
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _handleTabSelection() {
    if (_tabController.indexIsChanging) return;
    _loadItems();
  }

  Future<void> _loadItems() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final selectedType = _tabs[_tabController.index];
      final response = await _apiService.library.getAll(
        search: _searchQuery.isEmpty ? null : _searchQuery,
        itemType: selectedType == 'all' ? null : selectedType,
      );
      
      setState(() {
        _items = response.results;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _handleAction(LibraryItem item) async {
    final l10n = AppLocalizations.of(context)!;
    try {
      await _apiService.library.incrementDownload(item.id);
      
      final urlString = item.fileUrl ?? item.externalLink;
      if (urlString != null) {
        if (!await ExternalLinks.open(ExternalLinks.mediaUri(urlString))) {
          AppSnackbar.error(
            l10n.error,
            l10n.couldNotOpenResource,
          );
        }
      }
    } catch (e) {
      debugPrint('Failed to handle action: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: GeneralAppBar(
        title: l10n.electronicLibrary,
        showBackButton: true,
      ),
      body: Column(
        children: [
          // Search Bar Row
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: theme.colorScheme.shadow.withValues(alpha: 0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: l10n.searchPlaceholder,
                        prefixIcon: Icon(Icons.search, color: theme.colorScheme.onSurfaceVariant),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {
                                    _searchQuery = "";
                                  });
                                  _loadItems();
                                },
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                      onSubmitted: (value) {
                        setState(() {
                          _searchQuery = value;
                        });
                        _loadItems();
                      },
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: theme.colorScheme.primary.withValues(alpha: 0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.search, color: Colors.white),
                    onPressed: () {
                      setState(() {
                        _searchQuery = _searchController.text;
                      });
                      _loadItems();
                    },
                    tooltip: l10n.searchPlaceholder,
                  ),
                ),
              ],
            ),
          ),
          
          // Filters
          Container(
            height: 48,
            margin: const EdgeInsets.symmetric(vertical: 12),
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              labelColor: theme.colorScheme.primary,
              unselectedLabelColor: theme.colorScheme.onSurfaceVariant,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              indicator: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: theme.colorScheme.primary.withValues(alpha: 0.08),
                border: Border.all(
                  color: theme.colorScheme.primary.withValues(alpha: 0.15),
                  width: 1,
                ),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20),
              labelPadding: const EdgeInsets.symmetric(horizontal: 16),
              tabs: [
                Tab(text: l10n.all),
                Tab(text: l10n.pdf),
                Tab(text: l10n.video),
                Tab(text: l10n.links),
              ],
            ),
          ),
          
          const Divider(height: 1, color: Colors.transparent),
          
          // List View
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : _errorMessage != null
                ? _buildErrorView()
                : _items.isEmpty
                  ? _buildEmptyView(l10n)
                  : RefreshIndicator(
                      onRefresh: _loadItems,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        itemCount: _items.length,
                        itemBuilder: (context, index) {
                          final item = _items[index];
                          return _buildLibraryItemCard(item, l10n);
                        },
                      ),
                    ),
          ),
        ],
      ),
    );
  }

  Widget _buildLibraryItemCard(LibraryItem item, AppLocalizations l10n) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    IconData iconData;
    Color iconColor;
    
    switch (item.itemType) {
      case 'pdf':
        iconData = Icons.picture_as_pdf_rounded;
        iconColor = const Color(0xFFE53935);
        break;
      case 'video':
        iconData = Icons.play_circle_fill_rounded;
        iconColor = const Color(0xFF1E88E5);
        break;
      case 'link':
        iconData = Icons.link_rounded;
        iconColor = const Color(0xFF43A047);
        break;
      default:
        iconData = Icons.insert_drive_file_rounded;
        iconColor = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: colorScheme.shadow.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
        border: Border.all(
          color: colorScheme.outlineVariant.withValues(alpha: 0.5),
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _handleAction(item),
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(14.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Thumbnail or Icon
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: iconColor.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: item.thumbnailUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.network(
                          item.thumbnailUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Icon(iconData, color: iconColor, size: 28),
                        ),
                      )
                    : Icon(iconData, color: iconColor, size: 28),
                ),
                const SizedBox(width: 14),
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        item.title,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, height: 1.2),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (item.authorName != null && item.authorName!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          item.authorName!,
                          style: TextStyle(
                            color: colorScheme.onSurfaceVariant.withValues(alpha: 0.8),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _buildStat(Icons.visibility_outlined, item.viewCount.toString()),
                          const SizedBox(width: 12),
                          _buildStat(Icons.download_outlined, item.downloadCount.toString()),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: iconColor.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              item.itemType == 'pdf'
                                  ? l10n.pdf
                                  : item.itemType == 'video'
                                      ? l10n.video
                                      : item.itemType == 'link'
                                          ? l10n.link
                                          : item.itemTypeDisplay,
                              style: TextStyle(
                                color: iconColor,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                // Action Arrow / Button
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: colorScheme.primary.withValues(alpha: 0.05),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    item.itemType == 'link' ? Icons.open_in_new_rounded : Icons.download_rounded,
                    color: colorScheme.primary,
                    size: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStat(IconData icon, String value) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Icon(icon, size: 13, color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7)),
        const SizedBox(width: 4),
        Text(
          value,
          style: TextStyle(
            color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildErrorView() {
    final l10n = AppLocalizations.of(context)!;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              l10n.failedToLoadItems,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? l10n.unknownError,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadItems,
              child: Text(l10n.retry),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyView(AppLocalizations l10n) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.library_books_outlined, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            l10n.noResults,
            style: const TextStyle(color: Colors.grey, fontSize: 16),
          ),
        ],
      ),
    );
  }
}
