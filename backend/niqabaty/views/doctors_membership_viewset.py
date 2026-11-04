from decimal import Decimal

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db.models import Q
from niqabaty.models import DoctorsMembership, MembershipType, Payment, DoctorsMembershipRenewHistory, Branch
from niqabaty.serializers import DoctorsMembershipSerializer, PaymentSerializer, DoctorsMembershipRenewHistorySerializer
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from niqabaty.utils.notifications import send_notification

User = get_user_model()

class DoctorsMembershipViewSet(viewsets.ModelViewSet):
    queryset = DoctorsMembership.objects.all()
    serializer_class = DoctorsMembershipSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['start_date', 'end_date', 'total_amount', 'status', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def _degree_validation_error(self, doctor, membership_type, subscription_count):
        """Return a user-facing error message if the membership type or
        subscription count aren't compatible with the doctor's academic
        degree, else None."""
        if not doctor or not membership_type:
            return None

        if (
            membership_type.academic_degree_id
            and membership_type.academic_degree_id != doctor.current_degree_id
        ):
            return "This membership type is not available for the doctor's academic degree."

        degree = doctor.current_degree
        if subscription_count and subscription_count > 1 and not (
            degree and degree.allows_multiple_subscriptions
        ):
            return "The doctor's academic degree does not allow multiple subscription periods."

        return None
    
    def get_queryset(self):
        """
        Filter memberships by:
        - search: name, email, phone, username, specialty, membership_number
        - doctor_id: filter by doctor ID
        - start_date_from, start_date_to: start date range
        - end_date_from, end_date_to: end date range
        - status: membership status
        - membership_type: membership type ID
        
        Branch-based filtering:
        - Superusers can see all memberships
        - Managers/institutions can only see memberships from their branches
        """
        queryset = super().get_queryset().select_related('doctor', 'membership_type', 'branch')
        
        current_user = self.request.user
        if current_user.is_authenticated:
            if getattr(current_user, 'user_type', '') == 'doctor':
                # Doctors only see their own memberships
                queryset = queryset.filter(doctor=current_user)
            elif not current_user.is_superuser:
                # Branch-based filtering for managers/institutions
                # 1. Branches where user is assigned as manager via Branch.manager
                managed_branches = Branch.objects.filter(manager=current_user)
                
                # 2. Branches the user belongs to via User.branches
                user_branches = current_user.branches.all()
                
                # Combine both and get unique branch IDs
                allowed_branch_ids = set(
                    list(managed_branches.values_list('id', flat=True)) +
                    list(user_branches.values_list('id', flat=True))
                )
                
                if allowed_branch_ids:
                    # Filter by allowed branches
                    queryset = queryset.filter(branch_id__in=allowed_branch_ids)
                else:
                    # User has no branch association, return empty queryset
                    queryset = queryset.none()
        else:
            return DoctorsMembership.objects.none()
        
        # Doctor ID filter
        doctor_id = self.request.query_params.get('doctor_id', '').strip()
        if doctor_id:
            try:
                queryset = queryset.filter(doctor_id=int(doctor_id))
            except (ValueError, TypeError):
                pass
        
        # Search across multiple fields
        search_query = self.request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(doctor__full_name__icontains=search_query) |
                Q(doctor__email__icontains=search_query) |
                Q(doctor__phone_number__icontains=search_query) |
                Q(doctor__username__icontains=search_query) |
                Q(doctor__specialty__icontains=search_query) |
                Q(membership_number__icontains=search_query)
            )
        
        # Start date range filter
        start_date_from = self.request.query_params.get('start_date_from', '').strip()
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        
        start_date_to = self.request.query_params.get('start_date_to', '').strip()
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)
        
        # End date range filter
        end_date_from = self.request.query_params.get('end_date_from', '').strip()
        if end_date_from:
            queryset = queryset.filter(end_date__gte=end_date_from)
        
        end_date_to = self.request.query_params.get('end_date_to', '').strip()
        if end_date_to:
            queryset = queryset.filter(end_date__lte=end_date_to)
        
        # Status filter
        status_filter = self.request.query_params.get('status', '').strip()
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Membership type filter
        membership_type = self.request.query_params.get('membership_type', '').strip()
        if membership_type:
            try:
                queryset = queryset.filter(membership_type=int(membership_type))
            except (ValueError, TypeError):
                pass
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Create a new doctors membership.
        If doctor data is provided, create or update the user first.
        """
        data = request.data.copy()
        
        # Check if user data is provided to create/update doctor
        user_data = data.pop('user_data', None)
        doctor_id = data.get('doctor_id') or data.get('doctor')
        
        if user_data:
            # Create or update doctor user
            if doctor_id and doctor_id != 0:
                # Update existing user
                try:
                    doctor = User.objects.get(id=doctor_id, user_type='doctor')
                    for field, value in user_data.items():
                        if hasattr(doctor, field):
                            setattr(doctor, field, value)
                    doctor.save()
                except User.DoesNotExist:
                    return Response(
                        {'error': 'Doctor not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # Create new doctor user
                user_data['user_type'] = 'doctor'
                doctor = User.objects.create_user(**user_data)
                data['doctor_id'] = doctor.id
        
        # Normalize IDs for serializer (source mapping)
        if 'doctor' in data and 'doctor_id' not in data:
            data['doctor_id'] = data['doctor']
        if 'membership_type' in data and 'membership_type_id' not in data:
            data['membership_type_id'] = data['membership_type']
        if 'branch' in data and 'branch_id' not in data:
            data['branch_id'] = data['branch']

        # Check for existing active membership
        final_doctor_id = data.get('doctor_id')
        if final_doctor_id and int(final_doctor_id) != 0:
            if DoctorsMembership.objects.filter(doctor=final_doctor_id, status='active').exists():
                return Response(
                    {'error': 'Doctor already has an active membership'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            membership_type_id = data.get('membership_type_id')
            if membership_type_id:
                doctor_obj = User.objects.filter(id=final_doctor_id).first()
                membership_type_obj = MembershipType.objects.filter(id=membership_type_id).first()
                subscription_count = int(data.get('subscription_count') or 1)
                error = self._degree_validation_error(doctor_obj, membership_type_obj, subscription_count)
                if error:
                    return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

        # Create the membership
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        from django.utils import timezone
        
        # Save membership first
        membership = serializer.save(created_by=self.request.user)
        
        payment_method = self.request.data.get('payment_method')
        if payment_method:
            reference_number = self.request.data.get('reference_number', '')
            invoice_file = self.request.FILES.get('invoice_file')
            
            # Create payment record
            Payment.objects.create(
                user=membership.doctor,
                membership=membership,
                amount=membership.total_amount,
                payment_method=payment_method,
                reference_number=reference_number,
                invoice_file=invoice_file,
                status='approved',
                reviewed_by=self.request.user,
                reviewed_at=timezone.now()
            )
            # Update membership status to active and payment_status to paid
            membership.status = 'active'
            membership.is_active = True
            membership.paid_amount = membership.total_amount
            membership.payment_status = 'paid'
            membership.save(update_fields=['status', 'is_active', 'paid_amount', 'payment_status'])

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        serializer.save(updated_by=self.request.user)
        instance = serializer.instance

        if old_status != 'active' and instance.status == 'active':
            total = float(instance.total_amount or 0)
            paid = float(instance.paid_amount or 0)
            remaining = total - paid
            send_notification(
                user_ids=[instance.doctor.id],
                title="تمت الموافقة على طلب عضويتك",
                message=(
                    f"مرحباً {instance.doctor.full_name}، تمت الموافقة على طلب انضمامك "
                    f"بعضوية {instance.membership_type.name}. يرجى إتمام دفع رسوم "
                    f"العضوية ({remaining:.2f} LYD) لتفعيل عضويتك بالكامل."
                ),
                notification_type='success',
                content_type='membership',
                object_id=instance.id,
                created_by=self.request.user,
                source='system',
            )
    
    def update(self, request, *args, **kwargs):
        """
        Update doctors membership.
        If doctor data is provided, update the user information too.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        
        # Normalize IDs for serializer
        if 'doctor' in data and 'doctor_id' not in data:
            data['doctor_id'] = data['doctor']
        if 'membership_type' in data and 'membership_type_id' not in data:
            data['membership_type_id'] = data['membership_type']
        if 'branch' in data and 'branch_id' not in data:
            data['branch_id'] = data['branch']

        # Check if doctor is being changed
        new_doctor_id = data.get('doctor_id') or data.get('doctor')
        if new_doctor_id and int(new_doctor_id) != instance.doctor.id:
            # Check conditions to prevent change
            if instance.status == 'active':
                raise ValidationError("Cannot change doctor for an active membership.")
            
            if instance.payments.exists():
                raise ValidationError("Cannot change doctor for a membership with payments.")
                
            if instance.renew_history.exists():
                raise ValidationError("Cannot change doctor for a membership with renewal history.")

        # Check if user data is provided to update doctor
        user_data = data.pop('user_data', None)
        
        if user_data and instance.doctor:
            # Update doctor user information
            doctor = instance.doctor
            for field, value in user_data.items():
                if hasattr(doctor, field):
                    setattr(doctor, field, value)
            doctor.save()

        # Validate the effective doctor/membership type/subscription count
        # (whichever of these are being changed, falling back to the
        # existing instance) against the doctor's academic degree.
        effective_doctor_id = new_doctor_id or instance.doctor_id
        effective_doctor = (
            User.objects.filter(id=effective_doctor_id).first()
            if new_doctor_id else instance.doctor
        )
        membership_type_id = data.get('membership_type_id')
        effective_membership_type = (
            MembershipType.objects.filter(id=membership_type_id).first()
            if membership_type_id else instance.membership_type
        )
        effective_subscription_count = int(
            data.get('subscription_count') or instance.subscription_count or 1
        )
        error = self._degree_validation_error(
            effective_doctor, effective_membership_type, effective_subscription_count
        )
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

        # Update the membership
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
            
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """
        Add a payment to a membership.
        Expected payload: { amount, payment_method, reference_number?, description? }
        """
        membership = self.get_object()
        
        # Validate payment amount
        amount = request.data.get('amount')
        if not amount:
            return Response(
                {'error': 'Payment amount is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = Decimal(str(amount))
            if amount <= Decimal('0'):
                return Response(
                    {'error': 'Payment amount must be greater than zero'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception:
            return Response(
                {'error': 'Invalid payment amount'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create payment record
        payment_data = {
            'user_id': membership.doctor.id,
            'membership_id': membership.id,
            'amount': amount,
            'payment_method': request.data.get('payment_method', 'cash'),
            'reference_number': request.data.get('reference_number', ''),
            'description': request.data.get('description', ''),
        }
        if 'upload_document' in request.FILES:
            payment_data['upload_document'] = request.FILES['upload_document']
        
        payment_serializer = PaymentSerializer(data=payment_data)
        if payment_serializer.is_valid():
            payment_serializer.save()
            
            # Refresh membership to get updated payment status
            membership.refresh_from_db()

            # Distribute payment to renewal histories (Oldest first)
            remaining_payment = amount
            
            # Get unpaid/partial histories ordered by date (oldest first)
            renew_histories = membership.renew_history.filter(
                payment_status__in=['unpaid', 'partial']
            ).order_by('renew_date')
            
            for history in renew_histories:
                if remaining_payment <= 0:
                    break
                    
                history_remaining = history.remaining_amount
                if history_remaining > 0:
                    to_pay = min(remaining_payment, history_remaining)
                    history.paid_amount += to_pay
                    history.save() # Updates status
                    remaining_payment -= to_pay
            
            # Return updated membership with payment info
            serializer = self.get_serializer(membership)
            return Response({
                'membership': serializer.data,
                'payment': payment_serializer.data,
                'message': 'Payment added successfully'
            }, status=status.HTTP_201_CREATED)
        
        return Response(payment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a membership.
        """
        membership = self.get_object()
        if membership.status == 'canceled':
             return Response(
                {'error': 'Membership is already canceled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        membership.status = 'canceled'
        membership.is_active = False
        membership.save()
        
        serializer = self.get_serializer(membership)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def send_notification_action(self, request, pk=None):
        """
        Send a notification to the doctor associated with this membership.
        """
        membership = self.get_object()
        title = request.data.get('title', "Membership Notification")
        message = request.data.get('message')
        notification_type = request.data.get('notification_type', 'info')

        if not message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

        success, message_or_error = send_notification(
            user_ids=[membership.doctor.id],
            title=title,
            message=message,
            notification_type=notification_type,
            content_type='membership',
            object_id=membership.id,
            created_by=request.user
        )

        if success:
            return Response({'status': 'success', 'message': message_or_error})
        else:
            return Response({'error': message_or_error}, status=status.HTTP_400_BAD_REQUEST)
    
class DoctorsMembershipRenewHistoryViewSet(viewsets.ModelViewSet):
    queryset = DoctorsMembershipRenewHistory.objects.all()
    serializer_class = DoctorsMembershipRenewHistorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['membership']
    ordering_fields = ['renew_date']

    def perform_create(self, serializer):
        history = serializer.save()
        membership = history.membership
        # Update membership end date and status
        membership.end_date = history.new_end_date
        membership.status = 'active'
        membership.is_active = True
        membership.save(update_fields=['end_date', 'status', 'is_active'])
        # Recalculate and persist payment status (considers renew histories)
        _ = membership.remaining_amount
