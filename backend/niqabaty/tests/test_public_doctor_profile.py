from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from niqabaty.models import User, Branch, City, AcademicDegree, Certification, CertificationType


class PublicDoctorProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.branch = Branch.objects.create(name="نقابة طرابلس", prefix="TRP")
        self.city = City.objects.create(name="طرابلس", prefix="TIP")
        self.degree = AcademicDegree.objects.create(name="استشاري")
        
        self.doctor = User.objects.create_user(
            username="dr_ahmed",
            email="ahmed@example.com",
            phone_number="0912345678",
            first_name_field="أحمد",
            father_name="علي",
            family_name="السويسي",
            user_type="doctor",
            doctor_number="1234",
            specialty="جراحة عامة",
            bio="طبيب جراح متخصص في الجراحة العامة والمناظير",
            university_name="جامعة طرابلس",
            current_degree=self.degree,
            city=self.city,
            is_active=True,
            approval_status="approved",
            public_profile_fields="full_name,profile_image,specialty,bio,phone_number,city,current_degree,branches",
        )
        self.doctor.branches.add(self.branch)

        self.cert_type = CertificationType.objects.create(name="ترخيص مزاولة المهنة")
        self.cert = Certification.objects.create(
            doctor=self.doctor,
            certification_type=self.cert_type,
            issued_from="وزارة الصحة",
            issue_date="2022-01-01",
            expiry_date="2027-01-01",
        )

    def test_public_access_without_authentication_succeeds(self):
        """Unauthenticated client can fetch approved doctor's public profile."""
        response = self.client.get(f'/api/public/doctors/{self.doctor.username}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['username'], self.doctor.username)
        self.assertEqual(data['full_name'], self.doctor.full_name)
        self.assertEqual(data['specialty'], 'جراحة عامة')
        self.assertEqual(data['phone_number'], '0912345678')
        self.assertEqual(data['city_name'], 'طرابلس')
        self.assertEqual(data['degree_name'], 'استشاري')
        self.assertTrue(len(data['branches']) > 0)
        self.assertEqual(data['branches'][0]['name'], 'نقابة طرابلس')

    def test_hidden_fields_are_omitted(self):
        """Fields not in public_profile_fields (e.g. email, university_name, certifications) are omitted."""
        response = self.client.get(f'/api/public/doctors/{self.doctor.username}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertNotIn('email', data)
        self.assertNotIn('university_name', data)
        self.assertNotIn('certifications', data)

    def test_updating_public_fields_reflects_immediately(self):
        """Doctor can change public fields and payload dynamically updates."""
        self.doctor.public_profile_fields = "full_name,specialty,email,certifications"
        self.doctor.save()

        response = self.client.get(f'/api/public/doctors/{self.doctor.username}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertIn('email', data)
        self.assertEqual(data['email'], 'ahmed@example.com')
        self.assertIn('certifications', data)
        self.assertEqual(len(data['certifications']), 1)
        self.assertEqual(data['certifications'][0]['type_name'], 'ترخيص مزاولة المهنة')
        # phone_number and city are now hidden
        self.assertNotIn('phone_number', data)
        self.assertNotIn('city_name', data)

    def test_pending_doctor_returns_404(self):
        """Pending approval doctor profile is not publicly available."""
        self.doctor.approval_status = "pending"
        self.doctor.save()

        response = self.client.get(f'/api/public/doctors/{self.doctor.username}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_inactive_or_deleted_doctor_returns_404(self):
        """Inactive or soft-deleted doctors return 404."""
        self.doctor.is_active = False
        self.doctor.save()
        response = self.client.get(f'/api/public/doctors/{self.doctor.username}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        self.doctor.is_active = True
        self.doctor.delete()  # soft delete
        response = self.client.get(f'/api/public/doctors/{self.doctor.username}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_doctor_user_type_returns_404(self):
        """Non-doctor users (managers, students) cannot be queried as public doctors."""
        manager = User.objects.create_user(
            username="branch_manager",
            user_type="manager",
            is_active=True,
        )
        response = self.client.get(f'/api/public/doctors/{manager.username}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_security_sensitive_fields_never_leaked(self):
        """Sensitive internal database fields must NEVER be returned in public response."""
        response = self.client.get(f'/api/public/doctors/{self.doctor.username}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        forbidden_keys = [
            'password', 'is_staff', 'is_superuser', 'email_verified',
            'verification_code', 'groups', 'user_permissions',
            'is_deleted', 'history', 'passport_image', 'fcm_token'
        ]
        for key in forbidden_keys:
            self.assertNotIn(key, data, f"Security violation: {key} leaked in public profile response")
