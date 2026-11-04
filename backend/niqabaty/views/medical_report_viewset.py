import os
import logging
from datetime import datetime

import django_filters
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import pdfkit

from niqabaty.models.medical_report import MedicalReport
from niqabaty.serializers.medical_report import MedicalReportSerializer


class MedicalReportFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name='report_date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='report_date', lookup_expr='lte')

    class Meta:
        model = MedicalReport
        fields = ['doctor', 'document_status']

logger = logging.getLogger(__name__)


class IsManagerOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and (request.user.is_staff or getattr(request.user, 'user_type', None) == 'manager')
        )


class MedicalReportViewSet(viewsets.ModelViewSet):
    queryset = MedicalReport.objects.all()
    serializer_class = MedicalReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MedicalReportFilter
    search_fields = ['patient_name', 'patient_id', 'diagnosis']
    ordering_fields = ['report_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'user_type', None) == 'manager':
            return MedicalReport.objects.all()
        return MedicalReport.objects.filter(doctor=user)

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrStaff])
    def approve_document(self, request, pk=None):
        report = self.get_object()

        if report.document_status != 'pending':
            return Response(
                {'error': 'Report is not in pending status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If there is a pending document, promote it to the active document
        if report.pending_document:
            if report.document:
                report.document.delete(save=False)
            report.document = report.pending_document
            report.pending_document = None

        report.document_status = 'approved'
        report.approved_by = request.user
        report.approved_at = timezone.now()
        report.save()

        return Response(
            MedicalReportSerializer(report, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrStaff])
    def reject_document(self, request, pk=None):
        report = self.get_object()

        if report.document_status != 'pending':
            return Response(
                {'error': 'Report is not in pending status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if report.pending_document:
            report.pending_document.delete(save=False)
            report.pending_document = None

        report.document_status = 'rejected'
        report.save()

        return Response(
            MedicalReportSerializer(report, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'])
    def download_pending(self, request, pk=None):
        report = self.get_object()
        user = request.user

        # Only the doctor who owns the report or a manager/staff can download the pending doc
        is_manager = user.is_staff or getattr(user, 'user_type', None) == 'manager'
        if not is_manager and report.doctor != user:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        if not report.pending_document:
            return Response(
                {'error': 'No pending document attached to this report.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            file_path = report.pending_document.path
            with open(file_path, 'rb') as f:
                response = HttpResponse(f.read(), content_type='application/octet-stream')
                filename = os.path.basename(report.pending_document.name)
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
        except (FileNotFoundError, ValueError) as e:
            logger.error(f"Pending document file not found for report {report.id}: {e}")
            return Response(
                {'error': 'Pending document file not found on server.'},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        report = self.get_object()
        doctor = report.doctor

        context = {
            'report': report,
            'report_date': report.report_date.strftime('%Y-%m-%d') if report.report_date else '-',
            'doctor_name': doctor.get_full_name() or doctor.username,
            'doctor_specialty': doctor.specialty or '',
            'doctor_phone': doctor.phone_number or '',
            'patient_name': report.patient_name,
            'patient_id': report.patient_id or '',
            'diagnosis': report.diagnosis or '',
            'treatment': report.treatment or '',
            'recommendations': report.recommendations or '',
            'notes': report.notes or '',
            'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M'),
        }

        try:
            html = render_to_string('medical_report_pdf.html', context)

            options = {
                'page-size': 'A4',
                'margin-top': '15mm',
                'margin-bottom': '15mm',
                'margin-left': '18mm',
                'margin-right': '18mm',
                'encoding': 'UTF-8',
                'no-outline': None,
                'stop-slow-scripts': None,
                'javascript-delay': '3000',
            }

            config = pdfkit.configuration(wkhtmltopdf=settings.WKHTMLTOPDF_BIN)
            pdf_bytes = pdfkit.from_string(html, False, options=options, configuration=config)

            filename = f"medical_report_{report.id}_{report.report_date}.pdf"
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            logger.exception(f"PDF generation failed for report {report.id}")

            if report.document:
                try:
                    file_path = report.document.path
                    with open(file_path, 'rb') as f:
                        response = HttpResponse(f.read(), content_type='application/octet-stream')
                        filename = os.path.basename(report.document.name)
                        response['Content-Disposition'] = f'attachment; filename="{filename}"'
                        return response
                except (FileNotFoundError, ValueError) as doc_error:
                    logger.error(f"Fallback document also not found for report {report.id}: {doc_error}")

            return Response(
                {'error': 'Failed to generate PDF. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        report = self.get_object()
        if not report.document:
            return Response(
                {'error': 'No document attached to this report.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            file_path = report.document.path
            with open(file_path, 'rb') as f:
                response = HttpResponse(f.read(), content_type='application/octet-stream')
                filename = os.path.basename(report.document.name)
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
        except (FileNotFoundError, ValueError) as e:
            logger.error(f"Document file not found for report {report.id}: {e}")
            return Response(
                {'error': 'Document file not found on server.'},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = self.request.user
        queryset = self.get_queryset()

        return Response({
            'total_reports': queryset.count(),
            'recent_reports': MedicalReportSerializer(
                queryset.order_by('-created_at')[:5],
                many=True,
                context={'request': request}
            ).data
        })
