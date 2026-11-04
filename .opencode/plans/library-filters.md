# Plan: Library Filters

## Overview
Add advanced filters to the library list page: category search, author search, year range, date range, sort/order, and branch filter (staff only).

## Backend

### 1. Create `LibraryItemFilter` (django-filter FilterSet)

Replace `filterset_fields` with a `filterset_class` for `icontains`, range, and conditional filters:

```
import django_filters
from ..models.library import LibraryItem

class LibraryItemFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(lookup_expr='icontains')
    author_name = django_filters.CharFilter(lookup_expr='icontains')
    publication_year__gte = django_filters.NumberFilter(field_name='publication_year', lookup_expr='gte')
    publication_year__lte = django_filters.NumberFilter(field_name='publication_year', lookup_expr='lte')
    created_at__gte = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_at__lte = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    branch = django_filters.ModelChoiceFilter(queryset=Branch.objects.all())  # staff only

    class Meta:
        model = LibraryItem
        fields = ['item_type', 'is_public']

    def filter_branch(self, queryset, name, value):
        if not self.request or not self.request.user.is_staff:
            return queryset
        return queryset.filter(branch=value)
```

### 2. Update viewset

```
filterset_class = LibraryItemFilter   # replaces filterset_fields
```

### Files affected
- `backend/niqabaty/views/library_viewset.py`

## Frontend

### 1. Add filter state

```
interface FilterState {
  category: string;
  author_name: string;
  publication_year_from: string;
  publication_year_to: string;
  created_at_from: string;
  created_at_to: string;
  ordering: string;
  branch: string;  // staff only
}
```

### 2. Wire filters to API

```
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
```

### 3. Filter bar UI (always visible, below search row)

```
┌─────────────────────────────────────────────────┐
│  Tabs: [All] [PDF] [Video] [Links]    [Search]  │
├─────────────────────────────────────────────────┤
│  Category [___]   Author [___]                   │
│  Year from [___] to [___]                        │
│  Date from [____] to [____]                      │
│  Sort by [Dropdown ▼]                            │
│  [Clear Filters]                                 │
└─────────────────────────────────────────────────┘
```

Use HeroUI Input, Select, responsive grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3`).

### 4. Sort options

| Value | Label |
|-------|-------|
| `-created_at` | Newest first (default) |
| `created_at` | Oldest first |
| `title` | Title A-Z |
| `-title` | Title Z-A |
| `-download_count` | Most downloads |
| `-view_count` | Most views |

### 5. Branch filter (staff only)

Fetched from `/api/branches/`. Rendered only when `user?.is_staff`.

### 6. Clear filters button

Resets all filter state to defaults.

### Files affected
- `frontend/src/pages/library/index.tsx` — filter state, UI, param wiring

## Implementation order
1. Backend: FilterSet + viewset update
2. Frontend: Filter state + param wiring
3. Frontend: Filter bar UI
4. Frontend: Sort dropdown
5. Frontend: Staff branch filter
6. Verify everything works
