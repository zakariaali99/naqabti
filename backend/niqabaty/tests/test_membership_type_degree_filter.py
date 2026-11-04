"""Tests for the degree-based narrowing of GET /api/membership-types/.

Doctors browsing the self-service portal must only be offered types their own
academic degree qualifies for; admins pick the target degree explicitly with
?for_degree=.
"""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .factories import (
    create_academic_degree,
    create_doctor,
    create_membership_type,
    create_superuser,
)


class MembershipTypeDegreeFilterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_superuser(username="mtype_filter_admin")

        self.bachelor = create_academic_degree(name="Filter Bachelor")
        self.phd = create_academic_degree(name="Filter PhD")

        self.open_type = create_membership_type(name="Filter Open", academic_degree=None)
        self.bachelor_type = create_membership_type(
            name="Filter Bachelor Only", academic_degree=self.bachelor
        )
        self.phd_type = create_membership_type(
            name="Filter PhD Only", academic_degree=self.phd
        )

    def _names(self, response):
        return {item["name"] for item in response.data["results"]}

    def test_doctor_sees_only_own_degree_and_open_types(self):
        """
        A Bachelor doctor must see the degree-agnostic type and the Bachelor
        type, but never the PhD-restricted one.
        """
        doctor = create_doctor(username="mtype_bachelor", current_degree=self.bachelor)
        self.client.force_authenticate(user=doctor)

        response = self.client.get("/api/membership-types/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = self._names(response)
        self.assertIn(self.open_type.name, names)
        self.assertIn(self.bachelor_type.name, names)
        self.assertNotIn(self.phd_type.name, names)

    def test_doctor_cannot_widen_results_with_for_degree(self):
        """
        for_degree is an admin convenience; a doctor passing it must still be
        restricted to their own degree.
        """
        doctor = create_doctor(username="mtype_sneaky", current_degree=self.bachelor)
        self.client.force_authenticate(user=doctor)

        response = self.client.get(f"/api/membership-types/?for_degree={self.phd.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.phd_type.name, self._names(response))

    def test_doctor_without_degree_sees_only_open_types(self):
        """
        With no degree recorded, only degree-agnostic types apply.
        """
        doctor = create_doctor(username="mtype_no_degree")
        self.client.force_authenticate(user=doctor)

        response = self.client.get("/api/membership-types/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self._names(response), {self.open_type.name})

    def test_admin_sees_everything_by_default(self):
        """
        Without for_degree an admin must see the full catalogue.
        """
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/membership-types/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = self._names(response)
        self.assertTrue(
            {self.open_type.name, self.bachelor_type.name, self.phd_type.name} <= names
        )

    def test_admin_for_degree_narrows_to_that_degree_plus_open(self):
        """
        ?for_degree=<id> answers "what could this doctor buy?".
        """
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(f"/api/membership-types/?for_degree={self.phd.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = self._names(response)
        self.assertIn(self.open_type.name, names)
        self.assertIn(self.phd_type.name, names)
        self.assertNotIn(self.bachelor_type.name, names)

    def test_admin_for_degree_null_returns_only_open_types(self):
        """
        ?for_degree=null models a doctor with no degree on file.
        """
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/membership-types/?for_degree=null")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = self._names(response)
        self.assertIn(self.open_type.name, names)
        self.assertNotIn(self.bachelor_type.name, names)
        self.assertNotIn(self.phd_type.name, names)
