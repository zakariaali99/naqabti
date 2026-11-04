from rest_framework import viewsets, permissions, filters
from niqabaty.models import Nationality
from niqabaty.serializers import NationalitySerializer


class NationalityViewSet(viewsets.ModelViewSet):
    queryset = Nationality.objects.all()
    serializer_class = NationalitySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
