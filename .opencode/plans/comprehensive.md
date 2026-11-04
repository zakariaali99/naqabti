# Comprehensive Plan: User Permissions, Specialties, Library Filters

## Overview
Four interconnected workstreams:
1. **User form & permissions** — Enhance the Settings > Users form to manage branch manager, staff, and permission group assignment; remove superadmin concept; ensure active-by-default
2. **Specialty model** — Create a CRUD-managed doctor specialty resource replacing the free-text field
3. **Registration form** — Use the new specialty lookup table (Select from API, not free text)
4. **Library filters** — Advanced filters (category, author, year, date, sort, branch) + specialty filter

---

## Phase 1: User Form & Permissions

### 1.1 Backend — Remove `is_superuser` from serializer & viewset

**Rationale:** The `is_superuser` toggle is removed from the UI. The field stays at the model level for Django internals (admin site, auth), but is not exposed or assignable through the API.

**Changes:**
- `serializers/user.py`: Remove `is_superuser` from `UserSerializer.Meta.fields` and `read_only_fields`
- `views/user_viewset.py`: Remove the `is_superuser` query param filter from `get_queryset()`
- `views/user_viewset.py`: In `toggle_active`, remove the "Cannot toggle superuser" guard

**Files affected:**
- `backend/niqabaty/serializers/user.py`
- `backend/niqabaty/views/user_viewset.py`

### 1.2 Backend — Add `is_staff` to serializer

**Rationale:** `is_staff` controls access to Django admin and serves as the "staff" flag. Currently in the model but not exposed in the serializer.

**Changes:**
- `serializers/user.py`: Ensure `is_staff` is in `UserSerializer.Meta.fields`

**Files affected:**
- `backend/niqabaty/serializers/user.py`

### 1.3 Backend — Allow user form to assign Branch Manager

**Rationale:** Currently, setting a user as branch manager requires going to the Branch form. Add the ability in the user create/edit form to assign which branches this user manages (sets `Branch.manager` FK).

**Changes:**
- `serializers/user.py`: Add `managed_branch_ids` field (PrimaryKeyRelatedField, write-only, queryset=Branch.objects.all(), many=True)
- `serializers/user.py`: In `create()` and `update()`, after saving the user, update `Branch.objects.filter(id__in=managed_branch_ids).update(manager=user)`. For removed branch IDs, set `manager=None` on those branches.
- `views/user_viewset.py`: Allow non-superuser staff (institution type) to create users. Change to allow institution users to create/edit users in their branch scope, but not assign managed_branch_ids outside their scope.

**Files affected:**
- `backend/niqabaty/serializers/user.py`
- `backend/niqabaty/views/user_viewset.py`

### 1.4 Backend — Relax user creation for institution users

**Rationale:** Currently `create()` and `update()` return 403 for all non-superusers. Change so institution users can create/edit users within their branch scope.

**Changes:**
- `views/user_viewset.py`: In `create()` and `update()`, instead of blanket 403 for non-superusers, allow institution user_type to create users scoped to their branches.
- Validate that the created user's `branch_ids` are within the creator's allowed branches.

**Files affected:**
- `backend/niqabaty/views/user_viewset.py`

### 1.5 Backend — Ensure active by default

**Rationale:** Form already defaults `is_active = True`. Backend `create()` should enforce this.

**Changes:**
- `views/user_viewset.py`: In `create()`, set `is_active=True` on the serializer if not provided.

**Files affected:**
- `backend/niqabaty/views/user_viewset.py`

### 1.6 Frontend — Update user form (`users/form.tsx`)

**Changes:**
1. **Remove `is_superuser`** — Delete the Switch for `is_superuser` (lines 1194-1201)
2. **Add `is_staff` Switch** — Add a Switch for staff status
3. **Add "Managed Branches" section** — New section in the permissions area with a "Select Managed Branches" button that opens the BranchModal (in "multiple" mode). Shows chips for selected managed branches. Submits as `managed_branch_ids`.
4. **Add managed_branch_ids to form state** — New state variable `selectedManagedBranches`
5. **Add `managed_branch_ids` to submit data** — Include in the API payload
6. **Fetch managed branches on edit** — When loading a user for editing, fetch the branches they manage (`Branch.objects.filter(manager=user)`) and pre-select them

