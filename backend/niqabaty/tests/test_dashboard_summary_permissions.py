from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from niqabaty.models import Certification, CertificationType, Payment

from .factories import (
    create_branch,
    create_doctor,
    create_institution,
    create_manager,
    create_membership,
    create_membership_type,
    create_student,
    create_superuser,
    grant_user_change_permission,
)


class DashboardSummaryPermissionsTests(TestCase):
    """Dashboard summary visibility and metric accuracy by role/permission scope."""

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/dashboard/summary/"

        self.branch_a = create_branch(name="Branch A", prefix="DSA")
        self.branch_b = create_branch(name="Branch B", prefix="DSB")

        self.manager_a = create_manager(username="dash_manager_a")
        grant_user_change_permission(user=self.manager_a)
        self.branch_a.manager = self.manager_a
        self.branch_a.save(update_fields=["manager"])

        self.manager_without_perm = create_manager(username="dash_manager_no_perm")
        self.branch_b.manager = self.manager_without_perm
        self.branch_b.save(update_fields=["manager"])

        self.institution_a = create_institution(username="dash_institution_a")
        self.institution_a.branches.add(self.branch_a)
        grant_user_change_permission(user=self.institution_a)

        self.student = create_student(username="dash_student")

        self.membership_type = create_membership_type(name="Dashboard Membership")

        self.today = timezone.now().date()
        self.cert_type = CertificationType.objects.create(name="Board", description="Board Cert")

        self.doctor_a = create_doctor(username="dash_doctor_a", full_name="Doctor A")
        self.doctor_a.branches.add(self.branch_a)

        self.doctor_b = create_doctor(username="dash_doctor_b", full_name="Doctor B")
        self.doctor_b.branches.add(self.branch_b)

        self.inactive_doctor_a = create_doctor(username="dash_doctor_inactive", full_name="Doctor Inactive")
        self.inactive_doctor_a.is_active = False
        self.inactive_doctor_a.save(update_fields=["is_active"])
        self.inactive_doctor_a.branches.add(self.branch_a)

        self.membership_a = create_membership(
            doctor=self.doctor_a,
            branch=self.branch_a,
            membership_type=self.membership_type,
            status="active",
        )
        self.membership_a.start_date = self.today - timedelta(days=20)
        self.membership_a.end_date = self.today + timedelta(days=20)
        self.membership_a.save(update_fields=["start_date", "end_date"])

        self.membership_b = create_membership(
            doctor=self.doctor_b,
            branch=self.branch_b,
            membership_type=self.membership_type,
            status="active",
        )
        self.membership_b.start_date = self.today - timedelta(days=10)
        self.membership_b.end_date = self.today + timedelta(days=10)
        self.membership_b.save(update_fields=["start_date", "end_date"])

        self.expired_membership_b = create_membership(
            doctor=self.doctor_b,
            branch=self.branch_b,
            membership_type=self.membership_type,
            status="expired",
        )
        self.expired_membership_b.start_date = self.today - timedelta(days=60)
        self.expired_membership_b.end_date = self.today - timedelta(days=1)
        self.expired_membership_b.save(update_fields=["start_date", "end_date"])

        self.cert_a_pending = Certification.objects.create(
            doctor=self.doctor_a,
            certification_type=self.cert_type,
            issue_date=self.today - timedelta(days=30),
            expiry_date=self.today + timedelta(days=30),
            issued_from="Branch A",
        )
        self.cert_a_expired = Certification.objects.create(
            doctor=self.doctor_a,
            certification_type=self.cert_type,
            issue_date=self.today - timedelta(days=365),
            expiry_date=self.today - timedelta(days=5),
            issued_from="Branch A",
        )
        self.cert_b_pending = Certification.objects.create(
            doctor=self.doctor_b,
            certification_type=self.cert_type,
            issue_date=self.today - timedelta(days=20),
            expiry_date=self.today + timedelta(days=10),
            issued_from="Branch B",
        )

        self.payment_a = Payment.objects.create(
            user=self.doctor_a,
            membership=self.membership_a,
            amount=Decimal("100.00"),
            payment_method="cash",
            reference_number="PA",
        )
        self.payment_b = Payment.objects.create(
            user=self.doctor_b,
            membership=self.membership_b,
            amount=Decimal("250.00"),
            payment_method="cash",
            reference_number="PB",
        )

    def test_dashboard_requires_authentication(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_superuser_gets_full_access_with_accurate_stats_and_structure(self):
        user = create_superuser(username="dash_root")
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertSetEqual(
            set(response.data.keys()),
            {"stats", "recentMembers", "pendingCertifications", "recentPayments", "recentRequests"},
        )

        stats = response.data["stats"]
        self.assertEqual(stats["totalMembers"], 3)
        self.assertEqual(stats["totalDoctors"], 3)
        self.assertEqual(stats["totalStudents"], 1)
        self.assertEqual(stats["totalInstitutions"], 1)
        self.assertEqual(stats["activeMemberships"], 2)
        self.assertEqual(stats["pendingCertifications"], 2)
        self.assertEqual(stats["completedCertifications"], 3)
        self.assertEqual(stats["totalRevenue"], 350.0)
        self.assertEqual(stats["pendingPayments"], 0)
        self.assertEqual(stats["openRequests"], 0)
        self.assertEqual(stats["resolvedRequests"], 0)

    def test_manager_with_change_permission_sees_only_his_branch_data(self):
        self.client.force_authenticate(user=self.manager_a)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stats = response.data["stats"]
        self.assertEqual(stats["totalMembers"], 1)
        self.assertEqual(stats["totalDoctors"], 2)
        self.assertEqual(stats["totalStudents"], 0)
        self.assertEqual(stats["totalInstitutions"], 1)
        self.assertEqual(stats["activeMemberships"], 1)
        self.assertEqual(stats["pendingCertifications"], 1)
        self.assertEqual(stats["completedCertifications"], 2)
        self.assertEqual(stats["totalRevenue"], 100.0)

        recent_member_ids = {item["id"] for item in response.data["recentMembers"]}
        self.assertIn(self.membership_a.id, recent_member_ids)
        self.assertNotIn(self.membership_b.id, recent_member_ids)

        recent_payment_ids = {item["id"] for item in response.data["recentPayments"]}
        self.assertIn(self.payment_a.id, recent_payment_ids)
        self.assertNotIn(self.payment_b.id, recent_payment_ids)

        recent_request_ids = {item["id"] for item in response.data["recentRequests"]}
        self.assertIn(self.inactive_doctor_a.id, recent_request_ids)
        self.assertNotIn(self.doctor_b.id, recent_request_ids)

    def test_institution_with_change_permission_sees_only_assigned_branch_data(self):
        self.client.force_authenticate(user=self.institution_a)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stats = response.data["stats"]
        self.assertEqual(stats["totalMembers"], 1)
        self.assertEqual(stats["totalDoctors"], 2)
        self.assertEqual(stats["totalStudents"], 0)
        self.assertEqual(stats["totalInstitutions"], 1)
        self.assertEqual(stats["activeMemberships"], 1)
        self.assertEqual(stats["pendingCertifications"], 1)
        self.assertEqual(stats["completedCertifications"], 2)
        self.assertEqual(stats["totalRevenue"], 100.0)

    def test_manager_without_change_permission_gets_zeroed_dashboard(self):
        self.client.force_authenticate(user=self.manager_without_perm)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stats = response.data["stats"]
        self.assertEqual(stats["totalMembers"], 0)
        self.assertEqual(stats["totalDoctors"], 0)
        self.assertEqual(stats["totalStudents"], 0)
        self.assertEqual(stats["totalInstitutions"], 0)
        self.assertEqual(stats["activeMemberships"], 0)
        self.assertEqual(stats["pendingCertifications"], 0)
        self.assertEqual(stats["completedCertifications"], 0)
        self.assertEqual(stats["totalRevenue"], 0.0)
        self.assertEqual(response.data["recentMembers"], [])
        self.assertEqual(response.data["pendingCertifications"], [])
        self.assertEqual(response.data["recentPayments"], [])
        self.assertEqual(response.data["recentRequests"], [])

    def test_doctor_only_sees_own_records_and_totals(self):
        self.client.force_authenticate(user=self.doctor_a)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stats = response.data["stats"]
        self.assertEqual(stats["totalMembers"], 1)
        self.assertEqual(stats["totalDoctors"], 1)
        self.assertEqual(stats["totalStudents"], 0)
        self.assertEqual(stats["totalInstitutions"], 0)
        self.assertEqual(stats["activeMemberships"], 1)
        self.assertEqual(stats["pendingCertifications"], 1)
        self.assertEqual(stats["completedCertifications"], 2)
        self.assertEqual(stats["totalRevenue"], 100.0)

        recent_member_ids = {item["id"] for item in response.data["recentMembers"]}
        self.assertEqual(recent_member_ids, {self.membership_a.id})

        recent_payment_ids = {item["id"] for item in response.data["recentPayments"]}
        self.assertEqual(recent_payment_ids, {self.payment_a.id})

    def test_student_gets_empty_dashboard_data(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stats = response.data["stats"]
        self.assertTrue(all(value == 0 or value == 0.0 for value in stats.values()))
        self.assertEqual(response.data["recentMembers"], [])
        self.assertEqual(response.data["pendingCertifications"], [])
        self.assertEqual(response.data["recentPayments"], [])
        self.assertEqual(response.data["recentRequests"], [])


class DashboardSummaryNoDataTests(TestCase):
    """Dashboard should return valid empty structure when no records exist."""

    def test_superuser_no_data_returns_zero_stats_and_empty_lists(self):
        client = APIClient()
        root = create_superuser(username="dash_empty_root")
        client.force_authenticate(user=root)

        response = client.get("/api/dashboard/summary/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertSetEqual(
            set(response.data.keys()),
            {"stats", "recentMembers", "pendingCertifications", "recentPayments", "recentRequests"},
        )
        self.assertEqual(response.data["recentMembers"], [])
        self.assertEqual(response.data["pendingCertifications"], [])
        self.assertEqual(response.data["recentPayments"], [])
        self.assertEqual(response.data["recentRequests"], [])
        for value in response.data["stats"].values():
            self.assertIn(value, [0, 0.0])
