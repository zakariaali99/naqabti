"""Tests for payment visibility and the approve/reject review actions."""
from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .factories import (
    create_branch,
    create_doctor,
    create_manager,
    create_membership,
    create_payment,
    create_superuser,
)


class PaymentReviewFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_superuser(username="payment_review_admin")
        self.manager = create_manager(username="payment_review_manager")
        self.branch = create_branch(name="Review Branch", prefix="REV")

        self.doctor = create_doctor(username="doctor_review")
        self.doctor.branches.add(self.branch)
        self.other_doctor = create_doctor(username="doctor_review_other")
        self.other_doctor.branches.add(self.branch)

        self.membership = create_membership(doctor=self.doctor, branch=self.branch)
        self.payment = create_payment(
            user=self.doctor, membership=self.membership, amount=Decimal("250.00")
        )
        self.other_payment = create_payment(
            user=self.other_doctor, amount=Decimal("75.00")
        )

    def test_doctor_sees_only_their_own_payments(self):
        """
        A doctor must never see another doctor's payment records.
        """
        self.client.force_authenticate(user=self.doctor)

        response = self.client.get("/api/payments/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.payment.id, ids)
        self.assertNotIn(self.other_payment.id, ids)

    def test_doctor_cannot_approve_a_payment(self):
        """
        Approval is gated by IsManagerOrStaff — a doctor approving their own
        payment would let them mark their fees as settled.
        """
        self.client.force_authenticate(user=self.doctor)

        response = self.client.post(f"/api/payments/{self.payment.id}/approve/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "pending")

    def test_manager_can_approve_and_review_metadata_is_recorded(self):
        """
        Approving must stamp who reviewed it and when, for the audit trail.
        """
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(f"/api/payments/{self.payment.id}/approve/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "approved")
        self.assertEqual(self.payment.reviewed_by, self.manager)
        self.assertIsNotNone(self.payment.reviewed_at)

    def test_staff_can_reject(self):
        """
        Rejection follows the same path as approval.
        """
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(f"/api/payments/{self.payment.id}/reject/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "rejected")
        self.assertEqual(self.payment.reviewed_by, self.admin)

    def test_already_reviewed_payment_cannot_be_reviewed_again(self):
        """
        Only pending payments are reviewable; re-approving a rejected payment
        would quietly reverse a decision.
        """
        self.client.force_authenticate(user=self.admin)
        self.client.post(f"/api/payments/{self.payment.id}/reject/")

        response = self.client.post(f"/api/payments/{self.payment.id}/approve/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Payment is not in pending status.")
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "rejected")

    def test_doctor_cannot_download_another_doctors_document(self):
        """
        Document download is self-or-staff only.
        """
        self.client.force_authenticate(user=self.doctor)

        response = self.client.get(
            f"/api/payments/{self.other_payment.id}/download_document/"
        )

        # The other doctor's payment isn't in this doctor's queryset at all, so
        # the object lookup fails before the ownership check runs.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
