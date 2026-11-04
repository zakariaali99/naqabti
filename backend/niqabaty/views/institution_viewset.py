from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from niqabaty.models import Institution
from niqabaty.serializers import InstitutionSerializer


class InstitutionViewSet(viewsets.ModelViewSet):
    queryset = Institution.objects.filter(is_deleted=False)
    serializer_class = InstitutionSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        queryset = Institution.objects.filter(is_deleted=False)
        
        # Search filter
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search) |
                Q(address__icontains=search)
            )

        # Filter by branch (via account.branches)
        branch_ids = self.request.query_params.get('branch_ids')
        if branch_ids:
            branch_id_list = [int(bid.strip()) for bid in branch_ids.split(',') if bid.strip().isdigit()]
            if branch_id_list:
                queryset = queryset.filter(account__branches__id__in=branch_id_list)

        # Filter by city (via account.city)
        city = self.request.query_params.get('city')
        if city:
            city_list = [c.strip() for c in city.split(',') if c.strip()]
            if city_list:
                queryset = queryset.filter(account__city__name__in=city_list)

        return queryset.distinct()
