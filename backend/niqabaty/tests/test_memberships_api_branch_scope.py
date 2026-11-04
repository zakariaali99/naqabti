from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .factories import (
    create_branch,
    create_doctor,
    create_institution,
    create_manager,
    create_membership,
    create_membership_type,
    create_student,
    create_superuser,
)


class MembershipsApiBranchScopeTests(TestCase):
    """Tests for memberships API endpoint to ensure branch-based scope filtering."""

    def setUp(self):
        """Set up test data: two branches, doctors, and memberships."""
        self.client = APIClient()
        self.branch_a = create_branch(name="Branch A", prefix="MSA")
        self.branch_b = create_branch(name="Branch B", prefix="MSB")

        self.doctor_a = create_doctor(username="doctor_memb_a")
        self.doctor_a.branches.add(self.branch_a)

        self.doctor_b = create_doctor(username="doctor_memb_b")
        self.doctor_b.branches.add(self.branch_b)

        mtype = create_membership_type(name="Membership A")
        self.membership_a = create_membership(doctor=self.doctor_a, branch=self.branch_a, membership_type=mtype, status="active")
        self.membership_b = create_membership(doctor=self.doctor_b, branch=self.branch_b, membership_type=mtype, status="active")

    def test_superuser_can_list_memberships_from_all_branches(self):
        """
        Verify that a superuser can view memberships from all branches.
        This ensures unrestricted access for administrative users.
        """
        root = create_superuser(username="memb_root")
        self.client.force_authenticate(user=root)

        response = self.client.get("/api/memberships/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.membership_a.id, ids)
        self.assertIn(self.membership_b.id, ids)

    def test_branch_manager_via_branch_manager_field_sees_only_his_branch_memberships(self):
        """
        Verify that a manager assigned via Branch.manager can only see memberships belonging to their branch.
        This tests the branch-manager FK relationship scope.
        """
        manager = create_manager(username="memb_manager_fk")
        self.branch_a.manager = manager
        self.branch_a.save(update_fields=["manager"])
        self.client.force_authenticate(user=manager)

        response = self.client.get("/api/memberships/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.membership_a.id, ids)
        self.assertNotIn(self.membership_b.id, ids)

    def test_admin_with_branch_membership_sees_only_his_branch_memberships(self):
        """
        Verify that an admin/institution user with a branch association can only see memberships of that branch.
        This tests the User.branches ManyToMany relationship scope.
        """
        admin = create_institution(username="memb_admin")
        admin.branches.add(self.branch_a)
        self.client.force_authenticate(user=admin)

        response = self.client.get("/api/memberships/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.membership_a.id, ids)
        self.assertNotIn(self.membership_b.id, ids)

    def test_doctor_sees_only_his_own_memberships(self):
        """
        Verify that a doctor can list only memberships where he is the membership owner.
        This ensures doctor users cannot see other doctors' memberships.
        """
        self.client.force_authenticate(user=self.doctor_a)

        response = self.client.get("/api/memberships/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.membership_a.id, ids)
        self.assertNotIn(self.membership_b.id, ids)

    def test_student_sees_no_memberships(self):
        """
        Verify that a student user does not see doctors memberships.
        This ensures non-doctor/non-admin users cannot access unrelated memberships.
        """
        student = create_student(username="memb_student")
        self.client.force_authenticate(user=student)

        response = self.client.get("/api/memberships/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
