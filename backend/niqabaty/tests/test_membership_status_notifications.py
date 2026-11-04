"""Tests for the notification an admin's approval sends to the doctor.

DoctorsMembershipViewSet.perform_update fires a notification only on the
pending -> active transition, telling the doctor what is left to pay.
"""
from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from niqabaty.models import Notification

from .factories import (
    create_branch,
    create_doctor,
    create_membership,
    create_membership_type,
    create_superuser,
)


class MembershipStatusNotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_superuser(username="notify_admin")
        self.branch = create_branch(name="Notify Branch", prefix="NTF")

        self.doctor = create_doctor(username="doctor_notify")
        self.doctor.branches.add(self.branch)

        self.membership = create_membership(
            doctor=self.doctor,
            branch=self.branch,
            membership_type=create_membership_type(name="Notify Annual"),
            status="pending",
        )
        self.client.force_authenticate(user=self.admin)

    def _doctor_notifications(self):
        return Notification.objects.filter(user=self.doctor, content_type="membership")

    def test_activation_notifies_the_doctor_with_the_outstanding_amount(self):
        """
        The doctor must be told their application was approved and how much is
        still owed — this message is the only prompt to pay.
        """
        response = self.client.patch(
            f"/api/memberships/{self.membership.id}/",
            {"status": "active"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification = self._doctor_notifications().get()
        self.assertEqual(notification.notification_type, "success")
        self.assertEqual(notification.object_id, self.membership.id)
        self.assertEqual(notification.source, "system")
        self.assertIn("500.00 LYD", notification.message)

    def test_outstanding_amount_accounts_for_money_already_paid(self):
        """
        A doctor who part-paid up front must be asked for the balance only.
        """
        self.membership.paid_amount = Decimal("200.00")
        self.membership.save()

        self.client.patch(
            f"/api/memberships/{self.membership.id}/",
            {"status": "active"},
            format="json",
        )

        self.assertIn("300.00 LYD", self._doctor_notifications().get().message)

    def test_no_notification_for_other_transitions(self):
        """
        Cancelling or otherwise editing a membership must stay silent.
        """
        self.client.patch(
            f"/api/memberships/{self.membership.id}/",
            {"status": "canceled"},
            format="json",
        )

        self.assertEqual(self._doctor_notifications().count(), 0)

    def test_no_duplicate_notification_when_already_active(self):
        """
        Re-saving an active membership must not re-notify; the doctor would get
        a fresh "please pay" message on every unrelated admin edit.
        """
        self.client.patch(
            f"/api/memberships/{self.membership.id}/", {"status": "active"}, format="json"
        )
        self.client.patch(
            f"/api/memberships/{self.membership.id}/", {"status": "active"}, format="json"
        )

        self.assertEqual(self._doctor_notifications().count(), 1)
