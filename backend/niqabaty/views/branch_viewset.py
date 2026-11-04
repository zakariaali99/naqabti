from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend

from niqabaty.models.branch import Branch
from niqabaty.serializers.branch import BranchSerializer
from niqabaty.views.mixins import ManagedBranchPermissionMixin


class BranchViewSet(ManagedBranchPermissionMixin, viewsets.ModelViewSet):
    """API endpoint for branches with hierarchical permissions."""
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['name']

    def get_permissions(self):
        """
        Allow unauthenticated access for list/retrieve (GET) operations.
        Require authentication for create/update/delete operations.
        """
        if self.action in ['list', 'retrieve']:
            return []  # Allow public access
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Anonymous users (unauthenticated) see only active branches
        if not user or not user.is_authenticated:
            return qs.filter(is_active=True)
        
        # Superusers and staff see all branches
        if user.is_superuser or user.is_staff:
            return qs
        
        # Managers see branches they manage + sub-branches + parent for context
        if hasattr(user, 'user_type') and user.user_type in ['manager', 'institution']:
            managed_ids = self.get_managed_branch_ids(user)
            if managed_ids:
                return qs.filter(id__in=managed_ids, is_active=True)
        
        # Regular authenticated users see only active branches
        return qs.filter(is_active=True)

    def perform_create(self, serializer):
        """Override create to check parent branch access."""
        user = self.request.user
        parent = serializer.validated_data.get('parent')
        
        # Check if user can create under this parent
        if parent and not (user.is_superuser or user.is_staff):
            managed_ids = self.get_managed_branch_ids(user)
            if parent.id not in managed_ids:
                self.permission_denied(
                    self.request,
                    message='You do not have permission to create sub-branches under this parent.'
                )
        
        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        """Override update to check parent branch access."""
        user = self.request.user
        instance = self.get_object()
        new_parent = serializer.validated_data.get('parent')
        
        # Check if user can modify this branch
        if not (user.is_superuser or user.is_staff):
            managed_ids = self.get_managed_branch_ids(user)
            
            # Check current branch access
            if instance.id not in managed_ids:
                self.permission_denied(
                    self.request,
                    message='You do not have permission to modify this branch.'
                )
            
            # Check new parent access (if changing parent)
            if new_parent and new_parent != instance.parent:
                if new_parent.id not in managed_ids:
                    self.permission_denied(
                        self.request,
                        message='You do not have permission to move branches under this parent.'
                    )
        
        serializer.save(updated_by=user)

    def perform_destroy(self, instance):
        """Override delete to check permissions."""
        user = self.request.user
        
        # Check if user can delete this branch
        if not (user.is_superuser or user.is_staff):
            managed_ids = self.get_managed_branch_ids(user)
            if instance.id not in managed_ids:
                self.permission_denied(
                    self.request,
                    message='You do not have permission to delete this branch.'
                )
        
        instance.delete()
