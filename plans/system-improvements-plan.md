# Detailed Implementation Plan: Niqabaty System — 17 Tasks

## Task 1: Doctor Heatmap — Add Icon + Restrict to Admin

**Current state:** The heatmap is accessible at `/doctor-map` via the "Dashboard" nav section in `site.ts:12` with no permission guard. It uses `ProtectedView` but anyone logged in can access it.

**Files to modify:**

| File | Lines | Action |
|------|-------|--------|
| `frontend/src/config/site.ts` | 11-12 | Add `permission: PERMISSIONS.MEMBERSHIP.VIEW` to the doctor-map nav item so only staff/managers see the icon in sidebar. |
| `frontend/src/App.tsx` | 426 | Wrap `<DoctorHeatmapPage />` route with `<PermissionGuard permission={PERMISSIONS.USER.VIEW} fallback={<Navigate to="/" replace />}>` to block non-admin users. |
| `frontend/src/pages/dashboard/DoctorHeatmapPage.tsx` | 600-605 | Add a `<FiMapPin>` icon next to the title "Doctor Heatmap" in the header section. |

**Backend (optional extra protection):**
| File | Lines | Action |
|------|-------|--------|
| `backend/niqabaty/views/doctor_distribution_view.py` | — | Add `permission_classes = [IsAuthenticated]` and a custom check for staff/superuser. |

---

## Task 2: Membership Add/Edit — Auto-fill from Institution + Payment Method

**Current state:** The membership form (`memeberships/form.tsx`) has a "New Doctor" card + "Existing Doctor" search. When adding a membership, branch, membership type, and dates are all manually selected. No payment method is collected at create time.

**Files to modify:**

| File | Lines | Action |
|------|-------|--------|
| `frontend/src/pages/memeberships/form.tsx` | 599-648 | **Remove** the "New Doctor" / "UserCreate" card (lines 621-640). Keep only the `UserSearchModal` for selecting existing doctors. |
| `frontend/src/pages/memeberships/form.tsx` | 211-221 | **After `handleDoctorSelect`**: When a doctor is selected, if the doctor has `branches`, auto-populate `branch_id` from the doctor's primary branch. If the doctor has `institutions`, fetch institution data to determine allowed membership types and auto-populate. |
| `frontend/src/pages/memeberships/form.tsx` | 54-62 | **Update `DoctorsMembershipFormData` interface**: Add `payment_method: 'cash' \| 'bank_transfer'`, `invoice_file: File \| null`, `reference_number: string`. |
| `frontend/src/pages/memeberships/form.tsx` | 811-818 | **After the hidden status select**, add a new section for payment method: a `<Select>` with "Cash" and "Bank Transfer" options. When "Bank Transfer" is selected, show a file upload field for PDF invoice. |
| `frontend/src/pages/memeberships/form.tsx` | 283-335 | **Update `handleSubmit`**: When creating, send `payment_method`, `invoice_file` (as FormData if file present), and `reference_number` along with membership data. |
| `backend/niqabaty/serializers/doctors_membership.py` | — | Add `payment_method`, `invoice_file` fields to serializer. On create, auto-create a Payment record if method is provided. |
| `backend/niqabaty/models/payment.py` | — | Add `invoice_file = models.FileField(upload_to='payment_invoices/', null=True, blank=True)`. Run migration. |
| `backend/niqabaty/views/doctors_membership_viewset.py` | — | Override `perform_create` to handle payment_method + invoice_file + reference_number from request data, creating an auto payment record. |

---

## Task 3: Doctors, Students, Institutions — Add Filters & Improve List UI

**Current state:** Doctors list (`doctors/index.tsx`, 504 lines) has only search + pagination. Students (493 lines) same. Institutions (355 lines) same. The "rest of the system" pattern (see `users/index.tsx`, `library/index.tsx`) uses richer filter bars with status/role selects, apply buttons, etc.

**Files to modify:**

