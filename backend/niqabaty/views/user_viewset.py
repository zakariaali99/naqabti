from rest_framework import viewsets, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from niqabaty.models import User, Branch
from niqabaty.models.dynamic_field import BranchDynamicField, UserDynamicFieldValue
from niqabaty.serializers import UserSerializer
from niqabaty.serializers.dynamic_field import UserDynamicFieldValueSerializer
from niqabaty.utils.notifications import send_notification

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['created_at', 'full_name', 'email', 'user_type', 'gender', 'graduation_year']
    ordering = ['-created_at']

    def _is_branch_staff(self, user):
        return getattr(user, 'user_type', None) in ['manager', 'institution']

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    def get_serializer(self, *args, **kwargs):
        # kwargs.setdefault('context', self.get_serializer_context())
        return UserSerializer(*args, **kwargs, context=self.get_serializer_context())

    def _allowed_branch_ids_for_user(self, user):
        managed_ids = list(Branch.objects.filter(manager=user).values_list('id', flat=True))
        member_ids = list(user.branches.values_list('id', flat=True))
        all_ids = set(managed_ids + member_ids)
        
        # Include children (sub-branches)
        if all_ids:
            child_ids = Branch.objects.filter(parent_id__in=all_ids).values_list('id', flat=True)
            all_ids.update(child_ids)
            
        return all_ids

    def _can_manage_doctor_action(self, current_user, target_user):
        """
        Managers/institutions may manage doctor actions only when:
        - they have Django model permission `niqabaty.change_user`
        - target is in one of their allowed branches
        Superusers are always allowed.
        """
        if not current_user.is_authenticated:
            return False

        if current_user.is_superuser:
            return True

        if not self._is_branch_staff(current_user):
            return False

        # Model-based permission gate for edit-like actions
        if not current_user.has_perm('niqabaty.change_user'):
            return False

        allowed_branch_ids = self._allowed_branch_ids_for_user(current_user)
        return target_user.branches.filter(id__in=allowed_branch_ids).exists()

    def get_queryset(self):
        """
        Filter users by:
        - date_joined_after: joined from date (YYYY-MM-DD)
        - date_joined_before: joined to date (YYYY-MM-DD)
        - is_active: active status (true/false)
        - user_type: doctor/manager
        - branch_ids: comma-separated branch IDs (e.g., "1,2,3")
        - search: search in name, email, username, specialty, bio
        
        Superusers can see all users.
        Managers and institutions can only see users from their own branches.
        Other user types get an empty queryset.
        """
        # Check if user is authenticated
        if not self.request.user.is_authenticated:
            return User.objects.none()
        
        current_user = self.request.user
        
        # Superusers can see all users
        if current_user.is_superuser:
            queryset = User.objects.all()
        # Only managers and institutions can view users from their branches
        elif self._is_branch_staff(current_user):
            # Get branches the user manages (via Branch.manager)
            allowed_branch_ids = self._allowed_branch_ids_for_user(current_user)
            
            if allowed_branch_ids:
                queryset = User.objects.filter(branches__in=allowed_branch_ids).distinct()
            else:
                queryset = User.objects.none()
        elif getattr(current_user, "user_type", None) in ["doctor", "student", "viewer", "advertiser"]:
            action = getattr(self, "action", None)
            if action in ["retrieve", "update", "partial_update", "destroy"]:
                queryset = User.objects.filter(id=current_user.id)
            else:
                queryset = User.objects.none()
        else:
            return User.objects.none()
        
        # Date range filters
        date_joined_after = self.request.query_params.get('date_joined_after')
        if date_joined_after:
            queryset = queryset.filter(date_joined__date__gte=date_joined_after)
        
        date_joined_before = self.request.query_params.get('date_joined_before')
        if date_joined_before:
            queryset = queryset.filter(date_joined__date__lte=date_joined_before)
        
        # Status filter
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in ['true', '1', 'yes'])
        
        # User type filter
        user_type = self.request.query_params.get('user_type')
        if user_type:
            queryset = queryset.filter(user_type=user_type)

        # Approval status filter (pending/approved/rejected)
        approval_status = self.request.query_params.get('approval_status')
        if approval_status:
            queryset = queryset.filter(approval_status=approval_status)
        
        branch_ids = self.request.query_params.get('branch_ids')
        if branch_ids:
            # Split comma-separated IDs and convert to integers
            branch_id_list = [int(id.strip()) for id in branch_ids.split(',') if id.strip().isdigit()]
            if branch_id_list:
                # Include sub-branches
                all_branch_ids = set(branch_id_list)
                child_branch_ids = Branch.objects.filter(parent_id__in=branch_id_list).values_list('id', flat=True)
                all_branch_ids.update(child_branch_ids)
                queryset = queryset.filter(branches__id__in=all_branch_ids).distinct()
        
        # Graduation year filter
        graduation_year = self.request.query_params.get('graduation_year')
        if graduation_year:
            queryset = queryset.filter(graduation_year=int(graduation_year))
        
        graduation_year_after = self.request.query_params.get('graduation_year_after')
        if graduation_year_after:
            queryset = queryset.filter(graduation_year__gte=int(graduation_year_after))
            
        graduation_year_before = self.request.query_params.get('graduation_year_before')
        if graduation_year_before:
            queryset = queryset.filter(graduation_year__lte=int(graduation_year_before))
        
        # Current degree filter
        current_degree = self.request.query_params.get('current_degree')
        if current_degree:
            queryset = queryset.filter(current_degree__name__icontains=current_degree)
        
        # Email verified filter
        email_verified = self.request.query_params.get('email_verified')
        if email_verified is not None:
            queryset = queryset.filter(email_verified=email_verified.lower() in ['true', '1', 'yes'])
        
        # Nationality filter
        nationality = self.request.query_params.get('nationality')
        if nationality:
            queryset = queryset.filter(nationality__name__icontains=nationality)
        
        # City filter
        city = self.request.query_params.get('city')
        if city:
            city_list = [c.strip() for c in city.split(',') if c.strip()]
            if city_list:
                queryset = queryset.filter(city__name__in=city_list)
        
        # Birthdate filter
        birthdate = self.request.query_params.get('birthdate')
        if birthdate:
            queryset = queryset.filter(birthdate=birthdate)
            
        birthdate_after = self.request.query_params.get('birthdate_after')
        if birthdate_after:
            queryset = queryset.filter(birthdate__gte=birthdate_after)
            
        birthdate_before = self.request.query_params.get('birthdate_before')
        if birthdate_before:
            queryset = queryset.filter(birthdate__lte=birthdate_before)
        
        # Gender filter
        gender = self.request.query_params.get('gender')
        if gender:
            queryset = queryset.filter(gender=gender)
        
        # Search filter (search in name, email, username, specialty, bio)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(username__icontains=search) |
                Q(specialty__icontains=search) |
                Q(bio__icontains=search)
            )
        
        return queryset

    def _validate_branch_scope(self, request, instance=None):
        """Validate that assigned branch_ids/managed_branch_ids are within the user's allowed scope."""
        user = request.user
        if user.is_superuser:
            return None
        if instance is not None and instance.id == user.id:
            return None

        allowed_ids = self._allowed_branch_ids_for_user(user)
        
        for field in ('branch_ids', 'managed_branch_ids'):
            ids = request.data.get(field)
            if ids:
                if isinstance(ids, str):
                    try:
                        ids = [int(x) for x in ids.split(',') if x.strip().isdigit()]
                    except (ValueError, TypeError):
                        return {'detail': f'Invalid {field} format.'}
                for bid in ids:
                    bid = int(bid)
                    if bid not in allowed_ids:
                        return {'detail': f'Branch {bid} is outside your scope.'}
        return None

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        phone_number = request.data.get('phone_number')
        
        errors = {}
        if email and User.objects.filter(email=email).exists():
            errors['email'] = ['Email already registered.']
        if phone_number:
            clean_phone = phone_number.strip()
            if clean_phone and User.objects.filter(phone_number=clean_phone).exists():
                errors['phone_number'] = ['Phone number already registered.']
                
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        scope_err = self._validate_branch_scope(request)
        if scope_err:
            return Response(scope_err, status=status.HTTP_403_FORBIDDEN)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(is_active=True)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        email = request.data.get('email')
        phone_number = request.data.get('phone_number')
        
        errors = {}
        if email and User.objects.filter(email=email).exclude(id=instance.id).exists():
            errors['email'] = ['Email already registered.']
        if phone_number:
            clean_phone = phone_number.strip()
            if clean_phone and User.objects.filter(phone_number=clean_phone).exclude(id=instance.id).exists():
                errors['phone_number'] = ['Phone number already registered.']

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        scope_err = self._validate_branch_scope(request, instance=instance)
        if scope_err:
            return Response(scope_err, status=status.HTTP_403_FORBIDDEN)

        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        email = request.data.get('email')
        phone_number = request.data.get('phone_number')
        
        errors = {}
        if email and User.objects.filter(email=email).exclude(id=instance.id).exists():
            errors['email'] = ['Email already registered.']
        if phone_number:
            clean_phone = phone_number.strip()
            if clean_phone and User.objects.filter(phone_number=clean_phone).exclude(id=instance.id).exists():
                errors['phone_number'] = ['Phone number already registered.']

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        scope_err = self._validate_branch_scope(request, instance=instance)
        if scope_err:
            return Response(scope_err, status=status.HTTP_403_FORBIDDEN)

        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.id != request.user.id and not request.user.is_staff:
            return Response(
                {'detail': 'Not permitted'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='verify_email')
    def verify_email(self, request, pk=None):
        """Manually verify a user's email."""
        try:
            target = self.get_object()
        except Exception:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        current = request.user
        if not current.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_403_FORBIDDEN)

        if not self._can_manage_doctor_action(current, target):
            return Response({'detail': 'Not permitted to verify this user'}, status=status.HTTP_403_FORBIDDEN)

        target.email_verified = True
        target.save(update_fields=['email_verified'])
        return Response({'id': target.id, 'email_verified': True, 'message': 'Email verified successfully'})

    @action(detail=True, methods=['post'], url_path='toggle_active')
    def toggle_active(self, request, pk=None):
        """Toggle `is_active` for a user."""
        try:
            target = self.get_object()
        except Exception:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        current = request.user
        if not current.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_403_FORBIDDEN)

        if not self._can_manage_doctor_action(current, target):
            return Response({'detail': 'Not permitted to change this user'}, status=status.HTTP_403_FORBIDDEN)

        target.is_active = not target.is_active
        target.save(update_fields=['is_active'])
        return Response({'id': target.id, 'is_active': target.is_active})

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """Approve a pending doctor account."""
        try:
            target = self.get_object()
        except Exception:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        current = request.user
        if not current.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_403_FORBIDDEN)

        if target.user_type != 'doctor':
            return Response({'detail': 'Only doctor accounts require approval'}, status=status.HTTP_400_BAD_REQUEST)

        if not self._can_manage_doctor_action(current, target):
            return Response({'detail': 'Not permitted to review this user'}, status=status.HTTP_403_FORBIDDEN)

        if not target.branches.exists():
            return Response({'detail': 'Doctor must select a branch before approval'}, status=status.HTTP_400_BAD_REQUEST)

        target.approval_status = 'approved'
        target.save(update_fields=['approval_status'])

        send_notification(
            user_ids=[target.id],
            title='تمت الموافقة على حسابك' if target.language == 'ar' else 'Your account has been approved',
            message=(
                'تمت مراجعة حسابك والموافقة عليه من قبل الإدارة.'
                if target.language == 'ar'
                else 'Your account has been reviewed and approved by the administration.'
            ),
            notification_type='success',
            content_type='user',
            object_id=target.id,
            created_by=current,
        )
        return Response(UserSerializer(target, context=self.get_serializer_context()).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        """Reject a pending doctor account."""
        try:
            target = self.get_object()
        except Exception:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        current = request.user
        if not current.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_403_FORBIDDEN)

        if target.user_type != 'doctor':
            return Response({'detail': 'Only doctor accounts require approval'}, status=status.HTTP_400_BAD_REQUEST)

        if not self._can_manage_doctor_action(current, target):
            return Response({'detail': 'Not permitted to review this user'}, status=status.HTTP_403_FORBIDDEN)

        target.approval_status = 'rejected'
        target.save(update_fields=['approval_status'])

        send_notification(
            user_ids=[target.id],
            title='تم رفض حسابك' if target.language == 'ar' else 'Your account has been rejected',
            message=(
                'تم رفض طلب حسابك من قبل الإدارة. يرجى التواصل مع الإدارة لمزيد من المعلومات.'
                if target.language == 'ar'
                else 'Your account application was rejected by the administration. Please contact the administration for more information.'
            ),
            notification_type='warning',
            content_type='user',
            object_id=target.id,
            created_by=current,
        )
        return Response(UserSerializer(target, context=self.get_serializer_context()).data)

    @action(detail=True, methods=['post'], url_path='set-pending')
    def set_pending(self, request, pk=None):
        """Reset a doctor account back to pending review."""
        try:
            target = self.get_object()
        except Exception:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        current = request.user
        if not current.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_403_FORBIDDEN)

        if target.user_type != 'doctor':
            return Response({'detail': 'Only doctor accounts require approval'}, status=status.HTTP_400_BAD_REQUEST)

        if not self._can_manage_doctor_action(current, target):
            return Response({'detail': 'Not permitted to review this user'}, status=status.HTTP_403_FORBIDDEN)

        target.approval_status = 'pending'
        target.save(update_fields=['approval_status'])

        send_notification(
            user_ids=[target.id],
            title='حسابك قيد المراجعة' if target.language == 'ar' else 'Your account is under review',
            message=(
                'تمت إعادة حسابك إلى قائمة المراجعة من قبل الإدارة.'
                if target.language == 'ar'
                else 'Your account has been placed back under review by the administration.'
            ),
            notification_type='info',
            content_type='user',
            object_id=target.id,
            created_by=current,
        )
        return Response(UserSerializer(target, context=self.get_serializer_context()).data)

    @action(
        detail=True, methods=['post'],
        url_path='dynamic-field-value/(?P<field_id>[^/.]+)/upload',
    )
    def upload_dynamic_field_value(self, request, pk=None, field_id=None):
        """Upload a file for one of the target user's branch dynamic fields."""
        try:
            target = self.get_object()
        except Exception:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        current = request.user
        if not current.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_403_FORBIDDEN)

        if current.id != target.id and not self._can_manage_doctor_action(current, target):
            return Response({'detail': 'Not permitted to update this user'}, status=status.HTTP_403_FORBIDDEN)

        try:
            field = BranchDynamicField.objects.get(pk=field_id, field_type='file')
        except (BranchDynamicField.DoesNotExist, ValueError):
            return Response({'detail': 'Dynamic field not found'}, status=status.HTTP_404_NOT_FOUND)

        if not target.branches.filter(id=field.branch_id).exists():
            return Response(
                {'detail': 'This field does not belong to a branch you are a member of'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uploaded_file = request.FILES.get('value_file')
        if not uploaded_file:
            return Response({'detail': 'value_file is required'}, status=status.HTTP_400_BAD_REQUEST)

        value, _ = UserDynamicFieldValue.objects.update_or_create(
            user=target, field=field, defaults={'value_file': uploaded_file, 'updated_by': current},
        )
        return Response(UserDynamicFieldValueSerializer(value).data)

    @action(detail=False, methods=['get', 'put', 'patch', 'delete'], url_path='me', permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Get, update, or soft-delete the current user.
        """
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = self.get_serializer(user, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        elif request.method == 'DELETE':
            user.delete()
            return Response(
                {'detail': 'Account deleted successfully.'},
                status=status.HTTP_204_NO_CONTENT,
            )

    @action(detail=False, methods=['post'], url_path='update-fcm-token', permission_classes=[permissions.IsAuthenticated])
    def update_fcm_token(self, request):
        """
        Update the FCM token for the current user.
        """
        token = request.data.get('fcm_token')
        if not token:
            return Response({'error': 'fcm_token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        user.fcm_token = token
        user.save(update_fields=['fcm_token'])
        
        return Response({'status': 'success', 'message': 'FCM token updated'}, status=status.HTTP_200_OK)

class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user, context={"request": self.request})
        
        return Response(serializer.data)
