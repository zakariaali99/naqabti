from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .factories import (
    create_branch,
    create_doctor,
    create_institution,
    create_membership,
    create_membership_type,
)


class MembershipsApiFiltersTests(TestCase):
    """Tests for memberships API endpoint filtering and search functionality."""

    def setUp(self):
        """Set up test data: a branch, admin, doctors, and memberships with different statuses."""
        self.client = APIClient()
        self.branch = create_branch(name="Branch A", prefix="MFA")

        self.admin = create_institution(username="memb_filters_admin")
        self.admin.branches.add(self.branch)

        self.doctor_a = create_doctor(username="doctor_mf_a")
        self.doctor_a.branches.add(self.branch)

        self.doctor_b = create_doctor(username="doctor_mf_b")
        self.doctor_b.branches.add(self.branch)

        mtype = create_membership_type(name="Membership Filter")
        self.active_membership = create_membership(
            doctor=self.doctor_a,
            branch=self.branch,
            membership_type=mtype,
            status="active",
        )
        self.pending_membership = create_membership(
            doctor=self.doctor_b,
            branch=self.branch,
            membership_type=mtype,
            status="pending",
        )

    def test_filter_by_status_returns_only_requested_status(self):
        """
        Verify that filtering memberships by status query parameter returns only memberships matching that status.
        This ensures the status filter works correctly on the memberships endpoint.
        """
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/memberships/?status=active")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        statuses = [item["status"] for item in response.data["results"]]
        self.assertTrue(all(value == "active" for value in statuses))

    def test_search_by_membership_number_returns_expected_record(self):
        """
        Verify that searching memberships by membership_number returns the correct matching record.
        This ensures the search filter works correctly on the memberships endpoint.
        """
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            f"/api/memberships/?search={self.active_membership.membership_number}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.active_membership.id, ids)

