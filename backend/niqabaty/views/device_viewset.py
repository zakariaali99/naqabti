from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from niqabaty.models import Device
from niqabaty.serializers import DeviceSerializer


class DeviceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing device FCM tokens.
    
    Supports:
    - Anonymous device registration (POST without authentication)
    - Authenticated device registration (automatically associates with user)
    - Device management (list, retrieve, update, delete)
    """
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer

    def get_permissions(self):
        """
        Allow unauthenticated POST requests for device registration.
        Require authentication for all other operations.
        """
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """
        Filter devices to show only the authenticated user's devices.
        For anonymous users, return empty queryset.
        """
        if self.request.user.is_authenticated:
            return Device.objects.filter(user=self.request.user)
        return Device.objects.none()

    def perform_create(self, serializer):
        """
        Associate device with authenticated user if available.
        """
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        """
        Update device and associate with authenticated user if available.
        """
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register_or_update(self, request):
        """
        Register a new device or update existing device token.
        
        If a device with the given fcm_token exists, update it.
        Otherwise, create a new device.
        
        Request body:
        {
            "fcm_token": "string",
            "extra_data": {} (optional)
        }
        """
        fcm_token = request.data.get('fcm_token')
        
        if not fcm_token:
            return Response(
                {'error': 'fcm_token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Try to find existing device
        try:
            device = Device.objects.get(fcm_token=fcm_token)
            # Update existing device
            serializer = self.get_serializer(device, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            if request.user.is_authenticated:
                serializer.save(user=request.user)
            else:
                serializer.save()
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Device.DoesNotExist:
            # Create new device
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            if request.user.is_authenticated:
                serializer.save(user=request.user)
            else:
                serializer.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
