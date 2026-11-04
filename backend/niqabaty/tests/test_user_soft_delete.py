from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from niqabaty.models import User, Device
from .factories import (
    create_branch,
    create_doctor,
    create_manager,
    create_superuser,
)


class UserSoftDeleteTests(TestCase):
    """Tests for user soft-delete functionality across model and API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.branch = create_branch(name="Test Branch", prefix="TBR")
        self.doctor = create_doctor(username="doctor_soft_del")
        self.doctor.phone_number = "0911234567"
        self.doctor.save()
        self.doctor.branches.add(self.branch)

        self.doctor_other = create_doctor(username="doctor_other_del")
        self.doctor_other.phone_number = "0917654321"
        self.doctor_other.save()
        self.doctor_other.branches.add(self.branch)

        self.admin = create_superuser(username="admin_soft_del")

    def test_model_soft_delete_marks_deleted_and_inactive(self):
        """User.delete() should mark is_deleted=True, is_active=False, and clear devices/FCM."""
        Device.objects.create(user=self.doctor, fcm_token="sample_token_123")
        self.doctor.fcm_token = "sample_token_123"
        self.doctor.save()

        user_id = self.doctor.id
        self.doctor.delete()

        # Should NOT exist in default manager (SoftDeleteManager)
        self.assertFalse(User.objects.filter(id=user_id).exists())

        # MUST still exist in database via all_objects
        db_user = User.all_objects.get(id=user_id)
        self.assertTrue(db_user.is_deleted)
        self.assertFalse(db_user.is_active)
        self.assertIsNone(db_user.fcm_token)
        self.assertFalse(Device.objects.filter(user_id=user_id).exists())

    def test_model_restore(self):
        """User.restore() should restore is_deleted=False and is_active=True."""
        user_id = self.doctor.id
        self.doctor.delete()
        self.assertFalse(User.objects.filter(id=user_id).exists())

        db_user = User.all_objects.get(id=user_id)
        db_user.restore()

        self.assertTrue(User.objects.filter(id=user_id).exists())
        restored = User.objects.get(id=user_id)
        self.assertFalse(restored.is_deleted)
        self.assertTrue(restored.is_active)

    def test_user_can_delete_own_account_via_destroy(self):
        """A user can delete their own account via DELETE /api/users/{id}/."""
        self.client.force_authenticate(user=self.doctor)

        response = self.client.delete(f"/api/users/{self.doctor.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Check in database
        db_user = User.all_objects.get(id=self.doctor.id)
        self.assertTrue(db_user.is_deleted)
        self.assertFalse(db_user.is_active)
        self.assertFalse(User.objects.filter(id=self.doctor.id).exists())

    def test_user_can_delete_own_account_via_me_endpoint(self):
        """A user can delete their own account via DELETE /api/users/me/."""
        self.client.force_authenticate(user=self.doctor)

        response = self.client.delete("/api/users/me/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        db_user = User.all_objects.get(id=self.doctor.id)
        self.assertTrue(db_user.is_deleted)
        self.assertFalse(db_user.is_active)
        self.assertFalse(User.objects.filter(id=self.doctor.id).exists())

    def test_user_cannot_delete_other_user_account(self):
        """A normal user cannot delete someone else's account."""
        self.client.force_authenticate(user=self.doctor)

        response = self.client.delete(f"/api/users/{self.doctor_other.id}/")
        # Since other user is not in get_queryset for self.doctor, it returns 404
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

        db_user = User.all_objects.get(id=self.doctor_other.id)
        self.assertFalse(db_user.is_deleted)
        self.assertTrue(db_user.is_active)

    def test_admin_can_delete_any_user(self):
        """Staff/admin can delete any user account via DELETE /api/users/{id}/."""
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(f"/api/users/{self.doctor.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        db_user = User.all_objects.get(id=self.doctor.id)
        self.assertTrue(db_user.is_deleted)

    def test_unauthenticated_cannot_delete(self):
        """Unauthenticated requests cannot delete any account."""
        response = self.client.delete(f"/api/users/{self.doctor.id}/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response_me = self.client.delete("/api/users/me/")
        self.assertEqual(response_me.status_code, status.HTTP_401_UNAUTHORIZED)
