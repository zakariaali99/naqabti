import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../models/notification.dart';
import '../services/api_service.dart';
import '../services/notification_service.dart';
import '../routes/app_routes.dart';
import '../utils/app_snackbar.dart';

class NotificationPopup {
  static Future<void> show(BuildContext context) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => _NotificationSheet(),
    );
  }
}

class _NotificationSheet extends StatefulWidget {
  @override
  State<_NotificationSheet> createState() => _NotificationSheetState();
}

class _NotificationSheetState extends State<_NotificationSheet> {
  final ApiService _apiService = Get.find<ApiService>();
  final NotificationService _notificationService =
      Get.find<NotificationService>();

  bool _isLoading = true;
  List<AppNotification> _notifications = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      final response = await _apiService.notification.getNotifications({
        'page_size': 10,
      });
      if (mounted) {
        setState(() {
          _notifications = response.results;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("error loading notifications: $e");
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        setState(() {
          _isLoading = false;
          _errorMessage = l10n.failedToLoadNotifications;
        });
      }
    }
  }

  Future<void> _markAllRead() async {
    try {
      await _apiService.notification.markAllNotificationsAsRead();
      _notificationService.fetchUnreadCount();
      await _loadNotifications(silent: true);
    } catch (_) {
      if (!mounted) return;
      final l10n = AppLocalizations.of(context)!;
      AppSnackbar.error(l10n.error, l10n.somethingWentWrong);
    }
  }

