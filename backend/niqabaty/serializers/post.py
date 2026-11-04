from rest_framework import serializers
from niqabaty.models import Post, User
from .user import UserSerializer


class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    author_id = serializers.PrimaryKeyRelatedField(
        source='author',
        queryset=User.objects.all(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Post
        fields = [
            'id',
            'title',
            'content',
            'excerpt',
            'post_type',
            'status',
            'featured_image',
            'author',
            'author_id',
            'published_at',
            'views_count',
            'is_featured',
            'tags',
            'meta_data',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        ]
        read_only_fields = ['views_count', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def create(self, validated_data):
        # Set author from request user if not provided
        request = self.context.get('request')
        if request and not validated_data.get('author'):
            validated_data['author'] = request.user
        return super().create(validated_data)


class PostListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id',
            'title',
            'excerpt',
            'post_type',
            'status',
            'featured_image',
            'author',
            'published_at',
            'views_count',
            'is_featured',
            'tags',
            'created_at',
        ]