**Files affected:**
- `frontend/src/pages/users/form.tsx`

### 1.7 Frontend — Update user model (`models/users.ts`)

**Changes:**
- `UserEntity`: Add `is_staff: boolean`, `managed_branch_ids?: number[]`
- `UserCreateInput`: Add `is_staff?: boolean`, `managed_branch_ids?: number[]`
- `UserUpdateInput`: Inherits above

**Files affected:**
- `frontend/src/models/users.ts`

### 1.8 Frontend — Update user list page (`users/index.tsx`)

**Changes:**
- Show "Staff" badge instead of the old superuser indicator
- Show "Branch Manager" badge for users who manage at least one branch

**Files affected:**
- `frontend/src/pages/users/index.tsx`

### 1.9 Frontend — Update user detail page (`users/detail.tsx`)

**Changes:**
- Show `is_staff` status
- Show managed branches list
- Remove superuser display

**Files affected:**
- `frontend/src/pages/users/detail.tsx`

---

## Phase 2: Doctor Specialty Model & CRUD

### 2.1 Backend — Create `DoctorSpecialty` model

```python
class DoctorSpecialty(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Doctor Specialty'
        verbose_name_plural = 'Doctor Specialties'
        ordering = ['name']

    def __str__(self):
        return self.name
```

**Files affected:**
- `backend/niqabaty/models/doctor_specialty.py` (new)
- `backend/niqabaty/models/__init__.py` — add import

### 2.2 Backend — Create migration

- `python manage.py makemigrations niqabaty`

### 2.3 Backend — Create serializer

```python
class DoctorSpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSpecialty
        fields = ['id', 'name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
```

**Files affected:**
- `backend/niqabaty/serializers/doctor_specialty.py` (new)
- `backend/niqabaty/serializers/__init__.py` — add export

### 2.4 Backend — Create viewset

```python
class DoctorSpecialtyViewSet(viewsets.ModelViewSet):
    queryset = DoctorSpecialty.objects.all()
    serializer_class = DoctorSpecialtySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
```

**Files affected:**
- `backend/niqabaty/views/doctor_specialty_viewset.py` (new)
- `backend/niqabaty/views/__init__.py`
- `backend/backend/urls.py` — add `router.register(r'doctor-specialties', DoctorSpecialtyViewSet)`

### 2.5 User specialty — Keep CharField, load from API

**Approach:** Don't change the User model schema. Keep `specialty` as a CharField. In all forms, load options from the `DoctorSpecialty` API and let the user select, then submit the selected name as the string value. The backend stores the string as before.

This avoids a schema migration on the large User model (which has history tracking). The data will naturally normalize as users select from predefined options.

### 2.6 Frontend — Create specialty management pages

Following the existing pattern (like Academic Degrees — modal-based):

**Model** (`models/doctorSpecialty.ts`):
```typescript
export interface DoctorSpecialty {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface DoctorSpecialtyInput {
  name: string;
  is_active?: boolean;
}
```

**API** (`api/doctorSpecialtyApi.ts`):
```typescript
class DoctorSpecialtyApi extends BaseApiClient<DoctorSpecialty, DoctorSpecialtyInput, DoctorSpecialtyInput> {
  constructor() { super("doctor-specialties/"); }
}
export default new DoctorSpecialtyApi();
```

**List page** (`pages/doctor-specialties/index.tsx`):
- Table: Name, Status, Actions
- Add/Edit modal form (following Nationalities pattern — modal, not full page)
- Search by name

**Files affected:**
- `frontend/src/models/doctorSpecialty.ts` (new)
- `frontend/src/api/doctorSpecialtyApi.ts` (new)
- `frontend/src/pages/doctor-specialties/index.tsx` (new)
- `frontend/src/pages/doctor-specialties/DoctorSpecialtyModal.tsx` (new)

### 2.7 Frontend — Add route & sidebar entry

**App.tsx:**
```tsx
<Route path="/doctor-specialties" element={<PermissionGuard permission={PERMISSIONS.ACADEMIC_DEGREE.VIEW}><DoctorSpecialtiesPage /></PermissionGuard>} />
```

**site.ts** — Add to Settings > System submenu:
```ts
{
  labelKey: "nav.doctorSpecialties",
  href: "/doctor-specialties",
  icon: "FiStar",
  permission: PERMISSIONS.ACADEMIC_DEGREE.VIEW,
}
```

