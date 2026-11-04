from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from ..serializers.group import PermissionSerializer, GroupSerializer, GroupDetailSerializer
from ..pagination import Pagination


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for listing available permissions
    """
    queryset = Permission.objects.select_related('content_type').all()
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = Pagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'codename']
    ordering_fields = ['content_type__app_label', 'content_type__model', 'codename']
    ordering = ['content_type__app_label', 'content_type__model', 'codename']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Only show permissions for 'niqabaty' app
        queryset = queryset.filter(content_type__app_label='niqabaty')
        
        # Filter by content_type if provided
        content_type = self.request.query_params.get('content_type', None)
        if content_type:
            queryset = queryset.filter(content_type__model=content_type)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def grouped(self, request):
        """Return permissions grouped by content type"""
        permissions_qs = self.get_queryset()
        grouped = {}
        
        for perm in permissions_qs:
            model = perm.content_type.model
            if model not in grouped:
                grouped[model] = {
                    'model': model,
                    'app_label': perm.content_type.app_label,
                    'model_name': perm.content_type.name,
                    'permissions': []
                }
            grouped[model]['permissions'].append(PermissionSerializer(perm).data)
        
        return Response(list(grouped.values()))


class UserGroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user groups and permissions
    """
    queryset = Group.objects.prefetch_related('permissions', 'user_set').all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = Pagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'id']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GroupDetailSerializer
        return GroupSerializer
    
    def get_permissions(self):
        """Require change_group permission for create/update/delete"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), permissions.DjangoModelPermissions()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=True, methods=['post'])
    def add_user(self, request, pk=None):
        """Add a user to this group"""
        group = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)
        
        try:
            from ..models import User
            user = User.objects.get(id=user_id)
            group.user_set.add(user)
            return Response({'message': f'User {user.username} added to group {group.name}'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
    
    @action(detail=True, methods=['post'])
    def remove_user(self, request, pk=None):
        """Remove a user from this group"""
        group = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)
        
        try:
            from ..models import User
            user = User.objects.get(id=user_id)
            group.user_set.remove(user)
            return Response({'message': f'User {user.username} removed from group {group.name}'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of this group"""
        group = self.get_object()
        from ..serializers.user import UserMinimalSerializer
        users = group.user_set.all()
        serializer = UserMinimalSerializer(users, many=True)
        return Response(serializer.data)
