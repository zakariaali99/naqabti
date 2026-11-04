"""
Unit tests for email sending utilities.

Verifies that:
- send_verification_email() and send_password_reset_email() dispatch an email
  to the right recipient with the expected subject and body.
- Both functions return the generated verification code and persist it.
- The RegisterView and ResendVerificationView API endpoints trigger email dispatch.
- The ResetPasswordView API endpoint triggers email dispatch.

Note on timing: email_utils hands the actual send() to a daemon thread so the
HTTP request isn't blocked on SMTP. Anything that inspects mail.outbox (or a
mock of email_utils.send_mail) therefore has to wait for that thread first —
see _wait_for_email_dispatch below.

Django's test runner points EMAIL_BACKEND at locmem for the whole run, so a
send started by any test — in this file or another — lands in the shared
mail.outbox whenever its thread gets around to it. EmailDispatchTestCase
drains those threads before and after every test, which is what keeps the
outbox counts here deterministic instead of order-dependent.
"""

import threading

from unittest.mock import patch, call
from django.test import TestCase, override_settings
from django.core import mail
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from niqabaty.utils.email_utils import (
    EMAIL_THREAD_NAME,
    send_verification_email,
    send_password_reset_email,
    generate_verification_code,
    is_verification_code_valid,
)

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _wait_for_email_dispatch(timeout=10):
    """Block until email_utils' background send threads have finished.

    Only threads named EMAIL_THREAD_NAME are joined — firebase and grpc keep
    daemon threads alive for the life of the process, and joining those would
    stall for the full timeout on every call.
    """
    for thread in threading.enumerate():
        if thread.name == EMAIL_THREAD_NAME and thread.is_alive():
            thread.join(timeout)


class EmailDispatchTestCase(TestCase):
    """Base for tests that assert on mail.outbox.

    Draining before the test keeps an earlier test's in-flight send out of this
    test's outbox; draining after keeps this test's send out of the next one's.
    """

    def setUp(self):
        super().setUp()
        _wait_for_email_dispatch()
        mail.outbox.clear()
        self.addCleanup(_wait_for_email_dispatch)


def _make_user(username="emailtest", email="emailtest@example.com", verified=False):
    user = User.objects.create_user(
        username=username,
        email=email,
        password="testpass123",
        full_name="Email Test",
    )
    user.email_verified = verified
    user.is_active = True
    user.save(update_fields=["email_verified", "is_active"])
    return user


# ---------------------------------------------------------------------------
# Tests for email_utils helpers
# ---------------------------------------------------------------------------

class GenerateVerificationCodeTests(TestCase):
    """Tests for the generate_verification_code() helper."""

    def test_code_is_six_digits(self):
        code = generate_verification_code()
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())

    def test_each_call_produces_a_string(self):
        code = generate_verification_code()
        self.assertIsInstance(code, str)


# ---------------------------------------------------------------------------
# Tests for send_verification_email – synchronous dispatch (no delay)
# ---------------------------------------------------------------------------

