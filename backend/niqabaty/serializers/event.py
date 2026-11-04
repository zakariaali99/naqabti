from rest_framework import serializers
from niqabaty.models import Event, User
from .user import UserSerializer


class EventSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    author_id = serializers.PrimaryKeyRelatedField(
        source='author',
        queryset=User.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'content',
            'excerpt',
            'featured_image',
            'event_date',
            'location',
            'max_attendees',
            'status',
            'author',
            'author_id',
            'published_at',
            'views_count',
            'is_featured',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        ]
        read_only_fields = [
            'views_count', 'created_at', 'updated_at',
            'created_by', 'updated_by',
        ]


class EventListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    author = UserSerializer(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'excerpt',
            'featured_image',
            'event_date',
            'location',
            'status',
            'author',
            'published_at',
            'views_count',
            'is_featured',
            'created_at',
        ]
