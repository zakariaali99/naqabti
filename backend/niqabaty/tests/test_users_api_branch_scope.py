from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .factories import (
    create_branch,
    create_doctor,
    create_institution,
    create_manager,
    create_student,
    create_superuser,
)


class UsersApiBranchScopeTests(TestCase):
    """Tests for user API branch scope filtering.

    Verifies that different user types (superuser, branch manager, admin, doctor, student)
    have appropriate access to user lists based on their branch scope.
    """

    def setUp(self):
        """Set up test fixtures including branches and doctors."""
        self.client = APIClient()
        self.branch_a = create_branch(name="Branch A", prefix="USA")
        self.branch_b = create_branch(name="Branch B", prefix="USB")

        self.doctor_a = create_doctor(username="doctor_users_a", full_name="Doctor A")
        self.doctor_a.branches.add(self.branch_a)

        self.doctor_b = create_doctor(username="doctor_users_b", full_name="Doctor B")
        self.doctor_b.branches.add(self.branch_b)

    def test_superuser_can_list_doctors_from_all_branches(self):
        """Test that superuser can list doctors from all branches.

        Verifies that a superuser with full system access can see doctors
        from both Branch A and Branch B.
        """
        root = create_superuser(username="users_root")
        self.client.force_authenticate(user=root)

        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.doctor_a.id, ids)
        self.assertIn(self.doctor_b.id, ids)

    def test_branch_manager_via_branch_manager_field_sees_only_his_branch(self):
        """Test that branch manager sees only users from their managed branch.

        Verifies that a manager assigned to Branch A via the manager field
        can only see doctors belonging to Branch A, not Branch B.
        """
        manager = create_manager(username="users_manager_fk")
        self.branch_a.manager = manager
        self.branch_a.save(update_fields=["manager"])
        self.client.force_authenticate(user=manager)

        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.doctor_a.id, ids)
        self.assertNotIn(self.doctor_b.id, ids)

    def test_admin_with_branch_membership_sees_only_his_branch(self):
        """Test that admin user sees only users from branches they belong to.

        Verifies that an institution admin who is a member of Branch A
        can only see doctors from Branch A, not Branch B.
        """
        admin = create_institution(username="users_admin")
        admin.branches.add(self.branch_a)
        self.client.force_authenticate(user=admin)

        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.doctor_a.id, ids)
        self.assertNotIn(self.doctor_b.id, ids)

    def test_doctor_cannot_list_users(self):
        """Test that doctor user cannot list other users.

        Verifies that a doctor receives an empty list when attempting
        to access the users endpoint.
        """
        doctor = create_doctor(username="users_doctor_no_access")
        self.client.force_authenticate(user=doctor)

        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"], [])

    def test_student_cannot_list_users(self):
        """Test that student user cannot list other users.

        Verifies that a student receives an empty list when attempting
        to access the users endpoint.
        """
        student = create_student(username="users_student_no_access")
        self.client.force_authenticate(user=student)

        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"], [])

    def test_doctor_can_retrieve_own_details(self):
        """Test that a doctor can retrieve their own details."""
        doctor = create_doctor(username="doctor_self_detail")
        self.client.force_authenticate(user=doctor)

        response = self.client.get(f"/api/users/{doctor.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "doctor_self_detail")

    def test_doctor_cannot_retrieve_other_user_details(self):
        """Test that a doctor cannot retrieve other users' details."""
        doctor = create_doctor(username="doctor_self_detail")
        other_doctor = create_doctor(username="doctor_other_detail")
        self.client.force_authenticate(user=doctor)

        response = self.client.get(f"/api/users/{other_doctor.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_can_retrieve_own_details(self):
        """Test that a student can retrieve their own details."""
        student = create_student(username="student_self_detail")
        self.client.force_authenticate(user=student)

        response = self.client.get(f"/api/users/{student.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "student_self_detail")

    def test_student_cannot_retrieve_other_user_details(self):
        """Test that a student cannot retrieve other users' details."""
        student = create_student(username="student_self_detail")
        other_student = create_student(username="student_other_detail")
        self.client.force_authenticate(user=student)

        response = self.client.get(f"/api/users/{other_student.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


