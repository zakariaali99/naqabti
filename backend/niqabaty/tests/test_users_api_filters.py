from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .factories import create_branch, create_doctor, create_institution


class UsersApiFiltersTests(TestCase):
    """Tests for user API filtering functionality.

    Verifies that the user API supports filtering by branch_ids, user_type,
    and search queries within the user's branch scope.
    """

    def setUp(self):
        """Set up test fixtures including branches, admin, and doctors."""
        self.client = APIClient()
        self.branch_a = create_branch(name="Branch A", prefix="UFA")
        self.branch_b = create_branch(name="Branch B", prefix="UFB")

        self.admin = create_institution(username="users_filters_admin")
        self.admin.branches.add(self.branch_a)

        self.doctor_a = create_doctor(username="doctor_filter_a", full_name="Alpha Doctor")
        self.doctor_a.branches.add(self.branch_a)

        self.doctor_b = create_doctor(username="doctor_filter_b", full_name="Beta Doctor")
        self.doctor_b.branches.add(self.branch_b)

    def test_filter_by_branch_ids_returns_only_requested_branch(self):
        """Test filtering users by branch_ids parameter.

        Verifies that when filtering by branch_ids, only users from the
        specified branch are returned within the admin's scope.
        """
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(f"/api/users/?branch_ids={self.branch_a.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.doctor_a.id, ids)
        self.assertNotIn(self.doctor_b.id, ids)

    def test_filter_by_user_type_returns_only_requested_type(self):
        """Test filtering users by user_type parameter.

        Verifies that when filtering by user_type, only users of the
        specified type are returned within the admin's scope.
        """
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/users/?user_type=doctor")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(all(item["user_type"] == "doctor" for item in response.data["results"]))

    def test_search_returns_matching_name_in_scope(self):
        """Test searching users by name within scope.

        Verifies that the search parameter filters users by matching
        names within the authenticated user's branch scope.
        """
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/users/?search=Alpha")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.doctor_a.id, ids)

