# Email Fixes — Free Implementation Plan

## Problem
Password reset emails are slow (5-15s delay) and sometimes don't arrive. Root causes: synchronous SMTP blocking, no error handling, no retry logic, plain text emails flagged as spam.

## Fix 1: Send emails asynchronously (non-blocking)

**File:** `backend/niqabaty/utils/email_utils.py`

Add a background thread helper so the HTTP response returns instantly instead of waiting for Gmail's SMTP:

```python
import threading

def _send_email_async(subject, message, from_email, recipient_list):
    """Send email in a background thread"""
    try:
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send email to {recipient_list}: {e}")
```

Replace direct `send_mail()` calls in both `send_verification_email()` and `send_password_reset_email()` with:
```python
threading.Thread(
    target=_send_email_async,
    args=(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
).start()
return code
```

**Why:** The request no longer hangs while waiting for Gmail. User gets instant feedback.

---

## Fix 2: Add logging (replace bare print)

**File:** `backend/niqabaty/utils/email_utils.py`

- Add at top of file:
  ```python
  import logging
  logger = logging.getLogger(__name__)
  ```
- Wrap `send_password_reset_email()` in try/catch (currently has none)
- Replace all `print()` calls with `logger.info()` / `logger.error()`

---

## Fix 3: Remove credential-printing debug lines

**File:** `backend/niqabaty/utils/email_utils.py`

Delete lines 34-41 from `send_verification_email()`:
```python
print(settings.EMAIL_BACKEND)
print(settings.EMAIL_HOST)
print(settings.EMAIL_PORT)
print(settings.EMAIL_USE_TLS)
print(settings.EMAIL_USE_SSL)
print(settings.EMAIL_HOST_USER)
print(settings.EMAIL_HOST_PASSWORD)
print(settings.DEFAULT_FROM_EMAIL)
```

**Why:** These leak SMTP username and password to console/logs on every email send.

---

## Fix 4: Add retry logic (3 attempts, exponential backoff)

**File:** `backend/niqabaty/utils/email_utils.py`

Add retry helper:
```python
import time

def _send_with_retry(subject, message, from_email, recipient_list, max_retries=3):
    for attempt in range(max_retries):
        try:
            send_mail(subject, message, from_email, recipient_list, fail_silently=False)
            return True
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # 1s, 2s, 4s
            else:
                logger.error(f"Email failed after {max_retries} attempts: {e}")
                return False
    return False
```

Wire into `_send_email_async`:
```python
def _send_email_async(subject, message, from_email, recipient_list):
    if not _send_with_retry(subject, message, from_email, recipient_list):
        logger.error(f"Gave up sending email to {recipient_list}")
```

**Why:** Temporary Gmail delays or throttling don't cause permanent failures.

---

## Fix 5: Add HTML email template

**File:** `backend/niqabaty/utils/email_utils.py`

Gmail prioritizes HTML-formatted emails over plain text. Add `html_message` to both send functions:

```python
html_message = f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0066cc; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Naqabti</h1>
  </div>
  <div style="padding: 30px; background-color: #f9f9f9;">
    <p>Hello {user.full_name or user.username},</p>
    <p>Your verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #0066cc; background: white; padding: 15px 30px; border-radius: 8px;">{code}</span>
    </div>
    <p style="color: #666;">This code expires in 24 hours.</p>
    <hr style="border: none; border-top: 1px solid #ddd;">
    <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
  </div>
</div>
"""

send_mail(
    subject,
    message,
    from_email,
    [user.email],
    html_message=html_message,
    fail_silently=False,
)
```

**Why:** HTML emails have higher deliverability and look more professional.

---

## Summary

| # | Change | Lines affected | Impact |
|---|--------|---------------|--------|
| 1 | Async sending via background thread | +15 | High — no more blocking |
| 2 | Proper logging + try/catch | +8 | High — no more silent failures |
| 3 | Remove credential prints | -8 | Medium — security |
| 4 | Retry with exponential backoff | +14 | High — resilience |
| 5 | HTML email template | +25 | Medium — deliverability |

**Total:** ~1 file edited, ~54 lines added/removed. Zero cost.
