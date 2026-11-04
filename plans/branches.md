# Branch Hierarchy & Manager Rules

## Hierarchy

Branches have **exactly two levels**:

- **Root** (level 0) — No parent.
- **Child** (level 1) — Has a parent root branch.

A child branch **cannot** have its own children. No deeper nesting is allowed.

## Enforcement (two layers)

### Model (`backend/niqabaty/models/branch.py:43`)
`Branch.clean()` checks `if self.parent.parent` on save — if the proposed parent already has a parent, a `ValidationError` is raised.

### Serializer (`backend/niqabaty/serializers/branch.py:48`)
`BranchSerializer.validate()` enforces:
1. If the assigned `parent` already has a parent → reject (2-level cap).
2. If this branch already has children → it cannot be demoted to a child branch.
3. Self-reference (`parent == self`) → reject.

## Manager Selection

### How it works
The `Branch.manager` field is a plain `ForeignKey` to `User`. There is **no role restriction** on who can be set as manager — any visible user can be selected, regardless of their `user_type`. The selection does not change the user's `user_type`.

### User pool: the `user_type` field
Every user has a `user_type` (`backend/niqabaty/models/user.py:36`) that determines their role and permissions:

| `user_type` | Label | Default privileges |
|---|---|---|
| `doctor` | Doctor | Limited self-only access. Can only see own data. |
| `student` | Student | Same as doctor. |
| `manager` | Manager | Can view/edit users in their branch scope. **This is the default** (`default='manager'` on the field). |
| `institution` | Institution | Same API privileges as manager (both are treated as `_is_branch_staff()`). Has a different form (uses company/institution name not Arabic name parts). |

### How users are created and flagged
1. **User creation form** (`frontend/src/pages/users/form.tsx:724`): Has a `user_type` `<Select>` dropdown with options: doctor, manager, student, institution.
2. The selected value is sent to the API and stored in the `user_type` CharField on the User model.
3. There is **no separate "is_manager" checkbox or boolean**. The `user_type` field is the single source of truth for role.

### Autocomplete scope
The branch form manager picker (`frontend/src/pages/branches/form.tsx:114`) calls `GET /api/users/?search=<term>`.

`UserViewSet.get_queryset()` (`backend/niqabaty/views/user_viewset.py:59`) scopes results by the current user's role:

| Current user's `user_type` | Sees in autocomplete |
|---|---|
| **Superuser** (`is_superuser=True`) | All users (no filter) |
| **Manager / Institution** | Only users belonging to branches they manage or are members of (including sub-branches) |
| **Doctor / Student** | Empty queryset (can't search users) |

### Manager privileges are separate from `Branch.manager`
The `_is_branch_staff()` helper (`user_viewset.py:13`) checks `user_type in ['manager', 'institution']`. Only users with these types get:

- Scoped `UserViewSet.get_queryset()` (can see users in their branches)
- Access to `verify_email` and `toggle_active` actions
- Permission to create/edit branch records (via `BranchViewSet`)
- `BranchViewSet.get_queryset()` returns only their managed branches

Being set as `Branch.manager` without having `user_type == 'manager'` or `'institution'` gives **no** special API access. The `Branch.manager` field is purely informational (displaying who manages the branch) and for `get_managed_branch_ids()` scoping — but even that only matters if the user also passes the `_is_branch_staff()` check.

## Key files

| File | Purpose |
|---|---|
| `backend/niqabaty/models/branch.py` | Branch model, hierarchy validation, `get_level()` |
| `backend/niqabaty/serializers/branch.py` | BranchSerializer with depth/circular-ref validation |
| `backend/niqabaty/views/branch_viewset.py` | `get_managed_branch_ids()`, CRUD permission scoping |
| `backend/niqabaty/views/user_viewset.py` | `get_queryset()`, `_allowed_branch_ids_for_user()`, `_is_branch_staff()` |
| `backend/niqabaty/models/user.py` | User model with `user_type` field and `USER_TYPE_CHOICES` |
| `frontend/src/pages/branches/form.tsx` | Branch form with Main/Child toggle, manager autocomplete |
| `frontend/src/pages/users/form.tsx` | User creation form with `user_type` selector |
