# Mobile UX & Fixes — Technical Details

## 1. Switch to Local Backend

**File:** `mobile/lib/config/api_config.dart`

```dart
// Before:
static const String baseUrl = 'https://my.naqabti.ly/api/';
// static const String baseUrl = 'http://192.168.0.198:8001/api/';

// After:
// static const String baseUrl = 'https://my.naqabti.ly/api/';
static const String baseUrl = 'http://192.168.0.198:8001/api/';
```

Allows local testing of 404-fixed endpoints against the running Django dev server.

---

## 2. Fix `failedToLoadData` l10n Bug

**File:** `mobile/lib/pages/medical_reports/medical_reports_page.dart`

**Root cause:** `failedToLoadData` in `app_localizations.dart` is defined as `String failedToLoadData(Object error)` — a function requiring an argument. The page called it without arguments, producing the "Closure: (Object) => String" error message in the UI.

```dart
// Before:
Text('${l10n.failedToLoadData}: $_errorMessage'),

// After:
Text(l10n.failedToLoadData(_errorMessage ?? '')),
```

---

## 3. Restructure Bottom Nav (Remove Notifications Tab)

**Files:** `home_page.dart`, `main_bottom_nav_bar.dart`

### Why
Notifications are now a popup overlay (see §5). 3 tabs → 2 tabs makes the bottom nav cleaner and eliminates the redundant full-screen notifications page.

### Changes

| File | Before | After |
|------|--------|-------|
| `home_page.dart` | `TabController(length: 3)`, `_tabController.index = 1`, 3 children in TabBarView | `TabController(length: 2)`, `_tabController.index = 0`, 2 children |
| `home_page.dart` | `_getAppBarTitle` had 3 cases (notif, home, profile) | 2 cases (home, profile) |
| `main_bottom_nav_bar.dart` | 3 nav items (notif bell, home, person) with `showBadge` param | 2 nav items (home, person), badge removed, `showBadge` param deleted |
| `main_bottom_nav_bar.dart` | Imported `get` + `notification_service.dart` | Imports cleaned up |
| `home_page.dart` | `canPop: _tabController.index == 1` | `canPop: _tabController.index == 0` |

---

## 4. App Bar Actions: Notifications + Language + Theme

**File:** `mobile/lib/pages/home/home_page.dart`

New method `_buildAppBarActions(BuildContext context)` returns a `List<Widget>` passed to `GeneralAppBar(actions:)`.

### Notification Bell
- Wrapped in `Obx` for reactive badge count
- `Badge` widget showing `NotificationService.unreadCount` (capped at 99+)
- Tapping calls `_showNotificationPopup(context)` → `NotificationPopup.show(context)`

### Language Toggle
- Flag emoji icon: 🇺🇸 (English) or 🇸🇦 (Arabic)
- Reads current locale from `Get.locale?.languageCode`
- Tapping calls `SettingsService.to.saveLocale(Locale('ar'/'en'))`

### Theme Toggle
- Sun icon (light mode) or moon icon (dark mode) — shows *opposite* action
- Reads current brightness from `Theme.of(context).brightness`
- Tapping calls `SettingsService.to.saveThemeMode(ThemeMode.dark/light)`

---

## 5. Notification Popup (Bottom Sheet)

**New file:** `mobile/lib/widgets/notification_popup.dart`

### Architecture
- `NotificationPopup` is a static class with a single `show(BuildContext context)` method
- Internally uses `_NotificationSheet` StatefulWidget + `DraggableScrollableSheet`
- Initial size: 65% of screen, draggable from 40%–85%

### States
| State | UI |
|-------|----|
| Loading | Centered `CircularProgressIndicator` |
| Error | Error icon + message + "Retry" button |
| Empty | Bell icon + "No notifications" + "You're all caught up!" |
| Data | Scrollable list with RefreshIndicator |

### Header
- Title "Notifications" + "Mark all read" button (visible only when unread exist) + Close (X) button

