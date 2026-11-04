import random
import logging
import threading
import time
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)

#: Background send threads are named so tests can join exactly these and not
#: whatever other daemon threads (firebase, grpc) happen to be running.
EMAIL_THREAD_NAME = 'niqabaty-email-send'


def generate_verification_code():
    """Generate a 6-digit verification code."""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])


def _build_html_message(title, user, code, expires_in='24 hours'):
    """Build an HTML email template for better deliverability."""
    return f'''
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0066cc; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Naqabti</h1>
  </div>
  <div style="padding: 30px; background-color: #f9f9f9;">
    <h2 style="color: #333; margin-top: 0;">{title}</h2>
    <p style="color: #555;">Hello {user.full_name or user.username},</p>
    <p style="color: #555;">Your verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #0066cc; background: white; padding: 15px 30px; border-radius: 8px; display: inline-block;">{code}</span>
    </div>
    <p style="color: #888; font-size: 14px;">This code expires in {expires_in}.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #aaa; font-size: 12px;">If you didn't request this, please ignore this email.</p>
  </div>
  <div style="text-align: center; padding: 15px; color: #999; font-size: 11px;">
    &copy; Naqabti
  </div>
</div>'''


def _send_with_retry(subject, message, from_email, recipient_list, html_message=None, max_retries=3):
    """Send email with retry logic and exponential backoff."""
    for attempt in range(max_retries):
        try:
            send_mail(
                subject,
                message,
                from_email,
                recipient_list,
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                logger.error(
                    "Email failed after %d attempts to %s: %s",
                    max_retries, recipient_list, e,
                )
                return False
    return False


def _send_email_async(subject, message, from_email, recipient_list, html_message=None):
    """Send email in a background thread so the HTTP request doesn't block."""
    if not _send_with_retry(subject, message, from_email, recipient_list, html_message):
        logger.error("Gave up sending email to %s after retries", recipient_list)


def send_verification_email(user):
    """Send verification code to user's email."""
    code = generate_verification_code()
    user.verification_code = code
    user.verification_code_created = timezone.now()
    user.save(update_fields=['verification_code', 'verification_code_created'])

    subject = 'Verify Your Email - Naqabti'
    text_message = f'''
Hello {user.full_name or user.username},

Your verification code is: {code}

This code will expire in 24 hours.

If you didn't request this code, please ignore this email.

Best regards,
Naqabti Team
    '''
    html_message = _build_html_message('Verify Your Email', user, code)

    threading.Thread(
        target=_send_email_async,
        args=(subject, text_message, settings.DEFAULT_FROM_EMAIL, [user.email], html_message),
        name=EMAIL_THREAD_NAME,
        daemon=True,
    ).start()
    return code


# Email verification codes last a day; password reset codes are short-lived.
EMAIL_CODE_TTL = timedelta(hours=24)
PASSWORD_RESET_CODE_TTL = timedelta(minutes=30)


def is_verification_code_valid(user, ttl=EMAIL_CODE_TTL):
    """Check if the user's emailed code is younger than ``ttl``."""
    if not user.verification_code_created:
        return False

    expiry_time = user.verification_code_created + ttl
    return timezone.now() < expiry_time


def send_password_reset_email(user):
    """Send password reset code to user's email."""
    try:
        code = generate_verification_code()
        user.verification_code = code
        user.verification_code_created = timezone.now()
        user.save(update_fields=['verification_code', 'verification_code_created'])

        subject = 'Password Reset - Naqabti'
        text_message = f'''
Hello {user.full_name or user.username},

You requested a password reset. Your verification code is: {code}

This code will expire in 30 minutes.

If you didn't request this, please ignore this email.

Best regards,
Naqabti Team
        '''
        html_message = _build_html_message('Password Reset', user, code, expires_in='30 minutes')

        threading.Thread(
            target=_send_email_async,
            args=(subject, text_message, settings.DEFAULT_FROM_EMAIL, [user.email], html_message),
            name=EMAIL_THREAD_NAME,
            daemon=True,
        ).start()
        return code
    except Exception as e:
        logger.error("Error preparing password reset email for user %s: %s", user.id, e)
        raise
