from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from .factories import create_doctor

WEAK = "11223344"


class PasswordErrorCodesTests(TestCase):
    """A rejected new password comes back as plain text plus validator codes."""

    def setUp(self):
        self.client = APIClient()
        self.doctor = create_doctor(username="codes_doc")

    def _assert_weak_password_response(self, response):
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_too_common", response.data["codes"])
        self.assertIn("password_entirely_numeric", response.data["codes"])
        self.assertNotIn("[", response.data["error"])

    def test_reset_password_returns_codes(self):
        self.doctor.verification_code = "123456"
        self.doctor.verification_code_created = timezone.now()
        self.doctor.save()
        response = self.client.post("/api/auth/confirm-password-reset/", {
            "user_id": self.doctor.id,
            "code": "123456",
            "new_password": WEAK,
            "confirm_password": WEAK,
        }, format="json")
        self._assert_weak_password_response(response)

    def test_change_password_returns_codes(self):
        self.client.force_authenticate(user=self.doctor)
        response = self.client.post("/api/auth/change-password/", {
            "current_password": "testpass123",
            "new_password": WEAK,
            "confirm_password": WEAK,
        }, format="json")
        self._assert_weak_password_response(response)
