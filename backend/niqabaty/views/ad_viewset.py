from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from niqabaty.models import Ad, AdView, User
from niqabaty.serializers import AdSerializer


class AdViewSet(viewsets.ModelViewSet):
    queryset = Ad.objects.all()
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    filterset_fields = ['status']
    ordering_fields = ['created_at', 'published_at', 'views_count', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = Ad.objects.all()
        
        if not user.is_authenticated:
            return queryset.filter(status='published')
            
        is_manager = user.is_staff or getattr(user, 'user_type', None) == 'manager'
        
        if user.is_superuser or is_manager:
            return queryset
        elif getattr(user, 'user_type', None) == 'advertiser':
            return queryset.filter(advertiser=user)
        else:
            return queryset.filter(status='published')

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        ad = self.get_object()
        ad.status = 'published'
        ad.published_at = timezone.now()
        ad.save(update_fields=['status', 'published_at'])
        return Response(AdSerializer(ad).data)

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        ad = self.get_object()
        ad.status = 'draft'
        ad.published_at = None
        ad.save(update_fields=['status', 'published_at'])
        return Response(AdSerializer(ad).data)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        ad = self.get_object()
        ad.status = 'archived'
        ad.save(update_fields=['status'])
        return Response(AdSerializer(ad).data)

    @action(detail=True, methods=['post'])
    def record_view(self, request, pk=None):
        ad = self.get_object()
        if request.user.is_authenticated:
            view, created = AdView.objects.get_or_create(ad=ad, user=request.user)
            if created:
                ad.views_count = ad.views.count()
                ad.save(update_fields=['views_count'])
        return Response({'status': 'success', 'views_count': ad.views_count})

    @action(detail=False, methods=['get'])
    def calculate_audience(self, request):
        branch_ids = request.query_params.get('branch_ids')
        city_ids = request.query_params.get('city_ids')
        specialty_ids = request.query_params.get('specialty_ids')

        qs = User.objects.filter(is_deleted=False, is_active=True, user_type='doctor')

        if branch_ids:
            branch_id_list = [int(bid) for bid in branch_ids.split(',') if bid.strip().isdigit()]
            if branch_id_list:
                qs = qs.filter(branches__id__in=branch_id_list)

        if city_ids:
            city_id_list = [int(cid) for cid in city_ids.split(',') if cid.strip().isdigit()]
            if city_id_list:
                qs = qs.filter(city_id__in=city_id_list)

        if specialty_ids:
            specialty_id_list = [int(sid) for sid in specialty_ids.split(',') if sid.strip().isdigit()]
            if specialty_id_list:
                from niqabaty.models import DoctorSpecialty
                spec_names = list(DoctorSpecialty.objects.filter(id__in=specialty_id_list).values_list('name', flat=True))
                if spec_names:
                    qs = qs.filter(specialty__in=spec_names)

        qs = qs.distinct()
        count = qs.count()

        # Simple breakdown
        by_branch = list(qs.values('branches__name').annotate(count=Count('id')).order_by('-count')[:5])
        by_city = list(qs.values('city__name').annotate(count=Count('id')).order_by('-count')[:5])

        return Response({
            'count': count,
            'breakdown': {
                'by_branch': [{'name': item['branches__name'] or 'N/A', 'count': item['count']} for item in by_branch],
                'by_city': [{'name': item['city__name'] or 'N/A', 'count': item['count']} for item in by_city]
            }
        })

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        ad = self.get_object()
        views = ad.views.select_related('user').all()
        
        # Breakdown by branch / city of users who saw it
        by_branch = list(views.values('user__branches__name').annotate(count=Count('id')).order_by('-count'))
        by_city = list(views.values('user__city__name').annotate(count=Count('id')).order_by('-count'))
        
        who_viewed = [{
            'user_id': v.user.id,
            'username': v.user.username,
            'full_name': v.user.full_name,
            'viewed_at': v.viewed_at
        } for v in views[:50]]
        
        return Response({
            'views_count': ad.views_count,
            'breakdown': {
                'by_branch': [{'name': item['user__branches__name'] or 'N/A', 'count': item['count']} for item in by_branch],
                'by_city': [{'name': item['user__city__name'] or 'N/A', 'count': item['count']} for item in by_city]
            },
            'viewers': who_viewed
        })