| File | Lines | Action |
|------|-------|--------|
| `frontend/src/pages/doctors/index.tsx` | 1-504 | **Add filter bar** before the cards list: Add `Select` for branch filter, gender filter, membership status filter, and specialty filter. Follow the `users/index.tsx` pattern with `pendingX` state + Apply button. Add "Clear Filters" button. |
| `frontend/src/pages/doctors/index.tsx` | — | **Improve card UI**: Show profile image, full name, doctor number, specialty, branch, institution, email, phone, membership status badge, action buttons. Follow `library/index.tsx` card style. |
| `frontend/src/pages/students/index.tsx` | 1-493 | Same filter bar + UI improvements. Add filters: branch, university, graduation year range, gender. |
| `frontend/src/pages/institutions/index.tsx` | 1-355 | Same filter bar + UI improvements. Add filters: branch, city, active/inactive status. |
| `backend/niqabaty/views/user_viewset.py` | — | Ensure the backend supports filtering by `branch_id`, `institution_id`, `gender`, `membership_status`, `specialty`, `university_name`, `graduation_year` in the `UserViewSet` queryset. |

---

## Task 4: Certifications — Fix Upload + "Issued From" Glitch

**Current state:** In `certifications/form.tsx`:
- "Issued From" input glitches: user cannot type more than one letter
- Cannot view previously uploaded certification documents
- Upload takes a very long time, no progress indicator

**Root Cause Analysis:**

**Issue 1 (Issued From glitch):** At line 539, `onValueChange={(val) => handleInputChange("issued_from", val)}`. At line 537, `value={formData.issued_from || ""}` — the `|| ""` fallback can cause re-render issues if the value is an empty string. Also check that `CertificationCreateInput` has `issued_from` typed as `string` not optional.

**Issue 2 (Cannot see uploaded document):** At line 99-101, existing document URL is set from `certification.document`. At line 562, the link `href={existingDocumentUrl}` — the URL may be relative (just `/media/...`) and not resolved to full URL.

**Issue 3 (Slow upload):** At line 228-231, formData is sent as raw JSON with File object embedded — the API needs `multipart/form-data` with proper FormData handling.

**Files to modify:**

| File | Lines | Action |
|------|-------|--------|
| `frontend/src/pages/certifications/form.tsx` | 537 | Change `value={formData.issued_from \|\| ""}` to `value={formData.issued_form}` — ensure no empty-string fallback causes re-render loops |
| `frontend/src/pages/certifications/form.tsx` | 55 | Ensure `issued_from` is typed as `string` not `string \| undefined` in `CertificationCreateInput` |
| `frontend/src/pages/certifications/form.tsx` | 228-231 | Change `certificationsApi.create(formData)` to use FormData: create a `FormData`, append all fields, append `document` as file if present |
| `frontend/src/pages/certifications/form.tsx` | 562 | Fix `href={existingDocumentUrl}` to use full URL: `href={\`${apiClient.defaults.baseURL?.replace('/api/', '')}${existingDocumentUrl}\`}` |
| `frontend/src/pages/certifications/form.tsx` | 614-619 | Add upload progress indication with a loading spinner or progress bar during file upload |
| `frontend/src/api/certificationsApi.ts` | — | Ensure `create`/`update` methods support `multipart/form-data` (extend from `FileUploadApiClient` if not already) |

---

## Task 5: Payments Page — Add Filters + Fix PDF Invoice Download

**Current state:** Payments list (`payments/index.tsx`) uses basic search + pagination. PDF invoices link to API URLs instead of downloading (takes user to raw API response page).

**Files to modify:**

| File | Lines | Action |
|------|-------|--------|
| `frontend/src/pages/payments/index.tsx` | — | **Add filter bar**: Add `Select` for payment method (cash/card/bank_transfer/online), date range (from/to), amount range (min/max), user search filter, membership filter. Follow `library/index.tsx` advanced filter pattern. |
| `frontend/src/pages/payments/index.tsx` | — | **Fix PDF download**: Where invoice links are rendered, change from `<a href={url}>` to a button that fetches the file as a blob and triggers a download via `URL.createObjectURL` + `<a download>`. Or proxy through an API endpoint that sets `Content-Disposition: attachment`. |
| `frontend/src/api/paymentsApi.ts` | — | Add `downloadInvoice(paymentId)` method that fetches as blob with `responseType: 'blob'` |
| `backend/niqabaty/views/payment_viewset.py` | — | Add `download_invoice` action that returns file with proper `Content-Disposition` header |
| `backend/niqabaty/serializers/payment.py` | — | Ensure `invoice_file` URL is serialized as full absolute URL (use `context={'request': request}` in serializer) |

---

## Task 6: Medical Reports — Fix PDF Download

**Current state:** "Failed to export PDF. Please try again." error. The backend uses `pdfkit` (wkhtmltopdf) for PDF generation.