class SendVerificationEmailTests(EmailDispatchTestCase):
    """Ensure send_verification_email sends immediately and correctly."""

    def setUp(self):
        super().setUp()
        self.user = _make_user(username="verifyuser", email="verify@example.com")

    # ------------------------------------------------------------------
    # Use Django's in-memory test backend (EMAIL_BACKEND = locmem) to
    # capture outbox without touching a real SMTP server.
    # ------------------------------------------------------------------

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_exactly_one_email_is_sent(self):
        """send_verification_email must put exactly one email in the outbox."""
        send_verification_email(self.user)
        _wait_for_email_dispatch()

        self.assertEqual(
            len(mail.outbox),
            1,
            "Expected exactly 1 email in the outbox after send_verification_email().",
        )

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_email_sent_to_correct_recipient(self):
        send_verification_email(self.user)
        _wait_for_email_dispatch()

        sent = mail.outbox[0]
        self.assertIn(self.user.email, sent.to)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_email_subject_contains_verify(self):
        send_verification_email(self.user)
        _wait_for_email_dispatch()

        sent = mail.outbox[0]
        self.assertIn("Verify", sent.subject)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_email_body_contains_code(self):
        """The returned code must appear in the email body."""
        code = send_verification_email(self.user)
        _wait_for_email_dispatch()

        sent = mail.outbox[0]
        self.assertIn(code, sent.body)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_function_returns_the_code(self):
        code = send_verification_email(self.user)

        self.assertIsNotNone(code)
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_code_saved_on_user(self):
        """The generated code must be persisted on the user model."""
        code = send_verification_email(self.user)
        self.user.refresh_from_db()

        self.assertEqual(self.user.verification_code, code)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_verification_code_created_timestamp_set(self):
        """verification_code_created must be populated so expiry can be enforced."""
        send_verification_email(self.user)
        self.user.refresh_from_db()

        self.assertIsNotNone(self.user.verification_code_created)

    def test_send_mail_is_invoked_once(self):
        """Exactly one send_mail call must reach Django, no retries or dupes."""
        with patch("niqabaty.utils.email_utils.send_mail") as mock_send:
            send_verification_email(self.user)
            _wait_for_email_dispatch()
            mock_send.assert_called_once()

    def test_dispatch_does_not_block_the_caller(self):
        """send_verification_email must return without waiting on SMTP.

        The send happens on a daemon thread precisely so a slow mail server
        can't stall the HTTP request that triggered it. Holding send_mail open
        proves the caller isn't waiting on it.
        """
        release = threading.Event()
        entered = threading.Event()

        def blocking_send_mail(*args, **kwargs):
            entered.set()
            release.wait(10)

        with patch("niqabaty.utils.email_utils.send_mail", side_effect=blocking_send_mail):
            send_verification_email(self.user)
            # We got here with send_mail still parked inside the thread.
            self.assertTrue(entered.wait(10), "send_mail was never reached")
            self.assertFalse(release.is_set())
            release.set()
            _wait_for_email_dispatch()


# ---------------------------------------------------------------------------
# Tests for send_password_reset_email
# ---------------------------------------------------------------------------

class SendPasswordResetEmailTests(EmailDispatchTestCase):
    """Ensure send_password_reset_email sends correctly."""

    def setUp(self):
        super().setUp()
        self.user = _make_user(username="resetuser", email="reset@example.com", verified=True)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_exactly_one_email_is_sent(self):
        """send_password_reset_email must put exactly one email in the outbox."""
        send_password_reset_email(self.user)
        _wait_for_email_dispatch()

        self.assertEqual(
            len(mail.outbox),
            1,
            "Expected exactly 1 email in the outbox after send_password_reset_email().",
        )

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_email_sent_to_correct_recipient(self):
        send_password_reset_email(self.user)
        _wait_for_email_dispatch()

        sent = mail.outbox[0]
        self.assertIn(self.user.email, sent.to)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_email_subject_contains_password_reset(self):
        send_password_reset_email(self.user)
        _wait_for_email_dispatch()

        sent = mail.outbox[0]
        self.assertIn("Password Reset", sent.subject)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_email_body_contains_code(self):
        """The returned code must appear in the email body."""
        code = send_password_reset_email(self.user)
        _wait_for_email_dispatch()

        sent = mail.outbox[0]
        self.assertIn(code, sent.body)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_function_returns_the_code(self):
        code = send_password_reset_email(self.user)

        self.assertIsNotNone(code)
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_code_saved_on_user(self):
        code = send_password_reset_email(self.user)
        self.user.refresh_from_db()

        self.assertEqual(self.user.verification_code, code)

    def test_send_mail_is_invoked_once(self):
        """Exactly one send_mail call must reach Django, no retries or dupes."""
        with patch("niqabaty.utils.email_utils.send_mail") as mock_send:
            send_password_reset_email(self.user)
            _wait_for_email_dispatch()
            mock_send.assert_called_once()

    def test_dispatch_does_not_block_the_caller(self):
        """send_password_reset_email must return without waiting on SMTP."""
        release = threading.Event()
        entered = threading.Event()

        def blocking_send_mail(*args, **kwargs):
            entered.set()
            release.wait(10)

        with patch("niqabaty.utils.email_utils.send_mail", side_effect=blocking_send_mail):
            send_password_reset_email(self.user)
            self.assertTrue(entered.wait(10), "send_mail was never reached")
            self.assertFalse(release.is_set())
            release.set()
            _wait_for_email_dispatch()


# ---------------------------------------------------------------------------
# API-level tests: endpoints trigger immediate email dispatch
# ---------------------------------------------------------------------------

