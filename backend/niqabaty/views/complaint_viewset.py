from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from ..models.complaint import Complaint
from ..serializers.complaint import ComplaintSerializer

class ComplaintViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing complaints.
    
    - Users can create and see their own complaints.
    - Admins can see all complaints and respond to them.
    """
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'category', 'user']
    search_fields = ['subject', 'description']
    ordering_fields = ['created_at', 'status', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filter queryset so users only see their own complaints, 
        unless they are staff/admin/managers, who see complaints sent to their branches.
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
            
        is_manager = user.is_staff or getattr(user, 'user_type', None) == 'manager'
        
        if not is_manager:
            # Regular users only see their own complaints
            queryset = queryset.filter(user=user)
        elif not user.is_superuser:
            # Managers/staff only see complaints sent to their branch or sub-branches, or global complaints
            from niqabaty.models import Branch
            from django.db.models import Q
            m_branch_ids = list(user.branches.values_list('id', flat=True))
            if m_branch_ids:
                child_branch_ids = list(Branch.objects.filter(parent_id__in=m_branch_ids).values_list('id', flat=True))
                all_accessible_branch_ids = set(m_branch_ids + child_branch_ids)
                queryset = queryset.filter(
                    Q(sent_to_branch__id__in=all_accessible_branch_ids) | Q(sent_to_branch__isnull=True)
                )
            else:
                # Manager has no assigned branches, only show global complaints
                queryset = queryset.filter(sent_to_branch__isnull=True)
                
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def resolve(self, request, pk=None):
        """Mark a complaint as resolved (Admin/Manager only)"""
        user = request.user
        is_manager = user.is_staff or getattr(user, 'user_type', None) == 'manager'
        if not is_manager:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        complaint = self.get_object()
        complaint.status = 'resolved'
        complaint.resolved_at = timezone.now()
        complaint.admin_response = request.data.get('admin_response', complaint.admin_response)
        complaint.save()
        
        serializer = self.get_serializer(complaint)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_response(self, request, pk=None):
        """Add admin/manager response to a complaint (Admin/Manager only)"""
        user = request.user
        is_manager = user.is_staff or getattr(user, 'user_type', None) == 'manager'
        if not is_manager:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        complaint = self.get_object()
        complaint.admin_response = request.data.get('admin_response', '')
        
        # Auto change status to in_progress if it was pending
        if complaint.status == 'pending':
            complaint.status = 'in_progress'
            
        complaint.save()
        
        serializer = self.get_serializer(complaint)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get statistics about complaints (Admin/Manager only)"""
        user = request.user
        is_manager = user.is_staff or getattr(user, 'user_type', None) == 'manager'
        if not is_manager:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        queryset = self.get_queryset()
        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(status='pending').count(),
            'in_progress': queryset.filter(status='in_progress').count(),
            'resolved': queryset.filter(status='resolved').count(),
            'closed': queryset.filter(status='closed').count(),
        }
        return Response(stats)
