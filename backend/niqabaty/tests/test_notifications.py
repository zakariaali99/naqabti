from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from niqabaty.models import Notification
from .factories import create_doctor, create_superuser


class NotificationOrderingTests(TestCase):
    """Tests to verify default reverse ordering of notifications."""

    def setUp(self):
        self.client = APIClient()
        self.doctor = create_doctor(username="doctor_notif", full_name="Dr. Notif")
        self.now = timezone.now()

        # Create 3 notifications with staggered timestamps
        self.notif_old = Notification.objects.create(
            user=self.doctor,
            title="Old Notification",
            message="Old message",
            notification_type="info",
        )
        Notification.objects.filter(id=self.notif_old.id).update(created_at=self.now - timedelta(hours=2))

        self.notif_mid = Notification.objects.create(
            user=self.doctor,
            title="Middle Notification",
            message="Middle message",
            notification_type="warning",
        )
        Notification.objects.filter(id=self.notif_mid.id).update(created_at=self.now - timedelta(hours=1))

        self.notif_latest = Notification.objects.create(
            user=self.doctor,
            title="Latest Notification",
            message="Latest message",
            notification_type="success",
        )
        Notification.objects.filter(id=self.notif_latest.id).update(created_at=self.now)

    def test_default_ordering_lists_latest_first(self):
        """Verify GET /api/notifications/ returns the newest notification at the top by default."""
        self.client.force_authenticate(user=self.doctor)

        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 3)

        # Expected order: latest -> mid -> old
        returned_ids = [item["id"] for item in results]
        self.assertEqual(returned_ids, [self.notif_latest.id, self.notif_mid.id, self.notif_old.id])

    def test_aggregated_endpoint_orders_latest_first(self):
        """Verify aggregated notifications action defaults to latest first for superusers."""
        superuser = create_superuser(username="admin_notif")
        self.client.force_authenticate(user=superuser)

        response = self.client.get("/api/notifications/aggregated/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", response.data)
        self.assertTrue(len(results) >= 1)
        # The latest notification id should be first
        self.assertEqual(results[0]["id"], self.notif_latest.id)