  Future<void> _openNotification(AppNotification notification) async {
    if (!notification.read) {
      try {
        await _apiService.notification.markNotificationAsRead(
          notification.id,
        );
        _notificationService.fetchUnreadCount();
        final idx = _notifications.indexWhere((n) => n.id == notification.id);
        if (idx != -1) {
          setState(() {
            _notifications[idx] = _notifications[idx].copyWith(read: true);
          });
        }
      } catch (_) {}
    }

    if (!mounted) return;
    final l10n = AppLocalizations.of(context)!;

    await showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      notification.title ?? l10n.notification,
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(sheetContext),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                _formatDate(notification.createdAt),
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: Theme.of(context).colorScheme.outline,
                    ),
              ),
              const Divider(height: 24),
              Text(
                notification.message,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      height: 1.5,
                    ),
              ),
              if (notification.contentType != null) ...[
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () {
                      Navigator.pop(sheetContext);
                      _navigateToTarget(notification);
                    },
                    icon: const Icon(Icons.open_in_new_rounded, size: 18),
                    label: Text(l10n.viewDetails),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );

    if (mounted) setState(() {});
  }

  String _formatDate(DateTime dateTime) {
    final local = dateTime.toLocal();
    final day = local.day.toString().padLeft(2, '0');
    final month = local.month.toString().padLeft(2, '0');
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$day/$month/${local.year} $hour:$minute';
  }

  void _navigateToTarget(AppNotification notification) {
    final contentType = notification.contentType;
    final objectId = notification.objectId;
    if (contentType == 'post' || contentType == 'news') {
      Get.toNamed(Routes.news, arguments: {'id': objectId});
    } else if (contentType == 'payment') {
      Get.toNamed(Routes.payments, arguments: {'id': objectId});
    } else if (contentType == 'membership' || contentType == 'doctors_membership') {
      Get.toNamed(Routes.memberships, arguments: {'id': objectId});
    } else {
      Get.toNamed(Routes.notificationDetail, arguments: {'id': notification.id});
    }
  }

  Future<void> _showNotificationContextMenu(AppNotification notification) async {
    final l10n = AppLocalizations.of(context)!;
    final result = await showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (notification.read)
                ListTile(
                  leading: const Icon(Icons.mark_email_unread_rounded),
                  title: Text(l10n.markAsUnread),
                  onTap: () => Navigator.pop(ctx, 'unread'),
                )
              else
                ListTile(
                  leading: const Icon(Icons.done_all_rounded),
                  title: Text(l10n.markAsRead),
                  onTap: () => Navigator.pop(ctx, 'read'),
                ),
            ],
          ),
        ),
      ),
    );

    if (result == null || !mounted) return;

    if (result == 'read') {
      try {
        await _apiService.notification.markNotificationAsRead(notification.id);
        _notificationService.fetchUnreadCount();
        final idx = _notifications.indexWhere((n) => n.id == notification.id);
        if (idx != -1) {
          setState(() {
            _notifications[idx] = _notifications[idx].copyWith(read: true);
          });
        }
      } catch (_) {}
    } else if (result == 'unread') {
      try {
        await _apiService.notification.markNotificationAsUnread(notification.id);
        _notificationService.fetchUnreadCount();
        final idx = _notifications.indexWhere((n) => n.id == notification.id);
        if (idx != -1) {
          setState(() {
            _notifications[idx] = _notifications[idx].copyWith(read: false);
          });
        }
      } catch (_) {}
    }
  }

  Widget _buildTimeAgo(DateTime dateTime) {
    final l10n = AppLocalizations.of(context)!;
    final now = DateTime.now();
    final difference = now.difference(dateTime.toLocal());
    String text;
    if (difference.isNegative) {
      text = l10n.justNow;
    } else if (difference.inDays > 7) {
      text = '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    } else if (difference.inDays >= 1) {
      text = l10n.daysAgo(difference.inDays.toString());
    } else if (difference.inHours >= 1) {
      text = l10n.hoursAgo(difference.inHours.toString());
    } else if (difference.inMinutes >= 1) {
      text = l10n.minutesAgo(difference.inMinutes.toString());
    } else {
      text = l10n.justNow;
    }
    return Text(
      text,
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: Theme.of(context).colorScheme.outline,
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      minChildSize: 0.4,
      maxChildSize: 0.85,
      expand: false,
      builder: (context, scrollController) => Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
            child: Row(
              children: [
                Text(
                  l10n.notifications,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const Spacer(),
                if (_notifications.any((n) => !n.read))
                  TextButton.icon(
                    onPressed: _markAllRead,
                    icon: const Icon(Icons.done_all, size: 18),
                    label: Text(l10n.markAllRead),
                  ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: _buildBody(scrollController),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(ScrollController scrollController) {
    final l10n = AppLocalizations.of(context)!;

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline,
                size: 48, color: Theme.of(context).colorScheme.error),
            const SizedBox(height: 16),
            Text(_errorMessage!),
            const SizedBox(height: 16),
            FilledButton.tonal(
              onPressed: _loadNotifications,
              child: Text(l10n.retry),
            ),
          ],
        ),
      );
    }

    if (_notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.notifications_none_rounded,
                size: 64, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 16),
            Text(
              l10n.noNotifications,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              l10n.youAreAllCaughtUp,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
        ),
      );
    }

    final colorScheme = Theme.of(context).colorScheme;

    return RefreshIndicator(
      onRefresh: _loadNotifications,
      child: ListView.builder(
        controller: scrollController,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _notifications.length,
        itemBuilder: (context, index) {
          final notification = _notifications[index];
          final isRead = notification.read;

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Material(
              color: isRead
                  ? colorScheme.surfaceContainerLow
                  : colorScheme.primaryContainer.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(16),
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => _openNotification(notification),
                onLongPress: () => _showNotificationContextMenu(notification),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isRead
                              ? colorScheme.onSurface.withValues(alpha: 0.05)
                              : colorScheme.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isRead
                              ? Icons.notifications_none
                              : Icons.notifications_active_rounded,
                          size: 18,
                          color: isRead
                              ? colorScheme.onSurfaceVariant
                              : colorScheme.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    notification.title ?? l10n.notification,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleSmall
                                        ?.copyWith(
                                          fontWeight: isRead
                                              ? FontWeight.w600
                                              : FontWeight.w800,
                                        ),
                                  ),
                                ),
                                if (!isRead)
                                  Container(
                                    margin: const EdgeInsets.only(left: 6),
                                    width: 7,
                                    height: 7,
                                    decoration: BoxDecoration(
                                      color: colorScheme.primary,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              notification.message,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style:
                                  Theme.of(context).textTheme.bodySmall?.copyWith(
                                        color:
                                            colorScheme.onSurfaceVariant,
                                      ),
                            ),
                            const SizedBox(height: 4),
                            _buildTimeAgo(notification.createdAt),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
