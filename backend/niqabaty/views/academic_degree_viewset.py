from rest_framework import viewsets, permissions, filters
from niqabaty.models import AcademicDegree
from niqabaty.serializers import AcademicDegreeSerializer


class AcademicDegreeViewSet(viewsets.ModelViewSet):
    queryset = AcademicDegree.objects.all()
    serializer_class = AcademicDegreeSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
