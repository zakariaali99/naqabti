from rest_framework import viewsets, filters
from niqabaty.models import CertificationType
from niqabaty.serializers import CertificationTypeSerializer

class CertificationTypeViewSet(viewsets.ModelViewSet):
    queryset = CertificationType.objects.all()
    serializer_class = CertificationTypeSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
