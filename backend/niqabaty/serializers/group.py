from rest_framework import serializers
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


class PermissionSerializer(serializers.ModelSerializer):
    content_type_name = serializers.SerializerMethodField()
    app_label = serializers.SerializerMethodField()
    
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'content_type', 'content_type_name', 'app_label']
        read_only_fields = ['id', 'name', 'codename', 'content_type']
    
    def get_content_type_name(self, obj):
        return obj.content_type.model
    
    def get_app_label(self, obj):
        return obj.content_type.app_label


class GroupSerializer(serializers.ModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.all(),
        required=False
    )
    permission_details = PermissionSerializer(source='permissions', many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions', 'permission_details', 'member_count']
    
    def get_member_count(self, obj):
        return obj.user_set.count()


class GroupDetailSerializer(GroupSerializer):
    """Includes member list"""
    members = serializers.SerializerMethodField()
    
    class Meta(GroupSerializer.Meta):
        fields = GroupSerializer.Meta.fields + ['members']
    
    def get_members(self, obj):
        from .user import UserMinimalSerializer
        return UserMinimalSerializer(obj.user_set.all(), many=True).data
