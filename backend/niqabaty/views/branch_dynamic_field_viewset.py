from rest_framework import viewsets, permissions

from niqabaty.models.dynamic_field import BranchDynamicField
from niqabaty.serializers.dynamic_field import BranchDynamicFieldSerializer
from niqabaty.views.mixins import ManagedBranchPermissionMixin


class BranchDynamicFieldViewSet(ManagedBranchPermissionMixin, viewsets.ModelViewSet):
    """API endpoint for a branch's custom profile fields.

    Read access mirrors BranchViewSet (public list/retrieve, filterable by
    `?branch=<id>`). Write access is limited to the branch's manager (or
    staff/superusers), reusing the same managed-branch-ids permission check.
    """
    queryset = BranchDynamicField.objects.all()
    serializer_class = BranchDynamicFieldSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return []  # Allow public access
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        user = self.request.user

        if not user or not user.is_authenticated:
            return qs.filter(is_active=True, branch__is_active=True)

        if user.is_superuser or user.is_staff:
            return qs

        if getattr(user, 'user_type', None) in ['manager', 'institution']:
            managed_ids = self.get_managed_branch_ids(user)
            if managed_ids:
                return qs.filter(branch_id__in=managed_ids) | qs.filter(is_active=True)

        return qs.filter(is_active=True)

    def perform_create(self, serializer):
        user = self.request.user
        branch = serializer.validated_data.get('branch')

        if not (user.is_superuser or user.is_staff):
            managed_ids = self.get_managed_branch_ids(user)
            if not branch or branch.id not in managed_ids:
                self.permission_denied(
                    self.request,
                    message='You do not have permission to add fields to this branch.',
                )

        serializer.save(created_by=user, updated_by=user)

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()

        if not (user.is_superuser or user.is_staff):
            managed_ids = self.get_managed_branch_ids(user)
            if instance.branch_id not in managed_ids:
                self.permission_denied(
                    self.request,
                    message='You do not have permission to modify this field.',
                )

        serializer.save(updated_by=user)

    def perform_destroy(self, instance):
        user = self.request.user

        if not (user.is_superuser or user.is_staff):
            managed_ids = self.get_managed_branch_ids(user)
            if instance.branch_id not in managed_ids:
                self.permission_denied(
                    self.request,
                    message='You do not have permission to delete this field.',
                )

        instance.delete()