**Root Cause Analysis:** Check `backend/niqabaty/views/medical_report_viewset.py` — the `export_pdf` action likely fails due to:
1. `WKHTMLTOPDF_BIN` not configured on server
2. Template `medical_report_pdf.html` has issues
3. File path/permissions issues

**Files to modify:**

| File | Lines | Action |
|------|-------|--------|
| `backend/niqabaty/views/medical_report_viewset.py` | — | **Read the `export_pdf` action** — add try/except with detailed error logging. Ensure wkhtmltopdf binary path is resolved correctly. Add fallback error message that includes the actual error for debugging. |
| `backend/niqabaty/templates/medical_report_pdf.html` | — | Verify template syntax is valid HTML. Ensure all CSS is inline (wkhtmltopdf doesn't support external CSS well). Add Arabic font support via `@font-face` or system fonts. |
| `backend/backend/settings.py` | 154-155 | Verify `WKHTMLTOPDF_BIN` and `PDF_FONT_DIR` are set. Add default: `WKHTMLTOPDF_BIN = os.getenv('WKHTMLTOPDF_BIN', '/usr/local/bin/wkhtmltopdf')` |
| `backend/backend/urls.py` | — | Add explicit route for PDF download with `name='medical-report-pdf'` |
| `frontend/src/pages/medical-reports/index.tsx` | — | Change download button to use `window.open(url, '_blank')` or download as blob. Ensure it calls the correct API endpoint with proper params. |

---

## Task 7: Notifications — Separate System vs Manual + Filters

**Current state:** The notifications page shows aggregated notifications from `notificationsApi.getAggregated()`. No distinction between system-sent (auto from posts/events/payments) vs manually sent (via send/bulk pages).

The user wants separation "just like the library" — the library page uses `Tabs` (All / PDF / Video / Link) for filtering by type.

**Files to modify:**

| File | Lines | Action |
|------|-------|--------|
| `frontend/src/models/notifications.ts` | — | Add `source: 'system' \| 'manual'` field to `AggregatedNotification`. Add `source` to API filters. |
| `backend/niqabaty/models/notification.py` | 73-83 | Add `source = models.CharField(max_length=20, choices=[('system', 'System'), ('manual', 'Manual')], default='manual')` to `Notification` model. Migrate. |
| `backend/niqabaty/views/notification_viewset.py` | — | In `send_notification()` utility: set `source='system'` when called from auto-notify (post publish, event publish, payment actions). Set `source='manual'` when called from send_single/send_bulk endpoints. In the `aggregated` action: add `source` filter. |
| `backend/niqabaty/utils/notifications.py` | — | Add `source` parameter to `send_notification()` function: `send_notification(..., source='manual')` |
| `frontend/src/pages/notifications/index.tsx` | — | **Add Tabs** at top (like library): "All" / "System" / "Manual". Use `Tabs` component. Add `source` param to API calls. |
| `frontend/src/pages/notifications/index.tsx` | — | **Add advanced filters**: Date range, notification type (info/warning/error/success), target type (all devices / specific users). Add "Clear Filters" button. |

---

## Task 8: Posts/News — Add "View" Button

**Current state:** The posts list (`posts/index.tsx`) has a dropdown with edit/publish/archive/feature/delete/send-notification. No "view" button to see the published post.

**Files to modify:**

| File | Lines | Action |
|------|-------|--------|
| `frontend/src/pages/posts/index.tsx` | — | In the dropdown menu items list, add a "View" item with `FiEye` icon. `onPress: () => window.open(\`/posts/${post.id}?view=true\`, '_blank')` |
| `frontend/src/pages/posts/form.tsx` | — | When `?view=true` is in query params, render the form as read-only with all fields disabled and no submit button. |
| `frontend/src/App.tsx` | 409-411 | Add a new route: `<Route element={<PostFormPage />} path="/posts/:id" />` (the same form page handles view mode via query param) |

---

## Task 9: Complaints — Add "Sent To" Branch + Visibility

**Current state:** `complaints/form.tsx` has subject, category, priority, description, attachment fields. No "sent to" field to specify which branch receives the complaint.

**Files to modify:**

| File | Lines | Action |
|------|-------|--------|
| `frontend/src/pages/complaints/form.tsx` | — | Add a `<Select>` for `branch_id` (labeled "Sent To"). Populate from `branchesApi.getAll()`. Show both parent and sub-branches (use branch tree). Add `branch_id` to form data. |
| `backend/niqabaty/models/complaint.py` | — | Add `branch = models.ForeignKey('niqabaty.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='complaints')`. Migrate. |
| `backend/niqabaty/serializers/complaint.py` | — | Add `branch_id` (write) and `branch` (read, nested) to serializer. |
| `frontend/src/pages/complaints/index.tsx` | — | Add "Sent To" column in the table showing the branch name. Show it in mobile card view too. |
| `frontend/src/pages/complaints/form.tsx` | — | When the user opens a complaint detail (edit mode), show the "Sent To" branch as read-only if not staff. Staff can see it in the admin response section too. |
| `backend/niqabaty/views/complaint_viewset.py` | — | Filter complaints by branch for branch managers (only show complaints sent to their branch). |

---

## Task 10: Two New Account Types — Viewer & Advertiser

**Current state:** User model has `USER_TYPE_CHOICES = [doctor, student, manager, institution]` (user.py line 36-41). Permission system uses Django groups + model permissions. Staff users have full access.

**Files to modify:**

| File | Lines | Action |
|------|-------|--------|
| `backend/niqabaty/models/user.py` | 36-41 | Add to `USER_TYPE_CHOICES`: `('viewer', 'Viewer'), ('advertiser', 'Advertiser')` |
| `backend/niqabaty/management/commands/setup_permissions.py` | — | Create Django groups: "Viewers" (all VIEW permissions only, no ADD/CHANGE/DELETE), "Advertisers" (custom `view_ad`, `add_ad`, `change_ad`, `delete_ad` permissions). |
| `backend/niqabaty/views/user_viewset.py` | — | In user creation/update, auto-assign viewer/advertiser to appropriate groups on user_type change. |
| `frontend/src/pages/doctors/form.tsx` | — | Add "Viewer" and "Advertiser" options to the user type select (if present in form). |
| `frontend/src/pages/users/form.tsx` | — | Same — add user_type options for viewer/advertiser. |
| `frontend/src/hooks/useFieldPermission.ts` | 27, 73, 90, 107 | Ensure `isAdmin` check excludes viewer and advertiser — current logic `user.is_staff \|\| user.user_type === 'institution'` already correct, verify no changes needed. |
| `frontend/src/components/sidebar.tsx` | 70-78 | Ensure sidebar filter doesn't grant admin access to viewer/advertiser user types. |

---

## Task 11: Services Section — Insurance & Ads "Coming Soon" Pages

**Current state:** The "Services" nav section has certifications, payments, professional development, library, medical reports. No insurance link, no ads link.

**Files to modify:**

| File | Lines | Action |
|------|-------|--------|
| `frontend/src/config/site.ts` | 44-96 | Add two new items to the "Services" section:<br>`{ labelKey: "nav.insurance", href: "/insurance", icon: "FiShield" },`<br>`{ labelKey: "nav.ads", href: "/ads", icon: "FiMonitor" },` |
| `frontend/src/pages/` | — | Create `ads/ComingSoon.tsx` — a styled "Coming Soon" page with a message, icon, and "Go Back" button. |
| `frontend/src/pages/` | — | Create `insurance/ComingSoon.tsx` or update the existing `/insurance` route to show "Coming Soon" until the ads feature is ready. |
| `frontend/src/App.tsx` | 427 | Update existing insurance route + add ads route: `<Route element={<InsurancePage />} path="/insurance" />`, `<Route element={<AdsComingSoonPage />} path="/ads" />` |
| `frontend/src/i18n/locales/ar/common.ts` | — | Add translations: `ads: "الإعلانات"`, `comingSoon: "قريباً"`, `comingSoonDesc: "هذه الميزة قيد التطوير حالياً"` |
| `frontend/src/i18n/locales/en/common.ts` | — | Same for English: `ads: "Ads"`, `comingSoon: "Coming Soon"`, `comingSoonDesc: "This feature is currently under development"` |

---

## Task 12: Sidebar Glitch — Spacing Issues

**Current state:** The sidebar (`sidebar.tsx`) is positioned fixed. Sometimes it creates visible gaps from top, side, and bottom.

**Root Cause:** The spacing issues (top, side, bottom gaps) are likely due to:
1. The `pt-2 px-6` on the flex container (ProtectedView.tsx line 68) creates a 0.5rem top gap and 1.5rem side gap.
2. The sidebar itself has `py-6` (sidebar.tsx line 164) which adds internal padding.
3. Transition timing can cause the sidebar to be mispositioned during animation.

**Files to modify:**

| File | Lines | Action |
|------|-------|--------|
| `frontend/src/components/ProtectedView.tsx` | 68 | Change `pt-2 px-6` to `p-0` — remove the padding gap that creates spacing around the sidebar. |
| `frontend/src/components/ProtectedView.tsx` | 70-71 | Verify sidebar positioning: `fixed top-16 sm:top-24` should match the navbar height exactly. Ensure navbar is `h-16` / `sm:h-24`. If mismatched, adjust. |
| `frontend/src/components/ProtectedView.tsx` | 83-84 | The `transition-all duration-300` should include padding changes. Ensure the main content area padding calc is correct: `md:pl-64` (expanded) vs `md:pl-20` (collapsed). |
| `frontend/src/components/sidebar.tsx` | 164 | Remove `py-6` to eliminate internal vertical padding that creates top/bottom gaps. Change to `py-0`. |
| `frontend/src/components/sidebar.tsx` | 188 | Reduce `space-y-4` between nav sections if vertical spacing is too large. |

---

## Task 13: Sort By — Add to All Pages

**Current state:** No page (except the heatmap city list) has a sort-by control. The backend supports `OrderingFilter` on some ViewSets but not consistently.

**Backend files to modify:**

| File | Action |
|------|--------|
| `backend/niqabaty/views/user_viewset.py` | Add `OrderingFilter` to `filter_backends`. Add `ordering_fields = ['created_at', 'full_name', 'email', 'user_type', 'gender', 'graduation_year']` |
| `backend/niqabaty/views/doctors_membership_viewset.py` | Add `ordering_fields = ['start_date', 'end_date', 'total_amount', 'status', 'created_at']` |
| `backend/niqabaty/views/payment_viewset.py` | Add `ordering_fields = ['amount', 'payment_date', 'payment_method', 'created_at']` |
| `backend/niqabaty/views/certification_viewset.py` | Add `ordering_fields = ['issue_date', 'expiry_date', 'created_at']` |
| `backend/niqabaty/views/post_viewset.py` | Add `ordering_fields = ['published_at', 'created_at', 'views_count', 'title']` |
| `backend/niqabaty/views/complaint_viewset.py` | Add `ordering_fields = ['created_at', 'status', 'priority']` |
| `backend/niqabaty/views/notification_viewset.py` | Add `ordering_fields` to `aggregated` action query |
| `backend/niqabaty/views/institution_viewset.py` | Add `ordering_fields = ['name', 'created_at']` |

**Frontend files to modify:**

| File | Action |
|------|--------|
| All `index.tsx` pages | Add a `<Select>` or `<Dropdown>` for sort-by near the search bar. Apply `ordering` param to API calls. Standard pattern: options like "Date (Newest)", "Date (Oldest)", "Name (A-Z)", etc. |
| `frontend/src/pages/users/index.tsx` | Add sort-by dropdown next to existing filters |
| `frontend/src/pages/doctors/index.tsx` | Add sort-by dropdown |
| `frontend/src/pages/students/index.tsx` | Add sort-by dropdown |
| `frontend/src/pages/institutions/index.tsx` | Add sort-by dropdown |
| `frontend/src/pages/memeberships/index.tsx` | Add sort-by dropdown |
| `frontend/src/pages/payments/index.tsx` | Add sort-by dropdown |
| `frontend/src/pages/certifications/index.tsx` | Add sort-by dropdown |
| `frontend/src/pages/complaints/index.tsx` | Add sort-by dropdown |
| `frontend/src/pages/notifications/index.tsx` | Add sort-by dropdown |

---

## Task 14: Advertiser System Page

**Current state:** No advertiser functionality exists. This is a new feature.

**Scope:** An advertiser user type can create ads (like posts but targeted), select audience by branches/cities/specialties, see expected audience count, and track who viewed the ad.

**New files to create (Backend):**

| File | Purpose |
|------|---------|
| `backend/niqabaty/models/ad.py` | `Ad` model: advertiser (FK User), title, content, featured_image, target_branches (M2M), target_cities (M2M), target_specialties (M2M), expected_audience_count, status (draft/published/archived), published_at, views_count |
| `backend/niqabaty/models/ad_view.py` | `AdView` model: ad (FK), user (FK), viewed_at — tracks who saw each ad |
| `backend/niqabaty/serializers/ad.py` | `AdSerializer` — all fields + `advertiser` read-only nested |
| `backend/niqabaty/views/ad_viewset.py` | `AdViewSet` with CRUD + `publish`, `unpublish`, `archive`, `calculate_audience` (takes filter params, returns expected count + breakdown), `stats` (returns views breakdown + who viewed) |

**New files to create (Frontend):**

| File | Purpose |
|------|---------|
| `frontend/src/models/ad.ts` | TypeScript interfaces for Ad, AdView, AdCreateInput, AdFilters |
| `frontend/src/api/adsApi.ts` | `AdsApiClient` extending `FileUploadApiClient` |
| `frontend/src/pages/ads/index.tsx` | Ads list page — table with columns: title, advertiser, status, expected audience, actual views, published date, actions |
| `frontend/src/pages/ads/form.tsx` | Ad create/edit form. Step 1: title, content, image, status. Step 2: Audience targeting — multi-select branches, cities, specialties. Step 3: Preview expected audience count + submit |
| `frontend/src/pages/ads/detail.tsx` | Ad detail page showing content + audience stats + who viewed it |

**Existing files to modify:**

| File | Lines | Action |
|------|-------|--------|
| `backend/backend/urls.py` | — | Add `router.register(r'ads', AdViewSet)` |
| `backend/niqabaty/models/__init__.py` | — | Import `Ad`, `AdView` |
| `frontend/src/App.tsx` | — | Add routes: `/ads`, `/ads/add`, `/ads/:id`, `/ads/:id/edit` |
| `frontend/src/config/site.ts` | 44-96 | Add ads to services section: `{ labelKey: "nav.ads", href: "/ads", icon: "FiMonitor", permission: PERMISSIONS.AD.VIEW }` |
| `frontend/src/types/permissions.ts` | — | Add `AD: { VIEW: 'niqabaty.view_ad', ADD: 'niqabaty.add_ad', CHANGE: 'niqabaty.change_ad', DELETE: 'niqabaty.delete_ad' }` |
| `backend/niqabaty/management/commands/setup_permissions.py` | — | Add `ad \| ad \| Can view ad`, etc. to permissions |

**Audience calculation logic (backend):**
| File | Action |
|------|--------|
| `backend/niqabaty/views/ad_viewset.py` | `calculate_audience` action: takes `branch_ids`, `city_ids`, `specialty_ids` from query params. Queries `User.objects.filter(user_type='doctor', branches__id__in=branch_ids, city_id__in=city_ids, specialty__in=specialty_ids)`. Returns `{ count: N, breakdown: { by_branch: [...], by_city: [...] } }` |

---

## Task 15: Restructure Main Branches

**Current state:** Branches are in the database but there's no hardcoded list of the 3 main syndicates. The user wants:
- Keep only: "نقابة الطب البشري العامة", "نقابة الأسنان العامة", "نقابة الصيادلة العامة"
- Delete all other main branches
- Add sub-branches under these 3
- Migrate users assigned to deleted branches to the new structure

**New file:**

| File | Action |
|------|--------|
| `backend/niqabaty/management/commands/restructure_branches.py` | **New management command**: (1) Find or create the 3 main branches with the exact Arabic names. (2) Find all existing branches that are NOT children of those 3. (3) For each found branch, determine which main branch to reparent it under (by user count, name similarity, or city). (4) Reassign all users from old branches to the appropriate new branch/sub-branch. (5) Soft-delete old orphan branches. (6) Print migration summary. |

**Existing files to modify:**

| File | Action |
|------|--------|
| `backend/niqabaty/models/branch.py` | Check current constraints — max depth 2. If main branches need 3 levels (main → sub → sub-sub), update `clean()` validation. |
| `backend/niqabaty/management/commands/seed_test_data.py` | Update to use the new 3-main-branch structure in seed data generation. |
| `frontend/src/pages/branches/form.tsx` | Update parent branch selection to only show the 3 main branches or their sub-branches as valid parents. |
| `frontend/src/pages/branches/BranchModal.tsx` | Same — filter parent options to show only the 3 main branches as top-level selectable parents. |

**Migration steps:**
1. Create the management command
2. Run it on a staging copy first to verify
3. Run on production with database backup beforehand
4. Verify all foreign keys resolve correctly

---

## Task 16: Cut Seed Data to 30k max

**Current state:** `seed_test_data.py` (489 lines) generates ~120k records. Need to reduce to 30k max.

**File to modify:**

| File | Lines | Action |
|------|-------|--------|
| `backend/niqabaty/management/commands/seed_test_data.py` | — | **Reduce all batch counts**: Identify every loop/range/batch that creates records. Find the main multipliers: number of users per batch, memberships per user, payments per membership, certifications per user. Reduce each multiplier proportionally. Add a `MAX_TOTAL_RECORDS = 30000` constant and track running count, stop when exceeded. |
| `backend/niqabaty/management/commands/seed_test_data.py` | — | Add progress logging: print "Created X/Y records" every 1000 records for visibility. |
| `backend/niqabaty/management/commands/seed_test_data.py` | — | Add `--max-records` CLI argument (`parser.add_argument('--max-records', type=int, default=30000)`) to allow overriding the limit from command line. |

---

## Task 17: Consistency — UI, Structure & Architecture

This is a cross-cutting cleanup task. The system has several inconsistencies to address.

**Identified inconsistencies:**

| Issue | Location | Fix |
|-------|----------|-----|
| Typo: `memeberships` directory | `frontend/src/pages/memeberships/` | Rename to `memberships`. Update all imports in `App.tsx` (lines 11-13) and all other references. |
| Typo: `memeberships.tsx` | `frontend/src/pages/memeberships.tsx` | Rename or rehome to `memberships.tsx` |
| Empty files | `components/I18nProvider.tsx`, `components/LanguageSwitcher.tsx` | Delete — dead code |
| Dead layout | `layouts/default.tsx` (bare passthrough) | Remove — all pages use `ProtectedView` or auth/member layouts directly |
| Stub/dead pages | `pages/items.tsx`, `pages/item-types.tsx`, `pages/index.tsx` | Remove if unused (check for imports first) |
| Example code in production | `pages/users/examples.tsx`, `pages/users/README.md` | Remove from page directory |
| Inconsistent layout imports | Various pages import `DefaultLayout` but it's a dead passthrough | Search all pages for `import DefaultLayout` — remove these imports since `ProtectedView` wraps via `<Outlet />` |
| Empty `.env` setup | No `VITE_API_URL`, no `.env.example` | Create `frontend/.env.example` with `VITE_API_URL=http://localhost:8000/api` and documentation |
| Background artifact files | Mobile `analysis_output.txt`, `analysis.txt`, `firepit-log.txt` | Remove from repo, add to `.gitignore` if not already |
| Missing favicon setup | `frontend/index.html` | Verify favicon path works properly |

**Systematic cleanup pass:**

1. `rg "import DefaultLayout"` across `frontend/src/pages/` — every occurrence should be removed
2. `rg "memeberships"` — fix all typos to `memberships`
3. `rg "I18nProvider\|LanguageSwitcher"` — clean up empty components
4. `rg "items\.tsx\|item-types\.tsx"` — verify no imports, then remove
5. `rg "examples\.tsx\|README\.md"` inside pages/ — remove from page directories
6. Create `frontend/.env.example` with documentation
7. Create `backend/.env.example` with all required env vars documented

---

## Execution Order

```
Phase 1 (Quick wins, independent):
  Task 12 → Sidebar glitch fix
  Task 4  → Certification fixes (upload + issued from)
  Task 17 → Consistency cleanup (typos, dead code)

Phase 2 (Structural, independent):
  Task 1  → Heatmap icon + permission
  Task 10 → Viewer & advertiser account types
  Task 11 → Services: Insurance + Ads coming soon
  Task 15 → Branch restructure (management command)
  Task 16 → Seed data reduction

Phase 3 (Feature updates, somewhat dependent):
  Task 2  → Membership form (auto-fill + payment method)
  Task 3  → Doctors/students/institutions filters + UI
  Task 5  → Payments filters + PDF download fix
  Task 7  → Notifications separation + filters
  Task 9  → Complaints "sent to" branch

Phase 4 (New features, dependent on Phase 2):
  Task 14 → Advertiser system page (depends on Task 10)

Phase 5 (Cross-cutting):
  Task 13 → Sort-by on all pages
  Task 6  → Medical reports PDF download fix
  Task 8  → Posts view button
```