### Item Layout
```
┌─────────────────────────────────────────────┐
│  🔔   Title (bold if unread)       ● (dot) │
│       Message preview (1 line)               │
│       5m ago                                 │
└─────────────────────────────────────────────┘
```
- Read items: `surfaceContainerLow` background, normal weight
- Unread items: `primaryContainer` with 0.3 alpha, bold title, blue dot

### Tap Behavior
1. If unread: call `markNotificationAsRead()` API + `decrementUnreadCount()` + update notification in local list via `copyWith(read: true)`
2. Show message in a bottom sheet dialog (not full page navigation)
3. "View Details" button navigates to content target (if `contentType` is set)

> **Note:** The local `_notifications` list is updated in-place after marking read so the unread dot disappears immediately without needing to re-fetch.

---

### Fix: `mark_all_as_read` URL Mismatch

**File:** `mobile/lib/api/notification_api_client.dart`

**Root cause:** DRF's `DefaultRouter` generates snake_case URLs from action method names. The `mark_all_as_read` action produces `notifications/mark_all_as_read/` (underscores), but the client was sending to `notifications/mark-all-as-read/` (hyphens), causing a 405 Method Not Allowed.

```dart
// Before:
@POST('notifications/mark-all-as-read/')

// After:
@POST('notifications/mark_all_as_read/')
```

---

### Fix: `mark_all_as_read` Not Creating SeenNotification Records

**File:** `backend/niqabaty/views/notification_viewset.py`

**Root cause:** Django querysets are lazy. After `unread_notifications.update(is_read=True, read_at=now)`, re-iterating the same queryset re-evaluates it — and since all records now have `is_read=True`, the filter returns nothing. No `SeenNotification` records were created, so the `unread_count` endpoint (which counts notifications without `SeenNotification` records) returned the stale pre-read count.

```python
# Before (broken):
unread_notifications = Notification.objects.filter(user=request.user, is_read=False)
count = unread_notifications.count()
unread_notifications.update(is_read=True, read_at=timezone.now())
for notification in unread_notifications:   # ← re-evaluates to empty!
    SeenNotification.objects.get_or_create(...)

# After (fixed):
unread_notifications = Notification.objects.filter(...)
notification_ids = list(unread_notifications.values_list('id', flat=True))
count = len(notification_ids)
unread_notifications.update(is_read=True, read_at=timezone.now())
for nid in notification_ids:               # ← uses stored IDs
    SeenNotification.objects.get_or_create(user=request.user, notification_id=nid)
```

---

### Fix: Single Notification Dot State Management

**File:** `mobile/lib/widgets/notification_popup.dart`

The `_openNotification` method now:
1. Calls `fetchUnreadCount()` instead of `decrementUnreadCount()` to sync badge count from server
2. Updates the local `_notifications` list with `copyWith(read: true)` so the blue dot disappears immediately
3. Calls `setState({})` after the message sheet is dismissed to ensure a final re-render

---

## 6. Fix Badge Reappearing (Stale Count Guard)

**File:** `mobile/lib/services/notification_service.dart`

### Root Cause
When user views a notification detail:
1. GET marks it as read server-side
2. `fetchUnreadCount()` fetches new count
3. But FCM foreground messages also call `fetchUnreadCount()`, potentially overwriting with a stale pre-read count

### Solution: Debounce Guard
- Track `_lastDecrementTime` (set in `decrementUnreadCount()`)
- In `fetchUnreadCount()`, call `_guardAgainstStaleRefresh()` — throws if called within 2 seconds of last decrement
- The stale fetch is silently ignored

```dart
void _guardAgainstStaleRefresh() {
  if (_lastDecrementTime != null &&
      DateTime.now().difference(_lastDecrementTime!) < Duration(seconds: 2)) {
    _lastDecrementTime = null;
    throw Exception('stale refresh ignored');
  }
}
```

Additionally, `_openNotification` in the popup calls `decrementUnreadCount()` optimistically before the API call completes, giving instant visual feedback.

---

## 7. Dead Code Note

`mobile/lib/pages/notifications/notifications_page.dart` is no longer referenced. The full-screen notifications list page was replaced by the popup overlay. It can be removed in a future cleanup pass. `notification_detail_page.dart` is still used (navigated to from the popup).
