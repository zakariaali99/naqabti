from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from niqabaty.models import Certification
from niqabaty.serializers import CertificationSerializer

class CertificationViewSet(viewsets.ModelViewSet):
    queryset = Certification.objects.all()
    serializer_class = CertificationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['issue_date', 'expiry_date', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()
        
        if getattr(user, 'user_type', '') in ['doctor', 'student']:
            queryset = queryset.filter(doctor=user)
        else:
            doctor_id = self.request.query_params.get('doctor_id')
            if doctor_id:
                queryset = queryset.filter(doctor_id=doctor_id)
                
        certification_type = self.request.query_params.get('certification_type')
        if certification_type:
            queryset = queryset.filter(certification_type_id=certification_type)
            
        return queryset