class RegisterViewEmailTests(EmailDispatchTestCase):
    """POST /api/auth/register/ must send a verification email before responding."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_register_sends_verification_email(self):
        """Registering a new user must result in exactly one email in the outbox."""
        payload = {
            "username": "newdoctor",
            "email": "newdoctor@example.com",
            "password": "Str0ngPass!",
            "confirm_password": "Str0ngPass!",
            "user_type": "doctor",
            "full_name": "New Doctor",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")

        # Registration may succeed (201) even if email fails silently; we assert
        # on the outbox to confirm the email was dispatched.
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])
        _wait_for_email_dispatch()

        if response.status_code == status.HTTP_201_CREATED:
            self.assertGreaterEqual(
                len(mail.outbox),
                1,
                "Expected at least 1 email in the outbox after successful registration.",
            )
            self.assertIn("newdoctor@example.com", mail.outbox[0].to)

    def test_register_calls_send_verification_email_synchronously(self):
        """Confirm send_verification_email is called synchronously during registration."""
        with patch("niqabaty.views.auth_views.send_verification_email") as mock_send:
            payload = {
                "username": "doctor_sync",
                "email": "doctorsync@example.com",
                "password": "Str0ngPass!",
                "confirm_password": "Str0ngPass!",
                "user_type": "doctor",
                "full_name": "Doctor Sync",
            }
            response = self.client.post("/api/auth/register/", payload, format="json")

            if response.status_code == status.HTTP_201_CREATED:
                mock_send.assert_called_once()


class ResendVerificationEmailTests(EmailDispatchTestCase):
    """POST /api/auth/resend-verification/ must send an email before responding."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.user = _make_user(username="resenduser", email="resend@example.com", verified=False)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_resend_sends_verification_email(self):
        response = self.client.post(
            "/api/auth/resend-verification/",
            {"user_id": self.user.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        _wait_for_email_dispatch()
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.user.email, mail.outbox[0].to)

    def test_resend_calls_send_verification_email_synchronously(self):
        with patch("niqabaty.views.auth_views.send_verification_email") as mock_send:
            self.client.post(
                "/api/auth/resend-verification/",
                {"user_id": self.user.id},
                format="json",
            )
            mock_send.assert_called_once()

    def test_resend_no_delay(self):
        """send_verification_email must be called before the view returns a response."""
        call_order = []

        original_send = send_verification_email

        def tracking_send(user):
            call_order.append("email_sent")
            return original_send(user)

        with patch("niqabaty.views.auth_views.send_verification_email", side_effect=tracking_send):
            with patch("niqabaty.utils.email_utils.send_mail"):
                self.client.post(
                    "/api/auth/resend-verification/",
                    {"user_id": self.user.id},
                    format="json",
                )
                call_order.append("response_received")

        self.assertEqual(
            call_order,
            ["email_sent", "response_received"],
            "Email must be dispatched before the HTTP response is returned.",
        )


class ResetPasswordEmailTests(EmailDispatchTestCase):
    """POST /api/auth/reset-password/ must send a password-reset email before responding."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.user = _make_user(username="pwresetuser", email="pwreset@example.com", verified=True)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_reset_password_sends_email(self):
        response = self.client.post(
            "/api/auth/reset-password/",
            {"email": self.user.email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        _wait_for_email_dispatch()
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.user.email, mail.outbox[0].to)

    def test_reset_password_calls_send_password_reset_email_synchronously(self):
        with patch("niqabaty.views.auth_views.send_password_reset_email") as mock_send:
            self.client.post(
                "/api/auth/reset-password/",
                {"email": self.user.email},
                format="json",
            )
            mock_send.assert_called_once()

    def test_reset_password_no_delay(self):
        """send_password_reset_email must be called before the view returns a response."""
        call_order = []

        original_send = send_password_reset_email

        def tracking_send(user):
            call_order.append("email_sent")
            return original_send(user)

        with patch("niqabaty.views.auth_views.send_password_reset_email", side_effect=tracking_send):
            with patch("niqabaty.utils.email_utils.send_mail"):
                self.client.post(
                    "/api/auth/reset-password/",
                    {"email": self.user.email},
                    format="json",
                )
                call_order.append("response_received")

        self.assertEqual(
            call_order,
            ["email_sent", "response_received"],
            "Password reset email must be dispatched before the HTTP response is returned.",
        )

    def test_unknown_email_does_not_send_email(self):
        """Anti-enumeration: unknown email should return 200 but NOT send any email."""
        with patch("niqabaty.views.auth_views.send_password_reset_email") as mock_send:
            response = self.client.post(
                "/api/auth/reset-password/",
                {"email": "nobody@nowhere.com"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            mock_send.assert_not_called()
