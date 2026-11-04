# Fixes — Implementation Plan

## 1. Mobile: Payments Filter Parameter Mismatch

**File:** `mobile/lib/pages/payments/payments_page.dart`

**Issue:** Mobile sends `membership__doctor` as query param, but backend only accepts `doctor_id`. The filter is silently ignored → all payments returned.

**Changes:**
- Line 58: `'membership__doctor': _authService.user?.id` → `'doctor_id': _authService.user?.id`
- Line 86: Same change in `_loadMorePayments()`

---

## 2. Mobile: Medical Reports API Broken URLs

**File:** `mobile/lib/api/medical_report_api_client.dart`

**Issue:** All endpoint paths start with `/` (e.g. `/medical-reports/`). Dio treats leading `/` as absolute path, stripping `/api/` from base URL `https://my.naqabti.ly/api/` → requests go to `https://my.naqabti.ly/medical-reports/` (404).

**Changes:** Remove leading `/` from all endpoint annotations:
| Line | Before | After |
|------|--------|-------|
| 13 | `@GET('/medical-reports/')` | `@GET('medical-reports/')` |
| 17 | `@GET('/medical-reports/{id}/')` | `@GET('medical-reports/{id}/')` |
| 20 | `@POST('/medical-reports/')` | `@POST('medical-reports/')` |
| 25 | `@PATCH('/medical-reports/{id}/')` | `@PATCH('medical-reports/{id}/')` |
| 32 | `@DELETE('/medical-reports/{id}/')` | `@DELETE('medical-reports/{id}/')` |
| 45 | `@GET('/medical-reports/{id}/export_pdf/')` | `@GET('medical-reports/{id}/export_pdf/')` |

---

## 3. Mobile: Null-Safety Guards

### 3a. Payments page

**File:** `mobile/lib/pages/payments/payments_page.dart`

**Issue:** `_authService.user?.id` could be `null`, causing API to receive `{'doctor_id': null}`.

**Changes:**
- Lines 56-61: Add null guard before API call (same pattern as `memberships_page.dart`)
  ```dart
  final user = _authService.user;
  if (user == null) {
    setState(() {
      _isLoading = false;
      _errorMessage = 'User not logged in';
    });
    return;
  }
  ```
- Pass `user.id` instead of `_authService.user?.id`

### 3b. Certifications page

**File:** `mobile/lib/pages/certifications/certifications_page.dart`

**Issue:** Same null user risk + potential null crash on `certification.certificationType.name` (line 199).

**Changes:**
- Lines 36-41: Add null guard for user before API call
- Line 199: Change `certification.certificationType.name` to `certification.certificationType?.name ?? ''`

---

## 4. Frontend: Remove Email Verification from Login

**File:** `frontend/src/pages/auth/login.tsx`

**Issue:** Commented-out code that would redirect to `/auth/verify-email` on login failure if backend returned `email_not_verified` error. Remove dead code and ensure login is username-only.

**Changes:**
- Lines 81-89: Remove the commented-out block:
  ```typescript
  // Check if error is email not verified
  // if (error.response?.data?.error === 'email_not_verified') {
  //   const userId = error.response.data.user_id;
  //   const email = error.response.data.email;
  //   navigate(`/auth/verify-email?user_id=${userId}&email=${email}`);
  //   return;
  // }
  ```

---

## 5. Backend: Remove Email as Login Credential

**File:** `backend/niqabaty/serializers/auth.py`

**Issue:** `LoginSerializer` accepts `email` as an alternative login field, allowing API-level login via email. Since frontend is username-only, this is unnecessary and bypasses intended login flow.

**Changes:**
- Line 18: Remove `email = EmailField(required=False)`
- Lines 32-37: Remove the email-to-username lookup block:
  ```python
  if email:
      try:
          user_obj = User.objects.get(email=email)
          username = user_obj.username
      except User.DoesNotExist:
          pass
  ```
- Line 28: Update validation message: `'Provide username or email and password'` → `'Provide username and password'`

---

## 6. Backend: Clean Up Commented Email Checks

**File:** `backend/niqabaty/views/auth_views.py`

**Issue:** Dead commented-out code for email verification checks during login and registration.

**Changes:**
- Lines 28-35: Remove the commented-out email verification check block in `LoginView`
- Lines 75-80: Remove the commented-out `send_verification_email` block in `RegisterView`
