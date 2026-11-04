"""Tests for UserSerializer._validate_branch_and_dynamic_fields and the
per-branch doctor_number uniqueness rule.

These guard the admin "add doctor" form: a member with no branch can't be
scoped by any of the branch-aware endpoints, and a branch's required custom
fields are the only way a branch collects its own mandatory data.
"""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from niqabaty.models import BranchDynamicField, UserDynamicFieldValue

from .factories import create_branch, create_doctor, create_superuser


class UserBranchAndDynamicFieldValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_superuser(username="dynfield_admin")
        self.branch = create_branch(name="Dynamic Branch", prefix="DYN")
        self.other_branch = create_branch(name="Other Dynamic Branch", prefix="DYO")
        self.client.force_authenticate(user=self.admin)

    def _payload(self, **overrides):
        payload = {
            "username": "dynfield_doctor",
            "email": "dynfield_doctor@test.com",
            "password": "testpass123",
            "confirm_password": "testpass123",
            "user_type": "doctor",
            "branch_ids": [self.branch.id],
        }
        payload.update(overrides)
        return payload

    def _required_text_field(self, branch=None):
        return BranchDynamicField.objects.create(
            branch=branch or self.branch,
            label_ar="رقم النقابة",
            label_en="Syndicate Number",
            field_type="text",
            is_required=True,
        )

    def test_creating_a_user_without_a_branch_is_rejected(self):
        """
        Branch membership drives every scoping rule in the API, so a user with
        none is unreachable to branch managers.
        """
        response = self.client.post("/api/users/", self._payload(branch_ids=[]), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("branch_ids", response.data)

    def test_creating_a_user_with_no_branch_key_at_all_is_rejected(self):
        """
        Omitting branch_ids entirely must fail the same way as sending an empty
        list — otherwise the rule is trivially bypassed.
        """
        payload = self._payload()
        payload.pop("branch_ids")

        response = self.client.post("/api/users/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("branch_ids", response.data)

    def test_required_dynamic_field_must_be_filled_on_create(self):
        """
        A branch marking a custom field required must block user creation until
        it has a value.
        """
        field = self._required_text_field()

        response = self.client.post("/api/users/", self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(f"dynamic_field_{field.id}", response.data)

    def test_required_dynamic_field_accepted_when_supplied(self):
        """
        Supplying the value must let the create through and persist it.
        """
        field = self._required_text_field()

        response = self.client.post(
            "/api/users/",
            self._payload(
                dynamic_field_value_inputs=[{"field_id": field.id, "value_text": "12345"}]
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        value = UserDynamicFieldValue.objects.get(user_id=response.data["id"], field=field)
        self.assertEqual(value.value_text, "12345")

    def test_field_belonging_to_another_branch_is_rejected(self):
        """
        A branch's custom fields must not be settable by users of a different
        branch.
        """
        foreign_field = self._required_text_field(branch=self.other_branch)

        response = self.client.post(
            "/api/users/",
            self._payload(
                dynamic_field_value_inputs=[
                    {"field_id": foreign_field.id, "value_text": "12345"}
                ]
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(f"dynamic_field_{foreign_field.id}", response.data)

    def test_select_field_rejects_a_value_outside_its_options(self):
        """
        A select field's stored value must be one of its declared options.
        """
        field = BranchDynamicField.objects.create(
            branch=self.branch,
            label_ar="الدرجة",
            label_en="Grade",
            field_type="select",
            options=[{"value": "a", "label_en": "A"}, {"value": "b", "label_en": "B"}],
            is_required=True,
        )

        response = self.client.post(
            "/api/users/",
            self._payload(
                dynamic_field_value_inputs=[{"field_id": field.id, "value_text": "z"}]
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "Not a valid option for this field.",
            str(response.data[f"dynamic_field_{field.id}"]),
        )

    def test_duplicate_doctor_number_in_the_same_branch_is_rejected(self):
        """
        doctor_number is the branch-local identifier printed on membership
        cards; two doctors in one branch must not share it.
        """
        existing = create_doctor(username="dynfield_existing")
        existing.doctor_number = "777"
        existing.save()
        existing.branches.add(self.branch)

        response = self.client.post(
            "/api/users/", self._payload(doctor_number="777"), format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("doctor_number", response.data)

    def test_same_doctor_number_in_a_different_branch_is_allowed(self):
        """
        The number is only unique within a branch — each branch numbers its own
        doctors from scratch.
        """
        existing = create_doctor(username="dynfield_other_branch")
        existing.doctor_number = "777"
        existing.save()
        existing.branches.add(self.other_branch)

        response = self.client.post(
            "/api/users/", self._payload(doctor_number="777"), format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
