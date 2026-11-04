from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from niqabaty.models import Notification
from .factories import create_doctor


class MarkAllReadTests(TestCase):
    def setUp(self):
        self.doctor = create_doctor(username="notif_doc")
        self.client = APIClient()
        self.client.force_authenticate(user=self.doctor)

    def _unread_count(self):
        return self.client.get("/api/notifications/unread_count/").data["unread_count"]

    def test_mark_all_read_covers_broadcasts_too(self):
        Notification.objects.create(user=self.doctor, title="Own", message="m")
        Notification.objects.create(user=self.doctor, title="To all", message="m",
                                    send_to_all_devices=True)
        self.assertEqual(self._unread_count(), 2)

        self.client.post("/api/notifications/mark_all_as_read/")

        self.assertEqual(self._unread_count(), 0)
        listed = self.client.get("/api/notifications/").data["results"]
        self.assertTrue(all(n["is_read"] for n in listed))

    def test_broadcasts_from_before_joining_are_hidden(self):
        old = Notification.objects.create(user=self.doctor, title="Old", message="m",
                                          send_to_all_devices=True)
        Notification.objects.filter(id=old.id).update(
            created_at=self.doctor.date_joined - timedelta(days=30))
        Notification.objects.create(user=self.doctor, title="New", message="m",
                                    send_to_all_devices=True)

        titles = [n["title"] for n in self.client.get("/api/notifications/").data["results"]]
        self.assertEqual(titles, ["New"])
        self.assertEqual(self._unread_count(), 1)
