from rest_framework import serializers
from niqabaty.models import Notification, User, SeenNotification
from .user import UserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source='user', queryset=User.objects.all(), write_only=True)
    is_read = serializers.SerializerMethodField()
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'user_id', 'title', 'message', 'notification_type', 'is_read', 'read_at', 'send_to_all_devices', 'batch_id', 'content_type', 'object_id', 'created_by', 'created_at', 'updated_at']

    def get_is_read(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if SeenNotification.objects.filter(
                user=request.user,
                notification=obj
            ).exists():
                return True
        
        if not obj.send_to_all_devices:
            return obj.is_read
            
        return False


class AggregatedNotificationSerializer(serializers.Serializer):
    batch_id = serializers.UUIDField()
    title = serializers.CharField()
    message = serializers.CharField()
    notification_type = serializers.CharField()
    send_to_all_devices = serializers.BooleanField()
    recipient_count = serializers.IntegerField()
    seen_count = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    created_by_name = serializers.CharField(allow_null=True)
