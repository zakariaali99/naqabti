from rest_framework import viewsets, status, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.http import HttpResponse
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill
from niqabaty.models import (
    ProfessionalDevelopment,
    ProfessionalDevelopmentType,
    ProfessionalDevelopmentCategory,
    ProfessionalDevelopmentRegistration,
    Payment
)
from niqabaty.serializers.professional_development import (
    ProfessionalDevelopmentSerializer,
    ProfessionalDevelopmentTypeSerializer,
    ProfessionalDevelopmentCategorySerializer,
    ProfessionalDevelopmentRegistrationSerializer
)

class ProfessionalDevelopmentTypeViewSet(viewsets.ModelViewSet):
    queryset = ProfessionalDevelopmentType.objects.all()
    serializer_class = ProfessionalDevelopmentTypeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

class ProfessionalDevelopmentCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProfessionalDevelopmentCategory.objects.all()
    serializer_class = ProfessionalDevelopmentCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

class ProfessionalDevelopmentViewSet(viewsets.ModelViewSet):
    queryset = ProfessionalDevelopment.objects.all()
    serializer_class = ProfessionalDevelopmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    filterset_fields = ['status', 'type', 'category']
    ordering_fields = ['date_from', 'date_to', 'created_at', 'title']
    ordering = ['-date_from']

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        type_param = self.request.query_params.get('type')
        category_param = self.request.query_params.get('category')
        search_param = self.request.query_params.get('search')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if type_param:
            queryset = queryset.filter(type_id=type_param)
        if category_param:
            queryset = queryset.filter(category_id=category_param)
        if search_param:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(title__icontains=search_param) | 
                Q(content__icontains=search_param)
            )
        if date_from:
            queryset = queryset.filter(date_from__gte=date_from)
        if date_to:
            queryset = queryset.filter(date_to__lte=date_to)

        return queryset.order_by('-date_from')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def register(self, request, pk=None):
        pd = self.get_object()
        user = request.user

        if not pd.can_register:
            return Response(
                {'error': 'Registration is closed for this event.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check all_objects because soft-deleted records still trigger the DB unique constraint
        existing = ProfessionalDevelopmentRegistration.all_objects.filter(doctor=user, professional_development=pd).first()
        if existing:
            if not existing.is_deleted:
                return Response(
                    {'error': 'You are already registered for this event.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # Restore the soft-deleted registration
                existing.is_deleted = False
                existing.status = 'confirmed' if pd.price == 0 else 'pending'
                existing.payment_status = 'paid' if pd.price == 0 else 'pending'
                existing.save()
                serializer = ProfessionalDevelopmentRegistrationSerializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)

        with transaction.atomic():
            # Create registration
            registration = ProfessionalDevelopmentRegistration.objects.create(
                doctor=user,
                professional_development=pd,
                status='confirmed' if pd.price == 0 else 'pending',
                payment_status='paid' if pd.price == 0 else 'pending'
            )

            # Handle payment if price > 0
            if pd.price > 0:
                payment_method = request.data.get('payment_method', 'cash')
                Payment.objects.create(
                    user=user,
                    professional_development_registration=registration,
                    amount=pd.price,
                    payment_method=payment_method,
                    description=f"Registration for {pd.title}"
                )

            serializer = ProfessionalDevelopmentRegistrationSerializer(registration)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def registrations(self, request, pk=None):
        pd = self.get_object()
        registrations = ProfessionalDevelopmentRegistration.objects.filter(professional_development=pd).order_by('-created_at')
        
        page = self.paginate_queryset(registrations)
        if page is not None:
            serializer = ProfessionalDevelopmentRegistrationSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ProfessionalDevelopmentRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def export_registrations(self, request, pk=None):
        pd = self.get_object()
        registrations = ProfessionalDevelopmentRegistration.objects.filter(professional_development=pd).order_by('doctor__full_name')

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Registered Users"

        # Define styles
        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="4B5563", end_color="4B5563", fill_type="solid")
        center_alignment = Alignment(horizontal="center")

        # Define columns
        headers = [
            "Doctor Name", "Phone", "Email", "Specialty", 
            "Registration Date", "Status", "Total Paid", "Payment Status"
        ]
        
        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center_alignment
            ws.column_dimensions[openpyxl.utils.get_column_letter(col_num)].width = 20

        # Add data
        for row_num, reg in enumerate(registrations, 2):
            ws.cell(row=row_num, column=1, value=reg.doctor.full_name)
            ws.cell(row=row_num, column=2, value=reg.doctor.phone_number)
            ws.cell(row=row_num, column=3, value=reg.doctor.email)
            ws.cell(row=row_num, column=4, value=getattr(reg.doctor, 'specialty', '-'))
            ws.cell(row=row_num, column=5, value=reg.registration_date.strftime("%Y-%m-%d %H:%M"))
            ws.cell(row=row_num, column=6, value=reg.status)
            ws.cell(row=row_num, column=7, value=float(reg.paid_amount))
            ws.cell(row=row_num, column=8, value=reg.payment_status)

        # Prepare response
        response = HttpResponse(
            content_type='application/vnd.openpyxljs.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = f'attachment; filename="registrations_{pd.id}.xlsx"'
        wb.save(response)
        return response

    @action(detail=True, methods=['post'], url_path='add-registration', permission_classes=[permissions.IsAdminUser])
    def add_registration(self, request, pk=None):
        pd = self.get_object()
        doctor_id = request.data.get('doctor_id')
        
        if not doctor_id:
            return Response({'error': 'Doctor ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check all_objects because soft-deleted records still trigger the DB unique constraint
        existing = ProfessionalDevelopmentRegistration.all_objects.filter(doctor_id=doctor_id, professional_development=pd).first()
        if existing:
            if not existing.is_deleted:
                return Response({'error': 'Doctor is already registered for this event.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Restore the soft-deleted registration
                existing.is_deleted = False
                existing.status = request.data.get('status', 'confirmed')
                existing.payment_status = request.data.get('payment_status', 'pending')
                existing.save()
                serializer = ProfessionalDevelopmentRegistrationSerializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)

        with transaction.atomic():
            registration = ProfessionalDevelopmentRegistration.objects.create(
                doctor_id=doctor_id,
                professional_development=pd,
                status=request.data.get('status', 'confirmed'),
                payment_status=request.data.get('payment_status', 'pending')
            )
            
            # Optional: Send notification if requested
            send_notification_flag = request.data.get('send_notification', False)
            if send_notification_flag:
                from niqabaty.utils.notifications import send_notification as trigger_notification
                trigger_notification(
                    user_ids=[doctor_id],
                    title=f"New Program Registration: {pd.title}",
                    message=f"You have been registered for {pd.title}. Status: {registration.status}",
                    notification_type='event',
                    content_type='professional_development',
                    object_id=pd.id,
                    created_by=request.user
                )

            serializer = ProfessionalDevelopmentRegistrationSerializer(registration)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class ProfessionalDevelopmentRegistrationViewSet(viewsets.ModelViewSet):
    serializer_class = ProfessionalDevelopmentRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return ProfessionalDevelopmentRegistration.objects.all()
        return ProfessionalDevelopmentRegistration.objects.filter(doctor=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def add_payment(self, request, pk=None):
        registration = self.get_object()
        amount = request.data.get('amount')
        payment_method = request.data.get('payment_method', 'cash')
        reference_number = request.data.get('reference_number')
        if not reference_number:
            reference_number = f"PD-{registration.professional_development.id}-{registration.id}"
        description = request.data.get('description', '')

        if not amount:
            return Response({'error': 'Amount is required.'}, status=status.HTTP_400_BAD_REQUEST)

        amount = float(amount)
        course_price = float(registration.professional_development.price)
        current_paid = float(registration.paid_amount)
        remaining = course_price - current_paid

        if amount > remaining:
            return Response(
                {'error': f'Amount exceeds remaining balance ({remaining}).'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            payment = Payment.objects.create(
                user=registration.doctor,
                professional_development_registration=registration,
                amount=amount,
                payment_method=payment_method,
                reference_number=reference_number,
                description=description or f"Payment for {registration.professional_development.title}"
            )
            registration.payment_records.add(payment)
            
            # The m2m_changed signal will handle update_payment_info()
            
            serializer = self.get_serializer(registration)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def send_notification(self, request, pk=None):
        registration = self.get_object()
        from niqabaty.utils.notifications import send_notification as trigger_notification
        
        trigger_notification(
            user_ids=[registration.doctor.id],
            title=f"Update: {registration.professional_development.title}",
            message=f"Regarding your registration for {registration.professional_development.title}. Status: {registration.status}",
            notification_type='event',
            content_type='professional_development',
            object_id=registration.professional_development.id,
            created_by=request.user
        )
        return Response({'status': 'notification sent'})
