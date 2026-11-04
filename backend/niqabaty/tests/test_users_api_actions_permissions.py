from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .factories import (
    create_branch,
    create_doctor,
    create_manager,
    create_superuser,
    grant_user_change_permission,
)


class UsersApiActionPermissionsTests(TestCase):
    """Tests for users API endpoint action-level permissions (toggle_active, verify_email)."""

    def setUp(self):
        """Set up test data: two branches, doctors, and a manager assigned to one branch."""
        self.client = APIClient()
        self.branch_a = create_branch(name="Branch A", prefix="UAA")
        self.branch_b = create_branch(name="Branch B", prefix="UAB")
        self.branch_c = create_branch(name="Branch C", prefix="UAC")

        self.doctor_a = create_doctor(username="doctor_action_a")
        self.doctor_a.branches.add(self.branch_a)

        self.doctor_b = create_doctor(username="doctor_action_b")
        self.doctor_b.branches.add(self.branch_b)

        self.manager = create_manager(username="users_action_manager")
        grant_user_change_permission(user=self.manager)
        self.branch_a.manager = self.manager
        self.branch_a.save(update_fields=["manager"])

        self.manager_no_perm = create_manager(username="users_action_manager_no_perm")
        self.branch_c.manager = self.manager_no_perm
        self.branch_c.save(update_fields=["manager"])
        # Keep this manager in-scope for branch A but without change permission,
        # so permission checks return 403 (not out-of-scope 404).
        self.manager_no_perm.branches.add(self.branch_a)

    def test_manager_can_toggle_active_for_doctor_in_his_branch(self):
        """
        Verify that a branch manager can toggle the is_active status of a doctor belonging to their branch.
        This ensures the toggle_active action respects branch scope for managers.
        """
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(f"/api/users/{self.doctor_a.id}/toggle_active/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_manager_cannot_toggle_active_for_doctor_in_other_branch(self):
        """
        Verify that a branch manager cannot toggle the is_active status of a doctor in a different branch.
        This ensures cross-branch access is blocked at the action level.
        """
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(f"/api/users/{self.doctor_b.id}/toggle_active/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_manager_can_verify_email_for_doctor_in_his_branch(self):
        """
        Verify that a branch manager can verify the email of a doctor belonging to their branch.
        This ensures the verify_email action respects branch scope for managers.
        """
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(f"/api/users/{self.doctor_a.id}/verify_email/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_manager_cannot_verify_email_for_doctor_in_other_branch(self):
        """
        Verify that a branch manager cannot verify the email of a doctor in a different branch.
        This ensures cross-branch access is blocked for the verify_email action.
        """
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(f"/api/users/{self.doctor_b.id}/verify_email/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_manager_can_patch_doctor_in_his_branch(self):
        """
        Verify that a branch manager with change_user permission can edit doctor profile fields
        within their own branch.
        """
        self.client.force_authenticate(user=self.manager)

        response = self.client.patch(
            f"/api/users/{self.doctor_a.id}/",
            {"full_name": "Updated by Manager"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_manager_cannot_patch_doctor_in_other_branch(self):
        """
        Verify that a manager cannot directly edit a doctor in a different branch.
        Cross-branch users are not in the filtered queryset, resulting in 404.
        """
        self.client.force_authenticate(user=self.manager)

        response = self.client.patch(
            f"/api/users/{self.doctor_b.id}/",
            {"full_name": "Updated Cross Branch"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_manager_without_change_permission_cannot_toggle_even_in_his_branch(self):
        """
        Verify that manager without Django `change_user` permission cannot toggle doctor active state,
        even when doctor is in the same branch.
        """
        self.client.force_authenticate(user=self.manager_no_perm)

        response = self.client.post(f"/api/users/{self.doctor_a.id}/toggle_active/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_without_change_permission_cannot_verify_even_in_his_branch(self):
        """
        Verify that manager without Django `change_user` permission cannot verify doctor email,
        even when doctor is in the same branch.
        """
        self.client.force_authenticate(user=self.manager_no_perm)

        response = self.client.post(f"/api/users/{self.doctor_a.id}/verify_email/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_can_edit_any_user(self):
        """
        Verify that a superuser can edit any user's profile fields.
        Superusers have full access to edit all users across all branches.
        """
        superuser = create_superuser(username="superuser_edit_test")
        self.client.force_authenticate(user=superuser)

        response = self.client.patch(
            f"/api/users/{self.doctor_a.id}/",
            {"full_name": "Updated by Superuser"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["full_name"], "Updated by Superuser")

    def test_superuser_can_edit_user_in_any_branch(self):
        """
        Verify that a superuser can edit users in any branch, including branches they don't manage.
        """
        superuser = create_superuser(username="superuser_edit_any_branch")
        self.client.force_authenticate(user=superuser)

        # doctor_b is in branch_b, which the superuser doesn't manage
        response = self.client.patch(
            f"/api/users/{self.doctor_b.id}/",
            {"specialty": "Superuser Specialty Update"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["specialty"], "Superuser Specialty Update")

    def test_superuser_can_delete_user(self):
        """
        Verify that a superuser can delete any user.
        """
        superuser = create_superuser(username="superuser_delete_test")
        self.client.force_authenticate(user=superuser)

        response = self.client.delete(f"/api/users/{self.doctor_a.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
