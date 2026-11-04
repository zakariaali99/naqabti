from rest_framework import serializers
from niqabaty.models import Device


class DeviceSerializer(serializers.ModelSerializer):
    """
    Serializer for Device model.
    Handles FCM token registration and device management.
    """
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Device
        fields = ['id', 'fcm_token', 'user', 'extra_data', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate_fcm_token(self, value):
        """
        Validate FCM token format and length.
        """
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("FCM token cannot be empty.")
        
        if len(value) > 255:
            raise serializers.ValidationError("FCM token is too long.")
        
        return value.strip()
