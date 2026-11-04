from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from niqabaty.models import Notification
from .factories import create_doctor, create_superuser


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


class HideNotificationTests(TestCase):
    def setUp(self):
        self.doctor = create_doctor(username="hide_doc")
        self.other = create_doctor(username="hide_other")
        self.client = APIClient()
        self.client.force_authenticate(user=self.doctor)
        self.broadcast = Notification.objects.create(
            user=self.doctor, title="To all", message="m", send_to_all_devices=True)

    def _titles(self, client):
        return [n["title"] for n in client.get("/api/notifications/").data["results"]]

    def test_hide_is_for_the_member_only(self):
        response = self.client.post(f"/api/notifications/{self.broadcast.id}/hide/")
        self.assertEqual(response.status_code, 200)

        self.assertNotIn("To all", self._titles(self.client))
        self.assertEqual(
            self.client.get("/api/notifications/unread_count/").data["unread_count"], 0)

        other_client = APIClient()
        other_client.force_authenticate(user=self.other)
        self.assertIn("To all", self._titles(other_client))
        self.assertEqual(
            other_client.get("/api/notifications/unread_count/").data["unread_count"], 1)

    def test_member_cannot_delete_or_edit_for_everyone(self):
        base = f"/api/notifications/{self.broadcast.id}"
        self.assertEqual(self.client.post(f"{base}/cancel/").status_code, 403)
        self.assertEqual(self.client.delete(f"{base}/").status_code, 403)
        self.assertEqual(self.client.patch(f"{base}/", {"title": "x"}).status_code, 403)
        self.assertEqual(self.client.post("/api/notifications/delete_by_batch/",
                                          {"batch_id": "x"}).status_code, 403)
        self.assertEqual(self.client.post("/api/notifications/send_single/",
                                          {"user_id": self.other.id, "title": "t",
                                           "message": "m"}).status_code, 403)
        self.assertTrue(Notification.objects.filter(id=self.broadcast.id).exists())

    def test_reading_a_broadcast_does_not_mark_it_for_others(self):
        self.client.post(f"/api/notifications/{self.broadcast.id}/mark_as_read/")
        self.broadcast.refresh_from_db()
        self.assertFalse(self.broadcast.is_read)

    def test_admin_can_still_cancel(self):
        admin_client = APIClient()
        admin_client.force_authenticate(user=create_superuser())
        response = admin_client.post(f"/api/notifications/{self.broadcast.id}/cancel/")
        self.assertEqual(response.status_code, 200)
