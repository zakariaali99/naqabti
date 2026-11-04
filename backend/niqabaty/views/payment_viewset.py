import logging
import os

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from niqabaty.models import Payment
from niqabaty.serializers import PaymentSerializer
from niqabaty.utils.notifications import send_notification

logger = logging.getLogger(__name__)


def _guess_content_type(filename: str) -> str:
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    return {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
    }.get(ext, 'application/octet-stream')


class IsManagerOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and (request.user.is_staff or getattr(request.user, 'user_type', None) == 'manager')
        )

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['amount', 'payment_date', 'payment_method', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Payment.objects.select_related('user', 'membership').all()
        
        # If user is a doctor, only show their own payments
        if self.request.user.user_type == 'doctor':
            queryset = queryset.filter(user=self.request.user)
            return queryset.order_by('-payment_date', '-created_at')
        
        
        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            queryset = queryset.filter(user_id=doctor_id)
        
        # Filter by membership
        membership_id = self.request.query_params.get('membership_id')
        if membership_id:
            queryset = queryset.filter(membership_id=membership_id)
        
        # Filter by payment method
        payment_method = self.request.query_params.get('payment_method')
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        # Filter by payment date range
        payment_date_from = self.request.query_params.get('payment_date_from')
        if payment_date_from:
            queryset = queryset.filter(payment_date__gte=payment_date_from)
        
        payment_date_to = self.request.query_params.get('payment_date_to')
        if payment_date_to:
            queryset = queryset.filter(payment_date__lte=payment_date_to)
        
        # Filter by amount range
        amount_from = self.request.query_params.get('amount_from')
        if amount_from:
            queryset = queryset.filter(amount__gte=amount_from)
        
        amount_to = self.request.query_params.get('amount_to')
        if amount_to:
            queryset = queryset.filter(amount__lte=amount_to)
        
        # Filter by status
        payment_status = self.request.query_params.get('status')
        if payment_status:
            queryset = queryset.filter(status=payment_status)

        # Search in multiple fields
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(reference_number__icontains=search) |
                Q(description__icontains=search) |
                Q(user__full_name__icontains=search) |
                Q(user__phone_number__icontains=search) |
                Q(user__specialty__icontains=search) |
                Q(user__username__icontains=search)
            )
        
        return queryset.order_by('-payment_date', '-created_at')

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrStaff], url_path='approve')
    def approve_payment(self, request, pk=None):
        payment = self.get_object()
        if payment.status != 'pending':
            return Response({'error': 'Payment is not in pending status.'}, status=status.HTTP_400_BAD_REQUEST)
        payment.status = 'approved'
        payment.reviewed_by = request.user
        payment.reviewed_at = timezone.now()
        payment.save()
        return Response(PaymentSerializer(payment, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrStaff], url_path='reject')
    def reject_payment(self, request, pk=None):
        payment = self.get_object()
        if payment.status != 'pending':
            return Response({'error': 'Payment is not in pending status.'}, status=status.HTTP_400_BAD_REQUEST)
        payment.status = 'rejected'
        payment.reviewed_by = request.user
        payment.reviewed_at = timezone.now()
        payment.save()
        return Response(PaymentSerializer(payment, context={'request': request}).data)

    @action(detail=True, methods=['get'], url_path='download_document')
    def download_document(self, request, pk=None):
        payment = self.get_object()
        user = request.user
        is_manager = user.is_staff or getattr(user, 'user_type', None) == 'manager'
        if not is_manager and payment.user != user:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        if not payment.transaction_document:
            return Response({'error': 'No document attached to this payment.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            file_path = payment.transaction_document.path
            with open(file_path, 'rb') as f:
                filename = os.path.basename(payment.transaction_document.name)
                content_type = _guess_content_type(filename)
                response = HttpResponse(f.read(), content_type=content_type)
                response['Content-Disposition'] = f'inline; filename="{filename}"'
                return response
        except (FileNotFoundError, ValueError) as e:
            logger.error(f"Transaction document not found for payment {payment.id}: {e}")
            return Response({'error': 'Document file not found on server.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def send_notification_action(self, request, pk=None):
        """
        Send a notification to the user associated with this payment.
        """
        payment = self.get_object()
        title = request.data.get('title', "Payment Notification")
        message = request.data.get('message')
        notification_type = request.data.get('notification_type', 'info')

        if not message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

        success, message_or_error = send_notification(
            user_ids=[payment.user.id],
            title=title,
            message=message,
            notification_type=notification_type,
            content_type='payment',
            object_id=payment.id,
            created_by=request.user
        )

        if success:
            return Response({'status': 'success', 'message': message_or_error})
        else:
            return Response({'error': message_or_error}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='export_pdf')
    def export_pdf(self, request, pk=None):
        """
        Export a payment receipt/invoice to PDF.
        """
        import pdfkit
        from django.template.loader import render_to_string
        from django.conf import settings
        
        payment = self.get_object()
        user = request.user
        
        # Check permissions
        is_manager = user.is_staff or getattr(user, 'user_type', None) == 'manager'
        if not is_manager and payment.user != user:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        context = {
            'payment': payment,
            'generated_at': timezone.now().strftime('%Y-%m-%d %H:%M'),
        }

        try:
            html = render_to_string('payment_invoice_pdf.html', context)

            options = {
                'page-size': 'A4',
                'margin-top': '10mm',
                'margin-bottom': '10mm',
                'margin-left': '10mm',
                'margin-right': '10mm',
                'encoding': 'UTF-8',
                'no-outline': None,
            }

            config = pdfkit.configuration(wkhtmltopdf=settings.WKHTMLTOPDF_BIN)
            pdf_bytes = pdfkit.from_string(html, False, options=options, configuration=config)

            filename = f"payment_receipt_{payment.id}.pdf"
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            logger.error(f"PDF generation failed for payment {payment.id}: {e}")
            return Response(
                {'error': 'Failed to generate PDF invoice. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
