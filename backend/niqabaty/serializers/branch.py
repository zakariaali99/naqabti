from rest_framework import serializers

from niqabaty.models.branch import Branch


class BranchMinimalSerializer(serializers.ModelSerializer):
    """Minimal branch info for nested representations."""
    class Meta:
        model = Branch
        fields = ['id', 'name', 'prefix']


class BranchSerializer(serializers.ModelSerializer):
    manager_details = serializers.SerializerMethodField()
    parent_details = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()
    dynamic_fields = serializers.SerializerMethodField()
    parent_id = serializers.PrimaryKeyRelatedField(
        source='parent',
        queryset=Branch.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Branch
        fields = [
            'id', 'name', 'prefix', 'address', 'city', 'phone', 'email', 'manager',
            'manager_details', 'parent', 'parent_id', 'parent_details', 'children_count',
            'dynamic_fields', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['parent']

    def get_manager_details(self, obj):
        if obj.manager:
            from niqabaty.serializers.user import UserMinimalSerializer
            return UserMinimalSerializer(obj.manager).data
        return None

    def get_parent_details(self, obj):
        if obj.parent:
            return BranchMinimalSerializer(obj.parent).data
        return None

    def get_children_count(self, obj):
        return obj.children.count()

    def get_dynamic_fields(self, obj):
        from niqabaty.serializers.dynamic_field import BranchDynamicFieldSerializer
        fields = obj.dynamic_fields.filter(is_active=True).order_by('order', 'id')
        return BranchDynamicFieldSerializer(fields, many=True).data

    def validate(self, attrs):
        """Validate parent assignment to prevent circular refs and enforce depth limit."""
        parent = attrs.get('parent')
        instance = self.instance

        if parent:
            # Prevent self-reference
            if instance and parent.id == instance.id:
                raise serializers.ValidationError({
                    'parent': 'A branch cannot be its own parent.'
                })

            # Enforce 2-level depth limit
            if parent.parent:
                raise serializers.ValidationError({
                    'parent': 'Cannot create a sub-branch of a sub-branch. Maximum depth is 2 levels.'
                })

            # If this branch has children, it cannot become a child
            if instance and instance.children.exists():
                raise serializers.ValidationError({
                    'parent': 'This branch has sub-branches and cannot become a sub-branch itself.'
                })

        return attrs
