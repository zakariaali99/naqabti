from datetime import timedelta

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from niqabaty.models import Device, User
from .factories import create_doctor, create_superuser


class DeletionRequestTests(TestCase):
    """A member's delete only files a request; staff erase or cancel it."""

    def setUp(self):
        self.client = APIClient()
        self.doctor = create_doctor(username="leaving_doc")
        self.doctor.email = "leaving@example.com"
        self.doctor.phone_number = "0915556666"
        self.doctor.email_verified = True
        self.doctor.save()
        self.admin = create_superuser(username="root_admin")

    def _request_deletion(self):
        self.client.force_authenticate(self.doctor)
        response = self.client.delete(f"/api/users/{self.doctor.id}/")
        self.client.force_authenticate(None)
        self.doctor.refresh_from_db()
        return response

    def test_member_delete_files_request_and_keeps_data(self):
        Device.objects.create(user=self.doctor, fcm_token="device-token")

        response = self._request_deletion()

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertIsNotNone(self.doctor.deletion_requested_at)
        self.assertEqual(
            self.doctor.deletion_due_at,
            self.doctor.deletion_requested_at + timedelta(days=30),
        )
        self.assertFalse(self.doctor.is_active)
        self.assertFalse(self.doctor.is_deleted)
        self.assertEqual(self.doctor.email, "leaving@example.com")
        self.assertFalse(Device.objects.filter(user=self.doctor).exists())

    def test_users_me_delete_files_request(self):
        self.client.force_authenticate(self.doctor)
        response = self.client.delete("/api/users/me/")

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.doctor.refresh_from_db()
        self.assertIsNotNone(self.doctor.deletion_requested_at)
        self.assertFalse(self.doctor.is_deleted)

    def test_login_is_refused_while_request_is_pending(self):
        self._request_deletion()

        response = self.client.post(
            "/api/auth/login/",
            {"username": "leaving_doc", "password": "testpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("deletion_requested", response.data)

    def test_staff_list_pending_requests(self):
        create_doctor(username="staying_doc")
        self._request_deletion()

        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/users/", {"deletion_requested": "true"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual([u["id"] for u in results], [self.doctor.id])
        self.assertIsNotNone(results[0]["deletion_due_at"])

    def test_staff_cancel_restores_the_account(self):
        self._request_deletion()

        self.client.force_authenticate(self.admin)
        response = self.client.post(f"/api/users/{self.doctor.id}/cancel_deletion/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.doctor.refresh_from_db()
        self.assertIsNone(self.doctor.deletion_requested_at)
        self.assertTrue(self.doctor.is_active)

        self.client.force_authenticate(None)
        login = self.client.post(
            "/api/auth/login/",
            {"username": "leaving_doc", "password": "testpass123"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_staff_final_delete_anonymizes(self):
        self._request_deletion()

        self.client.force_authenticate(self.admin)
        response = self.client.delete(f"/api/users/{self.doctor.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        erased = User.all_objects.get(id=self.doctor.id)
        self.assertTrue(erased.is_deleted)
        self.assertIsNone(erased.email)
        self.assertIsNone(erased.phone_number)

    def test_member_cannot_cancel_or_erase(self):
        self._request_deletion()
        other = create_doctor(username="other_doc")

        self.client.force_authenticate(other)
        cancel = self.client.post(f"/api/users/{self.doctor.id}/cancel_deletion/")
        self.assertIn(cancel.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))

        erase = self.client.delete(f"/api/users/{self.doctor.id}/")
        self.assertIn(erase.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))
        self.doctor.refresh_from_db()
        self.assertFalse(self.doctor.is_deleted)
