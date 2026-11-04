"""Tests for the academic-degree gate on membership creation and update.

Covers DoctorsMembershipViewSet._degree_validation_error: a membership type may
be tied to one academic degree, and buying several subscription periods at once
is only allowed for degrees flagged allows_multiple_subscriptions.
"""
from datetime import date
from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from niqabaty.models import DoctorsMembership

from .factories import (
    create_academic_degree,
    create_branch,
    create_doctor,
    create_membership,
    create_membership_type,
    create_superuser,
)


class MembershipDegreeRulesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_superuser(username="degree_rules_admin")
        self.branch = create_branch(name="Degree Branch", prefix="DGR")

        self.bachelor = create_academic_degree(
            name="Bachelor (single)", allows_multiple_subscriptions=False
        )
        self.phd = create_academic_degree(
            name="PhD (multi)", allows_multiple_subscriptions=True
        )

        self.open_type = create_membership_type(name="Open To All", academic_degree=None)
        self.phd_type = create_membership_type(name="PhD Only", academic_degree=self.phd)

        self.bachelor_doctor = create_doctor(
            username="doctor_bachelor", current_degree=self.bachelor
        )
        self.bachelor_doctor.branches.add(self.branch)

        self.phd_doctor = create_doctor(username="doctor_phd", current_degree=self.phd)
        self.phd_doctor.branches.add(self.branch)

        self.client.force_authenticate(user=self.admin)

    def _create_payload(self, *, doctor, membership_type, subscription_count=1):
        return {
            "doctor_id": doctor.id,
            "membership_type_id": membership_type.id,
            "branch_id": self.branch.id,
            "start_date": date.today().isoformat(),
            "status": "pending",
            "subscription_count": subscription_count,
        }

    def test_type_restricted_to_another_degree_is_rejected(self):
        """
        A membership type bound to the PhD degree must not be usable by a
        Bachelor doctor. This is the rule that keeps degree-priced memberships
        from being sold to the wrong doctors.
        """
        response = self.client.post(
            "/api/memberships/",
            self._create_payload(
                doctor=self.bachelor_doctor, membership_type=self.phd_type
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("academic degree", response.data["error"])
        self.assertFalse(DoctorsMembership.objects.filter(doctor=self.bachelor_doctor).exists())

    def test_type_restricted_to_matching_degree_is_accepted(self):
        """
        The same restricted type must be accepted for a doctor who actually
        holds that degree.
        """
        response = self.client.post(
            "/api/memberships/",
            self._create_payload(doctor=self.phd_doctor, membership_type=self.phd_type),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_degree_agnostic_type_is_accepted_for_any_degree(self):
        """
        A membership type with academic_degree unset is degree-agnostic and must
        be usable by every doctor.
        """
        response = self.client.post(
            "/api/memberships/",
            self._create_payload(
                doctor=self.bachelor_doctor, membership_type=self.open_type
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_multiple_subscriptions_rejected_for_degree_that_disallows_them(self):
        """
        subscription_count > 1 must be refused when the doctor's degree does not
        set allows_multiple_subscriptions.
        """
        response = self.client.post(
            "/api/memberships/",
            self._create_payload(
                doctor=self.bachelor_doctor,
                membership_type=self.open_type,
                subscription_count=3,
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("multiple subscription periods", response.data["error"])

    def test_multiple_subscriptions_scale_amount_and_end_date(self):
        """
        For a degree that allows it, buying N periods must multiply the price by
        N and extend end_date by duration_months * N once the membership goes
        active.
        """
        response = self.client.post(
            "/api/memberships/",
            self._create_payload(
                doctor=self.phd_doctor,
                membership_type=self.open_type,
                subscription_count=3,
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        membership = DoctorsMembership.objects.get(id=response.data["id"])
        # open_type is 500.00 for 12 months.
        self.assertEqual(membership.total_amount, Decimal("1500.00"))

        membership.status = "active"
        membership.end_date = None
        membership.save()

        expected_year = membership.start_date.year + 3
        self.assertEqual(membership.end_date.year, expected_year)
        self.assertEqual(membership.end_date.month, membership.start_date.month)

    def test_degree_rule_is_re_checked_on_update(self):
        """
        Switching an existing membership onto a type the doctor's degree can't
        use must be refused, not just the initial create.
        """
        membership = create_membership(
            doctor=self.bachelor_doctor,
            branch=self.branch,
            membership_type=self.open_type,
            status="pending",
        )

        response = self.client.patch(
            f"/api/memberships/{membership.id}/",
            {"membership_type_id": self.phd_type.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        membership.refresh_from_db()
        self.assertEqual(membership.membership_type_id, self.open_type.id)

    def test_subscription_count_rule_is_re_checked_on_update(self):
        """
        Raising subscription_count on an existing membership must respect the
        doctor's degree flag.
        """
        membership = create_membership(
            doctor=self.bachelor_doctor,
            branch=self.branch,
            membership_type=self.open_type,
            status="pending",
        )

        response = self.client.patch(
            f"/api/memberships/{membership.id}/",
            {"subscription_count": 2},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        membership.refresh_from_db()
        self.assertEqual(membership.subscription_count, 1)

    def test_second_active_membership_is_rejected(self):
        """
        A doctor may hold only one active membership at a time.
        """
        create_membership(
            doctor=self.bachelor_doctor,
            branch=self.branch,
            membership_type=self.open_type,
            status="active",
        )

        response = self.client.post(
            "/api/memberships/",
            self._create_payload(
                doctor=self.bachelor_doctor, membership_type=self.open_type
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Doctor already has an active membership")
