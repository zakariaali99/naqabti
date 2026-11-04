import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../../services/api_service.dart';
import '../../models/notification.dart';
import '../../services/notification_service.dart';
import '../../widgets/general_app_bar.dart';
import '../../routes/app_routes.dart';
import '../../utils/app_snackbar.dart';

class NotificationDetailPage extends StatefulWidget {
  const NotificationDetailPage({super.key});

  @override
  State<NotificationDetailPage> createState() => _NotificationDetailPageState();
}

class _NotificationDetailPageState extends State<NotificationDetailPage> {
  final ApiService _apiService = Get.find<ApiService>();
  
  bool _isLoading = true;
  AppNotification? _notification;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchNotification();
  }

  Future<void> _fetchNotification() async {
    final int? id = Get.arguments['id'];
    if (id == null) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Invalid notification ID';
      });
      return;
    }

    try {
      final notification = await _apiService.notification.getNotification(id);
      
      // Since retrieve marks it as read, we refresh the unread count
      Get.find<NotificationService>().fetchUnreadCount();

      setState(() {
        _notification = notification;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to load notification details';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? null : const Color(0xFFF5F7FA),
      appBar: GeneralAppBar(
        title: l10n.notifications,
        showBackButton: true,
        actions: [
          if (_notification != null)
            IconButton(
              onPressed: _confirmDelete,
              icon: Icon(
                Icons.delete_outline_rounded,
                color: Theme.of(context).colorScheme.error,
              ),
              tooltip: l10n.delete,
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    final l10n = AppLocalizations.of(context)!;
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: Theme.of(context).colorScheme.error,
              ),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _fetchNotification,
                icon: const Icon(Icons.refresh),
                label: Text(l10n.retry),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_notification == null) {
      return Center(child: Text(AppLocalizations.of(context)!.notificationNotFound));
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isDark ? Theme.of(context).colorScheme.surfaceContainerHighest : Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: isDark ? [] : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 15,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF4183D9).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.notifications_active_rounded,
                        color: Color(0xFF4183D9),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _notification!.title ?? 'Notification',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white : const Color(0xFF2D3142),
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _formatDateTime(_notification!.createdAt),
                            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                                  color: Theme.of(context).colorScheme.outline,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Divider(),
                ),
                Text(
                  _notification!.message,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        height: 1.6,
                        color: isDark ? Colors.white.withValues(alpha: 0.9) : const Color(0xFF4F5E7B),
                        fontSize: 16,
                      ),
                ),
                if (_notification!.contentType != null) ...[
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () {
                        final contentType = _notification!.contentType;
                        final objectId = _notification!.objectId;
                        if (contentType == 'post' || contentType == 'news') {
                          Get.toNamed(Routes.news, arguments: {'id': objectId});
                        } else if (contentType == 'payment') {
                          Get.toNamed(Routes.payments, arguments: {'id': objectId});
                        } else if (contentType == 'membership' || contentType == 'doctors_membership') {
                          Get.toNamed(Routes.memberships, arguments: {'id': objectId});
                        }
                      },
                      icon: const Icon(Icons.open_in_new_rounded),
                      label: Text(l10n.viewDetails),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Future<void> _confirmDelete() async {
    final l10n = AppLocalizations.of(context)!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.delete),
        content: Text(l10n.confirmDeleteNotification),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: Text(l10n.delete),
          ),
        ],
      ),
    );

    if (confirmed == true && _notification != null) {
      try {
        await Get.find<NotificationService>().deleteNotification(_notification!.id);
        Get.back();
        AppSnackbar.success(
          l10n.success,
          l10n.notificationDeleted,
        );
      } catch (e) {
        AppSnackbar.error(
          l10n.error,
          l10n.failedToDeleteNotification,
        );
      }
    }
  }

  String _formatDateTime(DateTime dateTime) {
    final local = dateTime.toLocal();
    final day = local.day.toString().padLeft(2, '0');
    final month = local.month.toString().padLeft(2, '0');
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$day/$month/${local.year} $hour:$minute';
  }
}
