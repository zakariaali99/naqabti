from rest_framework import serializers
from ..models.complaint import Complaint
from .user import UserSerializer
from .branch import BranchSerializer

class ComplaintSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    sent_to_branch_detail = BranchSerializer(source='sent_to_branch', read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'user', 'user_detail', 'subject', 'description', 
            'status', 'status_display', 'priority', 'priority_display', 
            'category', 'admin_response', 'resolved_at', 'attachment',
            'sent_to_branch', 'sent_to_branch_detail',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['admin_response', 'resolved_at', 'created_at', 'updated_at', 'user']

    def validate_sent_to_branch(self, value):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return value

        user = request.user
        if user.is_superuser or not value:
            return value

        user_branch_ids = set(user.branches.values_list('id', flat=True))
        parent_branch_ids = set(
            user.branches.exclude(parent__isnull=True).values_list('parent_id', flat=True)
        )
        allowed_branch_ids = user_branch_ids | parent_branch_ids

        if value.id not in allowed_branch_ids:
            raise serializers.ValidationError(
                "You can only send complaints to your branch or its parent branch."
            )

        return value

    def create(self, validated_data):
        # Set current user as the author of the complaint
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