**i18n** — Add translations for nav entry, page title, table headers, form labels.

**Files affected:**
- `frontend/src/App.tsx`
- `frontend/src/config/site.ts`
- `frontend/src/i18n/locales/en/settings.ts`
- `frontend/src/i18n/locales/ar/settings.ts`

### 2.8 Frontend — Update registration form (EducationInfoStep.tsx)

**Changes:**
- Replace the free-text `<Input>` for specialty with a `<Select>` that loads from `/api/doctor-specialties/`
- Fetch specialties on mount: `doctorSpecialtyApi.getAll({ is_active: true })`
- Only show when `user_type === "doctor"` (already the case)

**Files affected:**
- `frontend/src/pages/auth/registration/EducationInfoStep.tsx`

### 2.9 Frontend — Update user form (`users/form.tsx`)

**Changes:**
- Replace specialty `<Input>` (lines 978-988) with `<Select>` from doctor-specialties API
- Only show when `user_type === "doctor"` (already the case)

**Files affected:**
- `frontend/src/pages/users/form.tsx`

### 2.10 Frontend — Update doctors form

Find and update all doctor creation/edit forms that use free-text specialty.

**Likely files affected:**
- `frontend/src/pages/doctors/form.tsx` (if it exists)

---

## Phase 3: Library Filters

### 3.1 Backend — Create `LibraryItemFilter` (django-filter FilterSet)

Replace `filterset_fields` with a `filterset_class`:

```python
import django_filters
from ..models.library import LibraryItem

class LibraryItemFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(lookup_expr='icontains')
    author_name = django_filters.CharFilter(lookup_expr='icontains')
    publication_year__gte = django_filters.NumberFilter(field_name='publication_year', lookup_expr='gte')
    publication_year__lte = django_filters.NumberFilter(field_name='publication_year', lookup_expr='lte')
    created_at__gte = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_at__lte = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    branch = django_filters.ModelChoiceFilter(queryset=Branch.objects.all())

    class Meta:
        model = LibraryItem
        fields = ['item_type', 'is_public']

    def filter_branch(self, queryset, name, value):
        if not self.request or not self.request.user.is_staff:
            return queryset
        return queryset.filter(branch=value)
```

**Files affected:**
- `backend/niqabaty/views/library_viewset.py`

### 3.2 Frontend — Filter state + param wiring

```typescript
interface FilterState {
  category: string;
  author_name: string;
  publication_year_from: string;
  publication_year_to: string;
  created_at_from: string;
  created_at_to: string;
  ordering: string;
  branch: string;
  specialty: string;  // from Phase 4
}
```

Wire to API call:
```typescript
const params: any = { search: searchQuery };
if (activeTab !== "all") params.item_type = activeTab;
if (filters.category) params.category = filters.category;
if (filters.author_name) params.author_name = filters.author_name;
if (filters.publication_year_from) params.publication_year__gte = filters.publication_year_from;
if (filters.publication_year_to) params.publication_year__lte = filters.publication_year_to;
if (filters.created_at_from) params.created_at__gte = filters.created_at_from;
if (filters.created_at_to) params.created_at__lte = filters.created_at_to;
if (filters.ordering) params.ordering = filters.ordering;
if (filters.branch && user?.is_staff) params.branch = filters.branch;
if (filters.specialty) params.specialty = filters.specialty;
```

### 3.3 Frontend — Filter bar UI

Always visible bar below the type tabs + search row:

```
┌─────────────────────────────────────────────────┐
│  Tabs: [All] [PDF] [Video] [Links]    [Search]  │
├─────────────────────────────────────────────────┤
│  Category [___]   Author [___]                   │
│  Year from [___] to [___]                        │
│  Date from [____] to [____]                      │
│  Specialty [Dropdown ▼]   Sort by [Dropdown ▼]  │
│  [Clear Filters]                                 │
└─────────────────────────────────────────────────┘
```

