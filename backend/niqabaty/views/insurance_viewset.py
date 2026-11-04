from rest_framework import viewsets, permissions, filters
from niqabaty.models import Insurance
from niqabaty.serializers import InsuranceSerializer


class InsuranceViewSet(viewsets.ModelViewSet):
    queryset = Insurance.objects.filter(is_deleted=False)
    serializer_class = InsuranceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']
