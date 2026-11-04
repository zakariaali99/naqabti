from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

class AuthRegistrationUniquenessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.existing_user = User.objects.create_user(
            username="existing_user",
            email="existing@example.com",
            password="Str0ngPass123!",
            phone_number="0921111111"
        )

    def test_register_duplicate_email_fails(self):
        payload = {
            "username": "new_user_1",
            "email": "existing@example.com",
            "password": "Str0ngPass123!",
            "confirm_password": "Str0ngPass123!",
            "phone_number": "0922222222",
            "user_type": "doctor",
            "first_name": "New",
            "father_name": "User",
            "grandfather_name": "One",
            "family_name": "Test"
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_register_duplicate_phone_fails(self):
        payload = {
            "username": "new_user_2",
            "email": "new_email@example.com",
            "password": "Str0ngPass123!",
            "confirm_password": "Str0ngPass123!",
            "phone_number": "0921111111",
            "user_type": "doctor",
            "first_name": "New",
            "father_name": "User",
            "grandfather_name": "Two",
            "family_name": "Test"
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone_number", response.data)

    def test_register_without_username_succeeds_and_generates_one(self):
        payload = {
            "email": "no_username@example.com",
            "password": "Str0ngPass123!",
            "confirm_password": "Str0ngPass123!",
            "user_type": "doctor",
            "first_name": "New",
            "family_name": "User",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get("username"))

        user = User.objects.get(email="no_username@example.com")
        self.assertTrue(user.username)

    def test_register_without_username_generates_unique_usernames(self):
        payload_1 = {
            "email": "same.prefix@example.com",
            "password": "Str0ngPass123!",
            "confirm_password": "Str0ngPass123!",
            "user_type": "doctor",
            "first_name": "New",
            "family_name": "One",
        }
        payload_2 = {
            "email": "same.prefix@other.com",
            "password": "Str0ngPass123!",
            "confirm_password": "Str0ngPass123!",
            "user_type": "doctor",
            "first_name": "New",
            "family_name": "Two",
        }
        response_1 = self.client.post("/api/auth/register/", payload_1, format="json")
        response_2 = self.client.post("/api/auth/register/", payload_2, format="json")

        self.assertEqual(response_1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_2.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response_1.data["username"], response_2.data["username"])

    def test_register_duplicate_username_fails(self):
        payload = {
            "username": "existing_user",
            "email": "another_new_email@example.com",
            "password": "Str0ngPass123!",
            "confirm_password": "Str0ngPass123!",
            "user_type": "doctor",
            "first_name": "New",
            "family_name": "User",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_register_phone_only_succeeds(self):
        payload = {
            "phone_number": "0923333333",
            "password": "Str0ngPass123!",
            "confirm_password": "Str0ngPass123!",
            "user_type": "doctor",
            "first_name": "New",
            "family_name": "User",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(phone_number="0923333333")
        self.assertIsNone(user.email)

    def test_register_phone_only_twice_succeeds(self):
        payload_1 = {
            "phone_number": "0924444444",
            "password": "Str0ngPass123!",
            "confirm_password": "Str0ngPass123!",
            "user_type": "doctor",
            "first_name": "New",
            "family_name": "One",
        }
        payload_2 = {
            "phone_number": "0925555555",
            "password": "Str0ngPass123!",
            "confirm_password": "Str0ngPass123!",
            "user_type": "doctor",
            "first_name": "New",
            "family_name": "Two",
        }
        response_1 = self.client.post("/api/auth/register/", payload_1, format="json")
        response_2 = self.client.post("/api/auth/register/", payload_2, format="json")

        self.assertEqual(response_1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_2.status_code, status.HTTP_201_CREATED)

    def test_register_without_email_or_phone_fails(self):
        payload = {
            "password": "Str0ngPass123!",
            "confirm_password": "Str0ngPass123!",
            "user_type": "doctor",
            "first_name": "New",
            "family_name": "User",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertIn("phone_number", response.data)

    def test_register_without_first_name_fails(self):
        payload = {
            "email": "missing_first_name@example.com",
            "password": "Str0ngPass123!",
            "confirm_password": "Str0ngPass123!",
            "user_type": "doctor",
            "family_name": "User",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("first_name", response.data)

    def test_register_without_family_name_fails(self):
        payload = {
            "email": "missing_family_name@example.com",
            "password": "Str0ngPass123!",
            "confirm_password": "Str0ngPass123!",
            "user_type": "doctor",
            "first_name": "New",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("family_name", response.data)
