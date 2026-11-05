from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from niqabaty.models import User
from .factories import create_doctor


class AccountDeletionAnonymizationTests(TestCase):
    """Deleting an account wipes personal data and kills every session."""

    def setUp(self):
        self.client = APIClient()
        self.doctor = create_doctor(username="anon_doc")
        self.doctor.first_name_field = "Ahmed"
        self.doctor.family_name = "Ali"
        self.doctor.phone_number = "0913334444"
        self.doctor.address = "Tripoli street 1"
        self.doctor.bio = "Cardiologist"
        self.doctor.email_verified = True
        self.doctor.save()

    def test_delete_wipes_personal_fields(self):
        self.doctor.delete()

        db_user = User.all_objects.get(id=self.doctor.id)
        self.assertTrue(db_user.is_deleted)
        self.assertFalse(db_user.is_active)
        self.assertEqual(db_user.full_name, "Deleted account")
        self.assertIsNone(db_user.first_name_field)
        self.assertIsNone(db_user.family_name)
        self.assertIsNone(db_user.email)
        self.assertIsNone(db_user.phone_number)
        self.assertEqual(db_user.address, "")
        self.assertEqual(db_user.bio, "")
        self.assertTrue(db_user.username.startswith(f"deleted_{db_user.id}_"))
        self.assertFalse(db_user.has_usable_password())

    def test_delete_removes_history_with_personal_data(self):
        self.doctor.delete()

        db_user = User.all_objects.get(id=self.doctor.id)
        history = list(db_user.history.all())
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0].full_name, "Deleted account")
        self.assertIsNone(history[0].email)

    def test_refresh_token_of_deleted_account_returns_401(self):
        refresh = RefreshToken.for_user(self.doctor)
        self.doctor.delete()

        response = self.client.post(
            "/api/auth/token/refresh/", {"refresh": str(refresh)}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_blacklists_outstanding_refresh_tokens(self):
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

        RefreshToken.for_user(self.doctor)
        RefreshToken.for_user(self.doctor)
        self.doctor.delete()

        self.assertEqual(
            BlacklistedToken.objects.filter(token__user_id=self.doctor.id).count(), 2
        )

    def test_old_email_and_phone_can_register_again(self):
        self.doctor.delete()

        new_user = User.objects.create_user(
            username="anon_doc_again",
            email="anon_doc@test.com",
            phone_number="0913334444",
            password="NewPass!2345",
            user_type="doctor",
        )
        self.assertTrue(User.objects.filter(id=new_user.id).exists())


class ChangePasswordTests(TestCase):
    url = "/api/auth/change-password/"

    def setUp(self):
        self.client = APIClient()
        self.doctor = create_doctor(username="pw_doc")
        self.client.force_authenticate(user=self.doctor)

    def test_change_password_success(self):
        response = self.client.post(self.url, {
            "current_password": "testpass123",
            "new_password": "Str0ng!Passw0rd",
            "confirm_password": "Str0ng!Passw0rd",
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.doctor.refresh_from_db()
        self.assertTrue(self.doctor.check_password("Str0ng!Passw0rd"))

    def test_wrong_current_password(self):
        response = self.client.post(self.url, {
            "current_password": "wrong",
            "new_password": "Str0ng!Passw0rd",
            "confirm_password": "Str0ng!Passw0rd",
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.doctor.refresh_from_db()
        self.assertTrue(self.doctor.check_password("testpass123"))

    def test_mismatched_confirmation(self):
        response = self.client.post(self.url, {
            "current_password": "testpass123",
            "new_password": "Str0ng!Passw0rd",
            "confirm_password": "Different!123",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_weak_password_rejected(self):
        response = self.client.post(self.url, {
            "current_password": "testpass123",
            "new_password": "123",
            "confirm_password": "123",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SessionLifetimeTests(TestCase):
    def test_access_token_lasts_an_hour(self):
        # One minute made every request after a short pause fail with 401
        # first, and resending an upload after that failed.
        from datetime import timedelta
        from django.conf import settings
        self.assertEqual(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'], timedelta(minutes=60))
