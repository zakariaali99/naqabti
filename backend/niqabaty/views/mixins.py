from niqabaty.models.branch import Branch


class ManagedBranchPermissionMixin:
    """Shared branch-scoping logic for viewsets whose write access is gated
    by branch management (BranchViewSet, BranchDynamicFieldViewSet)."""

    def get_managed_branch_ids(self, user):
        """
        Get all branch IDs that the user can manage.
        Includes:
        - Branches where user is the manager
        - All children of branches where user is the manager
        - Parent of branches where user is the manager (for context)
        """
        managed_branches = Branch.objects.filter(manager=user)
        branch_ids = set(managed_branches.values_list('id', flat=True))

        # Add all children of managed branches
        for branch in managed_branches:
            child_ids = branch.children.values_list('id', flat=True)
            branch_ids.update(child_ids)

        # Add parent branches for context (read-only access)
        for branch in managed_branches:
            if branch.parent:
                branch_ids.add(branch.parent.id)

        return branch_ids
