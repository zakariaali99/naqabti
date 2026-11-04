from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from niqabaty.models.medical_report import MedicalReport
from .factories import create_doctor, create_manager

User = get_user_model()


class MedicalReportPDFExportTests(APITestCase):
    """Tests for the medical reports PDF export feature."""

    def setUp(self):
        self.doctor = create_doctor(username="dr_test")
        self.manager = create_manager(username="manager_test")
        
        self.report = MedicalReport.objects.create(
            doctor=self.doctor,
            patient_name="John Doe",
            patient_id="ID123456",
            diagnosis="Common cold",
            treatment="Rest and fluids",
            recommendations="Drink plenty of water",
            notes="Follow up in 3 days"
        )

    def test_export_pdf_authorized(self):
        """Test that an authorized doctor can export their report as a PDF."""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.get(f"/api/medical-reports/{self.report.id}/export_pdf/")
        
        # Either PDF bytes are returned or fallback occurs
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(response.has_header('Content-Disposition'))
        self.assertIn(f"medical_report_{self.report.id}", response['Content-Disposition'])

    def test_export_pdf_unauthorized(self):
        """Test that unauthenticated requests are rejected."""
        response = self.client.get(f"/api/medical-reports/{self.report.id}/export_pdf/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
