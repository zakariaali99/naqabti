from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from niqabaty.models import User
from niqabaty.serializers.public_doctor import PublicDoctorProfileSerializer


class PublicDoctorProfileView(APIView):
    """
    Publicly accessible endpoint for retrieving a verified doctor's public profile by username.
    No authentication required.
    Strictly isolated to active, approved doctor accounts with customizable field visibility.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, username=None):
        if not username:
            return Response(
                {"detail": "Username parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            doctor = User.objects.select_related(
                'city', 'nationality', 'current_degree'
            ).prefetch_related(
                'branches', 'institutions'
            ).get(
                username__iexact=username.strip(),
                user_type='doctor',
                is_active=True,
                is_deleted=False,
                approval_status='approved',
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Doctor profile not found or is currently not publicly active."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PublicDoctorProfileSerializer(doctor, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
