from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from niqabaty.models import Complaint
from .factories import (
    create_branch,
    create_doctor,
    create_superuser,
)


class ComplaintBranchValidationTests(TestCase):
    """Tests for branch validation when submitting complaints.
    
    Verifies that non-superusers can only submit or update complaints directed to
    their own assigned branch or its parent branch.
    """

    def setUp(self):
        self.client = APIClient()

        # Syndicate hierarchy:
        # Parent Branch P (e.g. General Syndicate)
        # ├── Sub-Branch A (e.g. Tripoli Branch)
        # Sub-Branch B (unrelated branch, e.g. Benghazi Branch)
        self.parent_branch = create_branch(name="General Syndicate", prefix="GEN")
        self.branch_a = create_branch(name="Tripoli Branch", prefix="TIP", parent=self.parent_branch)
        self.branch_b = create_branch(name="Benghazi Branch", prefix="BEN")

        self.doctor = create_doctor(username="doctor_complaint", full_name="Dr. Test")
        self.doctor.branches.add(self.branch_a)

    def test_doctor_can_send_complaint_to_own_branch(self):
        """Doctor can create a complaint directed to their own assigned branch."""
        self.client.force_authenticate(user=self.doctor)

        response = self.client.post("/api/complaints/", {
            "subject": "Issue in Tripoli",
            "description": "Details about Tripoli branch",
            "priority": "medium",
            "sent_to_branch": self.branch_a.id,
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["sent_to_branch"], self.branch_a.id)

    def test_doctor_can_send_complaint_to_parent_branch(self):
        """Doctor can escalate/send a complaint to the parent branch of their assigned branch."""
        self.client.force_authenticate(user=self.doctor)

        response = self.client.post("/api/complaints/", {
            "subject": "Escalation to Syndicate",
            "description": "Details for general syndicate",
            "priority": "high",
            "sent_to_branch": self.parent_branch.id,
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["sent_to_branch"], self.parent_branch.id)

    def test_doctor_cannot_send_complaint_to_unrelated_branch(self):
        """Doctor cannot send a complaint to an unrelated branch."""
        self.client.force_authenticate(user=self.doctor)

        response = self.client.post("/api/complaints/", {
            "subject": "Unauthorized branch complaint",
            "description": "Attempt to send to unrelated branch",
            "priority": "low",
            "sent_to_branch": self.branch_b.id,
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sent_to_branch", response.data)

    def test_doctor_cannot_update_complaint_to_unrelated_branch(self):
        """Doctor cannot patch an existing complaint to target an unrelated branch."""
        self.client.force_authenticate(user=self.doctor)

        complaint = Complaint.objects.create(
            user=self.doctor,
            subject="Original Complaint",
            description="Original description",
            sent_to_branch=self.branch_a,
        )

        response = self.client.patch(f"/api/complaints/{complaint.id}/", {
            "sent_to_branch": self.branch_b.id,
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sent_to_branch", response.data)

    def test_doctor_can_create_complaint_without_branch(self):
        """Doctor can create a general complaint with no branch specified."""
        self.client.force_authenticate(user=self.doctor)

        response = self.client.post("/api/complaints/", {
            "subject": "General Complaint",
            "description": "No specific branch",
            "priority": "low",
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data["sent_to_branch"])

    def test_superuser_can_send_complaint_to_any_branch(self):
        """Superuser can create or assign a complaint to any branch."""
        superuser = create_superuser(username="admin_complaint")
        self.client.force_authenticate(user=superuser)

        response = self.client.post("/api/complaints/", {
            "subject": "Admin complaint",
            "description": "Admin sending to any branch",
            "priority": "urgent",
            "sent_to_branch": self.branch_b.id,
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["sent_to_branch"], self.branch_b.id)
