from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from niqabaty.utils.email_utils import is_verification_code_valid
from .factories import create_doctor


class PasswordResetCodeLifetimeTests(TestCase):
    """Reset codes expire after 30 minutes; email codes keep 24 hours."""

    def setUp(self):
        self.client = APIClient()
        self.doctor = create_doctor(username="reset_doc")
        self.doctor.verification_code = "123456"

    def _age_code(self, minutes):
        self.doctor.verification_code_created = timezone.now() - timedelta(minutes=minutes)
        self.doctor.save()

    def _confirm(self):
        return self.client.post(
            "/api/auth/confirm-password-reset/",
            {
                "user_id": self.doctor.id,
                "code": "123456",
                "new_password": "NewPass2026z",
                "confirm_password": "NewPass2026z",
            },
            format="json",
        )

    def test_fresh_reset_code_is_accepted(self):
        self._age_code(10)
        self.assertEqual(self._confirm().status_code, status.HTTP_200_OK)

    def test_reset_code_older_than_30_minutes_is_rejected(self):
        self._age_code(31)
        response = self._confirm()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("expired", response.data["error"])

    def test_email_verification_code_still_lasts_a_day(self):
        self._age_code(60 * 5)
        self.assertTrue(is_verification_code_valid(self.doctor))
