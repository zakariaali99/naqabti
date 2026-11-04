"""Tests for POST /api/memberships/{id}/add_payment/.

The action validates the amount, records a Payment (whose save() recomputes the
membership's paid_amount) and then spreads the money across outstanding renewal
history rows, oldest first.
"""
from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from niqabaty.models import Payment

from .factories import (
    create_branch,
    create_doctor,
    create_membership,
    create_membership_type,
    create_renew_history,
    create_superuser,
)


class MembershipAddPaymentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_superuser(username="add_payment_admin")
        self.branch = create_branch(name="Payment Branch", prefix="PAY")

        self.doctor = create_doctor(username="doctor_add_payment")
        self.doctor.branches.add(self.branch)

        self.membership = create_membership(
            doctor=self.doctor,
            branch=self.branch,
            membership_type=create_membership_type(name="Payment Annual"),
            status="active",
        )
        self.client.force_authenticate(user=self.admin)

    def _url(self):
        return f"/api/memberships/{self.membership.id}/add_payment/"

    def test_missing_amount_is_rejected(self):
        """
        A payment with no amount must be refused rather than recorded as zero.
        """
        response = self.client.post(self._url(), {"payment_method": "cash"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Payment amount is required")
        self.assertFalse(Payment.objects.filter(membership=self.membership).exists())

    def test_zero_amount_is_rejected(self):
        """
        Zero is falsy in the view's first check, so it is reported as missing —
        either way it must not create a Payment.
        """
        response = self.client.post(
            self._url(), {"amount": 0, "payment_method": "cash"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Payment.objects.filter(membership=self.membership).exists())

    def test_negative_amount_is_rejected(self):
        """
        A negative amount would silently reduce what the doctor owes.
        """
        response = self.client.post(
            self._url(), {"amount": "-50.00", "payment_method": "cash"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["error"], "Payment amount must be greater than zero"
        )
        self.assertFalse(Payment.objects.filter(membership=self.membership).exists())

    def test_non_numeric_amount_is_rejected(self):
        """
        A non-numeric amount must produce a 400, not a 500 from the Decimal cast.
        """
        response = self.client.post(
            self._url(), {"amount": "abc", "payment_method": "cash"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Invalid payment amount")

    def test_partial_payment_updates_membership_paid_amount(self):
        """
        Payment.save() recomputes the membership's paid_amount from the sum of
        its payments; a part-payment must leave the membership 'partial'.
        """
        response = self.client.post(
            self._url(), {"amount": "200.00", "payment_method": "cash"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.membership.refresh_from_db()
        self.assertEqual(self.membership.paid_amount, Decimal("200.00"))
        self.assertEqual(self.membership.remaining_amount, Decimal("300.00"))
        self.membership.refresh_from_db()
        self.assertEqual(self.membership.payment_status, "partial")

    def test_full_payment_marks_membership_paid(self):
        """
        Paying the balance in full must flip payment_status to 'paid'.
        """
        response = self.client.post(
            self._url(), {"amount": "500.00", "payment_method": "bank_transfer"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.membership.refresh_from_db()
        self.assertEqual(self.membership.paid_amount, Decimal("500.00"))
        self.assertEqual(self.membership.remaining_amount, Decimal("0.00"))
        self.membership.refresh_from_db()
        self.assertEqual(self.membership.payment_status, "paid")

    def test_payments_accumulate_across_calls(self):
        """
        Two part-payments must add up rather than the later overwriting the
        earlier.
        """
        self.client.post(self._url(), {"amount": "150.00"}, format="json")
        self.client.post(self._url(), {"amount": "250.00"}, format="json")

        self.membership.refresh_from_db()
        self.assertEqual(self.membership.paid_amount, Decimal("400.00"))
        self.assertEqual(Payment.objects.filter(membership=self.membership).count(), 2)

    def test_payment_is_distributed_to_oldest_renew_history_first(self):
        """
        With two outstanding renewals, a payment that covers the first and part
        of the second must settle them in that order — not spread evenly.
        """
        first = create_renew_history(membership=self.membership, amount=Decimal("300.00"))
        second = create_renew_history(membership=self.membership, amount=Decimal("400.00"))

        response = self.client.post(self._url(), {"amount": "450.00"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        first.refresh_from_db()
        second.refresh_from_db()
        self.assertEqual(first.paid_amount, Decimal("300.00"))
        self.assertEqual(first.payment_status, "paid")
        self.assertEqual(second.paid_amount, Decimal("150.00"))
        self.assertEqual(second.payment_status, "partial")

    def test_fully_paid_renew_history_is_skipped(self):
        """
        Money must flow to the outstanding rows only; an already-settled
        renewal must not be over-paid.
        """
        settled = create_renew_history(
            membership=self.membership,
            amount=Decimal("300.00"),
            paid_amount=Decimal("300.00"),
        )
        outstanding = create_renew_history(
            membership=self.membership, amount=Decimal("200.00")
        )

        self.client.post(self._url(), {"amount": "200.00"}, format="json")

        settled.refresh_from_db()
        outstanding.refresh_from_db()
        self.assertEqual(settled.paid_amount, Decimal("300.00"))
        self.assertEqual(outstanding.paid_amount, Decimal("200.00"))
        self.assertEqual(outstanding.payment_status, "paid")

    def test_remaining_amount_prefers_renew_history_when_present(self):
        """
        Once renewal history exists, the membership's outstanding balance is the
        sum of the histories' balances rather than total minus paid.
        """
        create_renew_history(membership=self.membership, amount=Decimal("300.00"))
        create_renew_history(
            membership=self.membership,
            amount=Decimal("400.00"),
            paid_amount=Decimal("100.00"),
        )

        self.assertEqual(self.membership.remaining_amount, Decimal("600.00"))
