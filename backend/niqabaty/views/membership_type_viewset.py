from django.db.models import Q
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from niqabaty.models import MembershipType
from niqabaty.serializers import MembershipTypeSerializer

class MembershipTypeViewSet(viewsets.ModelViewSet):
    queryset = MembershipType.objects.all()
    serializer_class = MembershipTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'duration_months', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        qs = MembershipType.objects.select_related('academic_degree').all()

        # Doctors browsing their own membership options (e.g. the self-service
        # portal) always see only what applies to their own degree — they
        # can't override this via `for_degree`.
        current_user = self.request.user
        if current_user.is_authenticated and getattr(current_user, 'user_type', '') == 'doctor':
            degree_id = current_user.current_degree_id
            if degree_id:
                return qs.filter(Q(academic_degree__isnull=True) | Q(academic_degree_id=degree_id))
            return qs.filter(academic_degree__isnull=True)

        # `for_degree` limits results to types usable by a doctor with the given
        # degree: types tied to that degree plus degree-agnostic (null) types.
        # `for_degree=null` means the doctor has no degree. Used by admin/manager
        # callers (e.g. the membership form) after picking a target doctor.
        for_degree = (self.request.query_params.get('for_degree') or '').strip()
        if for_degree == 'null':
            qs = qs.filter(academic_degree__isnull=True)
        elif for_degree:
            qs = qs.filter(Q(academic_degree__isnull=True) | Q(academic_degree_id=for_degree))
        return qs