from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Q
from django.utils import timezone
from niqabaty.models.branch import Branch

from niqabaty.models import (
    User,
    DoctorsMembership,
    Certification,
    Payment,
)
from niqabaty.serializers.doctors_membership import DoctorsMembershipSerializer
from niqabaty.serializers.payment import PaymentSerializer
from niqabaty.serializers.user import UserSerializer


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _is_branch_staff(self, user):
        return getattr(user, 'user_type', None) in ['manager', 'institution']

    def _allowed_branch_ids_for_user(self, user):
        managed_ids = Branch.objects.filter(manager=user).values_list('id', flat=True)
        member_ids = user.branches.values_list('id', flat=True)
        return set(list(managed_ids) + list(member_ids))

    def _scoped_querysets(self, user):
        users_qs = User.objects.all()
        memberships_qs = DoctorsMembership.objects.all()
        certifications_qs = Certification.objects.all()
        payments_qs = Payment.objects.all()

        # Full-access administrative scope
        if user.is_superuser:
            return users_qs, memberships_qs, certifications_qs, payments_qs

        # Branch staff require explicit model permission to access branch-wide data
        if self._is_branch_staff(user):
            if not user.has_perm('niqabaty.change_user'):
                return User.objects.none(), DoctorsMembership.objects.none(), Certification.objects.none(), Payment.objects.none()

            allowed_branch_ids = self._allowed_branch_ids_for_user(user)
            if not allowed_branch_ids:
                return User.objects.none(), DoctorsMembership.objects.none(), Certification.objects.none(), Payment.objects.none()

            users_qs = users_qs.filter(branches__id__in=allowed_branch_ids).distinct()
            memberships_qs = memberships_qs.filter(branch_id__in=allowed_branch_ids)
            certifications_qs = certifications_qs.filter(doctor__branches__id__in=allowed_branch_ids).distinct()
            payments_qs = payments_qs.filter(
                Q(membership__branch_id__in=allowed_branch_ids) |
                Q(user__branches__id__in=allowed_branch_ids)
            ).distinct()
            return users_qs, memberships_qs, certifications_qs, payments_qs

        # Doctors can only access their own records
        if getattr(user, 'user_type', None) == 'doctor':
            users_qs = users_qs.filter(id=user.id)
            memberships_qs = memberships_qs.filter(doctor=user)
            certifications_qs = certifications_qs.filter(doctor=user)
            payments_qs = payments_qs.filter(user=user)
            return users_qs, memberships_qs, certifications_qs, payments_qs

        # Students and any other roles receive no aggregate visibility
        return User.objects.none(), DoctorsMembership.objects.none(), Certification.objects.none(), Payment.objects.none()

    def get(self, request):
        user = request.user
        users_qs, memberships_qs, certifications_qs, payments_qs = self._scoped_querysets(user)

        # Stats calculations
        total_members = memberships_qs.count()
        total_doctors = users_qs.filter(user_type='doctor').count()
        total_students = users_qs.filter(user_type='student').count()
        total_institutions = users_qs.filter(user_type='institution').count()

        # Active memberships: start_date <= today and (no end_date or end_date >= today)
        today = timezone.now().date()
        active_memberships = memberships_qs.filter(
            start_date__lte=today,
        ).filter(Q(end_date__isnull=True) | Q(end_date__gte=today)).count()

        pending_certifications_count = certifications_qs.filter(expiry_date__gte=today).count()
        completed_certifications = certifications_qs.count()  # Placeholder: refine if status stored later

        total_revenue = payments_qs.aggregate(total=Sum('amount'))['total'] or 0
        # Placeholder: Payment status not modeled; pending assumed zero
        pending_payments = 0

        # Requests placeholder (no model implemented yet)
        open_requests = 0
        resolved_requests = 0
        
        stats = {
            'totalMembers': total_members,
            'totalDoctors': total_doctors,
            'totalStudents': total_students,
            'totalInstitutions': total_institutions,
            'activeMemberships': active_memberships,
            'pendingCertifications': pending_certifications_count,
            'completedCertifications': completed_certifications,
            'totalRevenue': float(total_revenue),
            'pendingPayments': pending_payments,
            'openRequests': open_requests,
            'resolvedRequests': resolved_requests,
        }

        # Recent entities (limit 5) - return recent memberships serialized with DoctorsMembershipSerializer
        recent_memberships_qs = memberships_qs.select_related('doctor', 'branch', 'membership_type').order_by('-created_at')[:5]
        recent_members_serialized = DoctorsMembershipSerializer(recent_memberships_qs, many=True, context={'request': request}).data

        pending_certifications = list(
            certifications_qs.filter(expiry_date__gte=today)
            .select_related('doctor', 'certification_type')
            .order_by('-issue_date')
            .values(
                'id',
                'doctor__full_name',
                'certification_type__name',
                'expiry_date',
            )[:5]
        )
        pending_certifications_serialized = [
            {
                'id': c['id'],
                'doctor': c.get('doctor__full_name') or '',
                'certification': c.get('certification_type__name') or '',
                'dueDate': c['expiry_date'].isoformat() if c['expiry_date'] else None,
                'progress': 0,  # Progress not modeled yet
            }
            for c in pending_certifications
        ]

        recent_payments_qs = payments_qs.select_related('user').order_by('-payment_date')[:5]
        recent_payments_serialized = PaymentSerializer(recent_payments_qs, many=True, context={'request': request}).data

        # Recent registration requests: users who are not active yet (doctors/students/institutions)
        recent_users_qs = users_qs.filter(
            is_active=False,
            user_type__in=['doctor', 'student', 'institution']
        ).order_by('-created_at')[:5]
        recent_requests_serialized = UserSerializer(recent_users_qs, many=True, context={'request': request}).data

        return Response({
            'stats': stats,
            'recentMembers': recent_members_serialized,
            'pendingCertifications': pending_certifications_serialized,
            'recentPayments': recent_payments_serialized,
            'recentRequests': recent_requests_serialized,
        })
