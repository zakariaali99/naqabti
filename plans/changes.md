# Changes

## Mobile
- Fix payments filter parameter mismatch
- Fix medical reports API endpoint broken URLs
- Add null-safety guards to payments and certifications pages
- Fix `failedToLoadData` l10n parameter bug in medical reports page
- Switch baseUrl to local backend for testing
- Remove notifications tab from bottom nav (3 → 2 tabs: Home, Profile)
- Add notification bell with live badge count to app bar
- Add language flag toggle and theme sun/moon toggle to app bar
- Create notification popup overlay (bottom sheet with recent 10 notifications)
- Move unread badge from bottom nav to app bar bell icon
- Fix unread badge reappearing after viewing notifications (optimistic decrement + debounce guard)
- Fix `markAllNotificationsAsRead` URL: changed `mark-all-as-read` → `mark_all_as_read` (underscore mismatch with DRF router)
- Fix notification dot not disappearing after opening: added local list state update + `copyWith` on `AppNotification` model
- Fix "Mark all as read" not updating badge count: backend `mark_all_as_read` was not creating `SeenNotification` records (queryset re-evaluated empty after `update()`), causing `unread_count` to return stale count
- Add long-press context menu on notification items: "Mark as read"/"Mark as unread" via bottom sheet
- Add backend `mark_as_unread` action: sets `is_read=False, read_at=None` + deletes `SeenNotification` record
- Fix "Mark as read" context menu action (was incorrectly calling `_openNotification` instead of just marking silently)
- Fix `mark_as_read` and `mark_as_unread` responses: both returned wrapped `{status, message, notification: {...}}` but Retrofit client expects raw notification object; changed to `Response(serializer.data)` — this was silently breaking badge recount and dot state updates (caught by JSON parse failure in `catch (_)`)
- Reseed 16 notifications (10 unread, 6 read) for user `zakzakzak`

## Frontend
- Remove email verification step from login flow
- Remove commented-out email verification redirect code

## Backend
- Remove email as login credential in LoginSerializer
- Remove commented-out email verification checks in auth views

## Email (Free Fixes)
- Send emails asynchronously (non-blocking background thread)
- Add try/catch + proper logging to email sending
- Remove credential-printing debug lines from email utils
- Add retry logic (3 attempts with exponential backoff)
- Add HTML email template for better deliverability

## Docs
- `plans/mobile-ux-and-fixes-technical.md` — detailed technical documentation for mobile changes
