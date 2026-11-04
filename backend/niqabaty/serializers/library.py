from django.conf import settings
from rest_framework import serializers
from ..models.library import LibraryItem

class LibraryItemSerializer(serializers.ModelSerializer):
    item_type_display = serializers.CharField(source='get_item_type_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = LibraryItem
        fields = [
            'id', 'title', 'description', 'category', 'item_type', 'item_type_display',
            'file', 'file_url', 'external_link', 'thumbnail', 'thumbnail_url',
            'author_name', 'publication_year', 'download_count', 'view_count',
            'is_public', 'created_at', 'updated_at',
            'branch', 'branch_name',
            'specialty', 'specialty_name',
            'created_by', 'created_by_name',
        ]
        read_only_fields = [
            'download_count', 'view_count', 'created_at', 'updated_at',
            'branch', 'branch_name', 'specialty_name',
            'created_by', 'created_by_name',
        ]

    branch_name = serializers.CharField(source='branch.name', read_only=True)
    specialty_name = serializers.CharField(source='specialty.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.full_name or obj.created_by.username
        return None

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None

    def validate_file(self, value):
        if value and value.size > settings.LIBRARY_MAX_UPLOAD_SIZE:
            raise serializers.ValidationError(f"File size must be under {settings.LIBRARY_MAX_UPLOAD_SIZE // (1024*1024)}MB")
        return value

    def validate_thumbnail(self, value):
        if value and value.size > settings.LIBRARY_MAX_UPLOAD_SIZE:
            raise serializers.ValidationError(f"Thumbnail size must be under {settings.LIBRARY_MAX_UPLOAD_SIZE // (1024*1024)}MB")
        return value
