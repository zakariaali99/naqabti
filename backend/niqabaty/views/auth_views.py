from django.contrib.auth import get_user_model
from django.db import IntegrityError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken
from django.utils import timezone
from niqabaty.serializers.auth import (
    LoginSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
)
from niqabaty.serializers.user import UserSerializer
from niqabaty.utils.email_utils import (
    PASSWORD_RESET_CODE_TTL,
    is_verification_code_valid,
    send_password_reset_email,
    send_verification_email,
)
from niqabaty.models import Device
from niqabaty.utils.phone import phone_variants
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

User = get_user_model()


def _password_error_response(error):
    """400 for a rejected new password: readable text plus the validator
    codes (e.g. password_too_common) so the apps can show it translated."""
    return Response({
        'error': ' '.join(error.messages),
        'codes': [e.code for e in error.error_list if e.code],
    }, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        fcm_token = request.data.get('fcm_token')
        
        # Associate FCM token with user if provided
        if fcm_token:
            Device.objects.update_or_create(
                fcm_token=fcm_token,
                defaults={'user': user}
            )
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user, context={'request': request}).data
        })

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Explicit validation for email and phone number uniqueness.
        # Check active users only (default manager filters soft-deleted) so a
        # soft-deleted account's email/phone can be reused. Case-insensitive
        # because email is normalized on save.
        email = request.data.get('email')
        phone_number = request.data.get('phone_number')

        errors = {}
        if email and User.objects.filter(email__iexact=email.strip()).exists():
            errors['email'] = ['Email already registered']
        if phone_number:
            if User.objects.filter(phone_number__in=phone_variants(phone_number)).exists():
                errors['phone_number'] = ['Phone number already registered']

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Accept registration data (including multipart files) and validate
        serializer = RegisterSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid(raise_exception=False):
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Safety net: convert any residual DB uniqueness collision (case
        # mismatch, soft-deleted rows, or a concurrent signup race) into a
        # clean 400 instead of an unhandled 500 IntegrityError.
        try:
            user = serializer.save()
        except IntegrityError as exc:
            message = str(exc).lower()
            if 'email' in message:
                field_errors = {'email': ['Email already registered']}
            elif 'phone' in message:
                field_errors = {'phone_number': ['Phone number already registered']}
            elif 'username' in message:
                field_errors = {'username': ['Username already taken']}
            else:
                field_errors = {'detail': ['This account already exists.']}
            return Response(field_errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Set user as active and verified immediately
        user.is_active = True
        user.email_verified = True
        user.save(update_fields=['is_active', 'email_verified'])
        
        return Response({
            'message': 'Registration successful.',
            'email': user.email,
            'username': user.username,
            'user_id': user.id,
        }, status=status.HTTP_201_CREATED)

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id')
        code = request.data.get('code')
        
        if not user_id or not code:
            return Response({
                'error': 'user_id and code are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if already verified
        if user.email_verified:
            return Response({
                'message': 'Email already verified'
            }, status=status.HTTP_200_OK)
        
        # Check if code is valid
        if not is_verification_code_valid(user):
            return Response({
                'error': 'Verification code has expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if code matches
        if user.verification_code != code:
            return Response({
                'error': 'Invalid verification code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark as verified and activate
        user.email_verified = True
        user.is_active = True
        user.verification_code = None
        user.verification_code_created = None
        user.save(update_fields=['email_verified', 'is_active', 'verification_code', 'verification_code_created'])
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Email verified successfully',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user, context={'request': request}).data
        }, status=status.HTTP_200_OK)

class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id')
        email = request.data.get('email')
        
        user = None
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        elif email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                pass
            except User.MultipleObjectsReturned:
                # If multiple users with same email, get the most recent unverified one
                user = User.objects.filter(email=email, email_verified=False).order_by('-date_joined').first()
                if not user:
                    # All users with this email are verified, get the most recent one
                    user = User.objects.filter(email=email).order_by('-date_joined').first()
        
        if not user:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if user.email_verified:
            return Response({
                'message': 'Email already verified'
            }, status=status.HTTP_200_OK)
        
        try:
            send_verification_email(user)
            return Response({
                'message': 'Verification code sent successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error sending verification email: {e}")
            return Response({
                'error': f'Failed to send verification email: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({'detail': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Logged out successfully'})

class SafeTokenRefreshView(TokenRefreshView):
    """Token refresh that answers 401 instead of 500 when the account is gone.

    simplejwt looks the user up with the default (soft-delete filtered)
    manager, so a refresh token belonging to a deleted account raises
    User.DoesNotExist.
    """

    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except User.DoesNotExist:
            raise InvalidToken('User not found')


class ChangePasswordView(APIView):
    """Change the password of the signed-in user (web and mobile)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not current_password or not new_password or not confirm_password:
            return Response({
                'error': 'current_password, new_password, and confirm_password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(current_password):
            return Response({
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({
                'error': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user)
        except DjangoValidationError as e:
            return _password_error_response(e)

        user.set_password(new_password)
        user.save()

        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Request password reset - sends OTP to user's email.
        Accepts either 'email' or 'username' in request data.
        """
        email = request.data.get('email')
        username = request.data.get('username')
        
        if not email and not username:
            return Response({
                'error': 'email or username is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find user by email or username
        user = None
        if email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                pass
        elif username:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                pass
        
        # Always return success to prevent email enumeration
        if not user:
            return Response({
                'message': 'If an account exists with this email, a reset code will be sent.'
            }, status=status.HTTP_200_OK)
        
        try:
            send_password_reset_email(user)
            return Response({
                'message': 'If an account exists with this email, a reset code will be sent.',
                'user_id': user.id,
                'email': user.email
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error sending password reset email: {e}")
            return Response({
                'error': 'Failed to send reset email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Verify the OTP code for password reset.
        """
        user_id = request.data.get('user_id')
        code = request.data.get('code')
        
        if not user_id or not code:
            return Response({
                'error': 'user_id and code are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if code is valid
        if not is_verification_code_valid(user, PASSWORD_RESET_CODE_TTL):
            return Response({
                'error': 'Verification code has expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if code matches
        if user.verification_code != code:
            return Response({
                'error': 'Invalid verification code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': 'Code verified successfully',
            'user_id': user.id
        }, status=status.HTTP_200_OK)


class ConfirmPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Reset password after OTP verification.
        """
        user_id = request.data.get('user_id')
        code = request.data.get('code')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not user_id or not code or not new_password or not confirm_password:
            return Response({
                'error': 'user_id, code, new_password, and confirm_password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({
                'error': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if code is valid
        if not is_verification_code_valid(user, PASSWORD_RESET_CODE_TTL):
            return Response({
                'error': 'Verification code has expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if code matches
        if user.verification_code != code:
            return Response({
                'error': 'Invalid verification code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate password
        try:
            validate_password(new_password, user)
        except DjangoValidationError as e:
            return _password_error_response(e)
        
        # Set new password
        user.set_password(new_password)
        user.verification_code = None
        user.verification_code_created = None
        user.save()
        
        return Response({
            'message': 'Password reset successfully'
        }, status=status.HTTP_200_OK)
