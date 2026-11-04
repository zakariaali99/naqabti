from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from rest_framework import status
from rest_framework.test import APIClient

from niqabaty.utils.phone import normalize_phone, phone_variants

User = get_user_model()
PASSWORD = "Str0ngPass123!"


class NormalizePhoneTests(SimpleTestCase):
    def test_libyan_formats_become_international(self):
        for raw in ["0912345678", "912345678", "218912345678",
                    "00218912345678", "+218912345678", "+218 91 234 5678",
                    "091-234-5678"]:
            self.assertEqual(normalize_phone(raw), "+218912345678", raw)

    def test_other_values_are_left_alone(self):
        self.assertEqual(normalize_phone("+201001234567"), "+201001234567")
        self.assertEqual(normalize_phone("someuser"), "someuser")
        self.assertIsNone(normalize_phone(None))

    def test_variants_cover_old_stored_formats(self):
        self.assertEqual(
            set(phone_variants("0912345678")),
            {"0912345678", "+218912345678", "218912345678", "00218912345678"},
        )


class PhoneLoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def _login(self, identifier):
        return self.client.post(
            "/api/auth/login/",
            {"username": identifier, "password": PASSWORD},
            format="json",
        )

    def test_international_number_logs_in_with_any_format(self):
        User.objects.create_user(username="intl", email="intl@example.com",
                                 password=PASSWORD, phone_number="+218912345678")
        for typed in ["+218912345678", "0912345678", "00218912345678",
                      "912345678", "091 234 5678"]:
            self.assertEqual(self._login(typed).status_code, status.HTTP_200_OK, typed)

    def test_number_stored_locally_logs_in_with_international_format(self):
        User.objects.create_user(username="local", email="local@example.com",
                                 password=PASSWORD, phone_number="0927654321")
        for typed in ["0927654321", "+218927654321"]:
            self.assertEqual(self._login(typed).status_code, status.HTTP_200_OK, typed)

    def test_wrong_password_still_fails(self):
        User.objects.create_user(username="intl2", email="intl2@example.com",
                                 password=PASSWORD, phone_number="+218911111111")
        response = self.client.post(
            "/api/auth/login/",
            {"username": "0911111111", "password": "wrong-pass"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PhoneRegistrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def _register(self, phone, email):
        return self.client.post("/api/auth/register/", {
            "email": email,
            "password": PASSWORD,
            "confirm_password": PASSWORD,
            "phone_number": phone,
            "user_type": "doctor",
            "first_name": "New",
            "family_name": "User",
        }, format="json")

    def test_phone_is_saved_in_international_format(self):
        response = self._register("091 555 4444", "a@example.com")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(User.objects.get(email="a@example.com").phone_number, "+218915554444")

    def test_same_number_in_another_format_is_a_duplicate(self):
        User.objects.create_user(username="old", email="old@example.com",
                                 password=PASSWORD, phone_number="0915554444")
        response = self._register("+218915554444", "b@example.com")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone_number", response.data)
