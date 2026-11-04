from datetime import date

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Q

from niqabaty.models import User, Branch


class DoctorDistributionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _is_branch_staff(self, user):
        return getattr(user, 'user_type', None) in ['manager', 'institution']

    def _allowed_branch_ids_for_user(self, user):
        managed_ids = Branch.objects.filter(manager=user).values_list('id', flat=True)
        member_ids = user.branches.values_list('id', flat=True)
        return set(list(managed_ids) + list(member_ids))

    def _scoped_users(self, user):
        qs = User.objects.filter(is_deleted=False, is_active=True, city__isnull=False)

        if user.is_superuser:
            return qs

        if self._is_branch_staff(user):
            if not user.has_perm('niqabaty.change_user'):
                return User.objects.none()
            allowed_branch_ids = self._allowed_branch_ids_for_user(user)
            if not allowed_branch_ids:
                return User.objects.none()
            return qs.filter(
                Q(branches__id__in=allowed_branch_ids) |
                Q(id=user.id)
            ).distinct()

        if getattr(user, 'user_type', None) == 'doctor':
            return qs.filter(id=user.id)

        return User.objects.none()

    def get(self, request):
        user = request.user
        if not (user.is_staff or user.is_superuser or self._is_branch_staff(user)):
            return Response({"detail": "You do not have permission to view doctor distribution map."}, status=403)
        users_qs = self._scoped_users(user)

        if not users_qs.exists():
            return Response([])

        query_params = request.query_params

        user_type = query_params.get('user_type', 'doctor')
        if user_type != 'all':
            users_qs = users_qs.filter(user_type=user_type)

        specialty = query_params.get('specialty')
        if specialty:
            users_qs = users_qs.filter(specialty__icontains=specialty)

        city_id = query_params.get('city_id')
        if city_id:
            users_qs = users_qs.filter(city_id=city_id)

        region = query_params.get('region')
        if region:
            users_qs = users_qs.filter(city__region__icontains=region)

        branch_id = query_params.get('branch_id')
        if branch_id:
            users_qs = users_qs.filter(branches__id=branch_id)

        parent_branch_id = query_params.get('parent_branch_id')
        if parent_branch_id:
            users_qs = users_qs.filter(branches__parent_id=parent_branch_id)

        degree_id = query_params.get('degree_id')
        if degree_id:
            users_qs = users_qs.filter(current_degree_id=degree_id)

        gender = query_params.get('gender')
        if gender:
            users_qs = users_qs.filter(gender=gender)

        nationality_id = query_params.get('nationality_id')
        if nationality_id:
            users_qs = users_qs.filter(nationality_id=nationality_id)

        age_min = query_params.get('age_min')
        age_max = query_params.get('age_max')
        today = date.today()
        if age_min:
            year_max = today.year - int(age_min)
            users_qs = users_qs.filter(birthdate__year__lte=year_max)
        if age_max:
            year_min = today.year - int(age_max) - 1
            users_qs = users_qs.filter(birthdate__year__gte=year_min)

        institution_id = query_params.get('institution_id')
        if institution_id:
            users_qs = users_qs.filter(institutions__id=institution_id)

        has_membership = query_params.get('has_membership')
        if has_membership == 'active':
            users_qs = users_qs.filter(
                memberships__status='active',
                memberships__is_active=True,
            )
        elif has_membership == 'none':
            users_qs = users_qs.filter(memberships__isnull=True)

        values_fields = [
            'city_id', 'city__name', 'city__name_ar',
            'city__region', 'city__latitude', 'city__longitude',
            'area', 'area_latitude', 'area_longitude',
        ]
        distribution = (
            users_qs
            .values(*values_fields)
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return Response([
            {
                'city_id': d['city_id'],
                'city_name': d['city__name'],
                'city_name_ar': d['city__name_ar'],
                'region': d['city__region'],
                'area': d['area'],
                'lat': float(d['area_latitude']) if d['area_latitude']
                       else (float(d['city__latitude']) if d['city__latitude'] else None),
                'lng': float(d['area_longitude']) if d['area_longitude']
                       else (float(d['city__longitude']) if d['city__longitude'] else None),
                'count': d['count'],
            }
            for d in distribution
        ])
