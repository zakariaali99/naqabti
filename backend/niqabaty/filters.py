import django_filters
from django.db.models import Q
from .models.library import LibraryItem


class LibraryItemFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(lookup_expr='iexact')
    author_name = django_filters.CharFilter(lookup_expr='icontains')
    publication_year = django_filters.NumberFilter()
    publication_year__gte = django_filters.NumberFilter(field_name='publication_year', lookup_expr='gte')
    publication_year__lte = django_filters.NumberFilter(field_name='publication_year', lookup_expr='lte')
    created_at__gte = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_at__lte = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    branch = django_filters.NumberFilter(field_name='branch_id')
    specialty = django_filters.NumberFilter(field_name='specialty_id')
    search = django_filters.CharFilter(method='filter_search')

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value) |
            Q(description__icontains=value) |
            Q(author_name__icontains=value)
        )

    class Meta:
        model = LibraryItem
        fields = [
            'item_type', 'category', 'is_public', 'author_name',
            'publication_year', 'branch', 'specialty',
        ]