Uses HeroUI Input, Select, responsive grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3`).

### 3.4 Sort options

| Value | Label |
|-------|-------|
| `-created_at` | Newest first (default) |
| `created_at` | Oldest first |
| `title` | Title A-Z |
| `-title` | Title Z-A |
| `-download_count` | Most downloads |
| `-view_count` | Most views |

### 3.5 Branch filter (staff only)

Fetched from `/api/branches/`. Rendered only when `user?.is_staff`.

### 3.6 Clear filters button

Resets all filter state to defaults.

**Files affected:**
- `frontend/src/pages/library/index.tsx`

---

## Phase 4: Library Specialty Field & Filter

### 4.1 Backend — Add specialty FK to LibraryItem

```python
specialty = models.ForeignKey(
    'niqabaty.DoctorSpecialty',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='library_items',
)
```

**Filter addition to `LibraryItemFilter`:**
```python
specialty = django_filters.ModelChoiceFilter(queryset=DoctorSpecialty.objects.filter(is_active=True))
```

**Serializer:** Add `specialty` (FK ID, writable) and `specialty_name` (read-only source) to fields.

**Viewset:**
- `start_upload` — accept `specialty` from request data and store on session
- `finalize_upload` — pass `specialty` from session to the new LibraryItem

**Files affected:**
- `backend/niqabaty/models/library.py`
- migration (new)
- `backend/niqabaty/serializers/library.py`
- `backend/niqabaty/views/library_viewset.py`

### 4.2 Frontend — Library form update

Add specialty `<Select>` to the library create/edit form, loading from `/api/doctor-specialties/`.

**Files affected:**
- `frontend/src/pages/library/form.tsx`

### 4.3 Frontend — Library list display

Show specialty on cards and in list view.

**Files affected:**
- `frontend/src/pages/library/index.tsx`

---

## Implementation Order

1. **Phase 1** (User form & permissions) — Backend first, then frontend
2. **Phase 2** (Specialty model & CRUD) — Backend first, then frontend
3. **Phase 4** (Library specialty + form) — Depends on Phase 2 being done
4. **Phase 3** (Library filters) — Independent, can be done anytime

Recommended execution: **1 → 2 → 4 → 3**

---

## Files Summary

### New files:
- `backend/niqabaty/models/doctor_specialty.py`
- `backend/niqabaty/serializers/doctor_specialty.py`
- `backend/niqabaty/views/doctor_specialty_viewset.py`
- `frontend/src/models/doctorSpecialty.ts`
- `frontend/src/api/doctorSpecialtyApi.ts`
- `frontend/src/pages/doctor-specialties/index.tsx`
- `frontend/src/pages/doctor-specialties/DoctorSpecialtyModal.tsx`
- migrations: `DoctorSpecialty` model, `LibraryItem.specialty` FK

### Modified files (backend):
- `backend/niqabaty/models/__init__.py`
- `backend/niqabaty/models/library.py`
- `backend/niqabaty/serializers/user.py`
- `backend/niqabaty/serializers/library.py`
- `backend/niqabaty/serializers/__init__.py`
- `backend/niqabaty/views/user_viewset.py`
- `backend/niqabaty/views/library_viewset.py`
- `backend/niqabaty/views/__init__.py`
- `backend/backend/urls.py`

### Modified files (frontend):
- `frontend/src/models/users.ts`
- `frontend/src/pages/users/form.tsx`
- `frontend/src/pages/users/index.tsx`
- `frontend/src/pages/users/detail.tsx`
- `frontend/src/pages/auth/registration/EducationInfoStep.tsx`
- `frontend/src/pages/doctors/form.tsx` (likely)
- `frontend/src/pages/library/index.tsx`
- `frontend/src/pages/library/form.tsx`
- `frontend/src/App.tsx`
- `frontend/src/config/site.ts`
- `frontend/src/i18n/locales/en/settings.ts`
- `frontend/src/i18n/locales/ar/settings.ts`

---

## Open Questions

1. **Who can create users?** — Currently only superusers. Should institution-type users and/or branch managers (with `change_user` permission) be allowed to create users?

2. **Specialty FK strategy** — Keep CharField + load from API (recommended) to avoid a User model migration, or add a real FK?

3. **Library specialty field** — Dedicated FK on LibraryItem (recommended) or derived from uploader's specialty?

4. **Permission for specialties CRUD** — Use existing `ACADEMIC_DEGREE` permissions or auto-generated `DoctorSpecialty` permissions? Recommend auto-generated (view/add/change/delete_doctorspecialty).
