from django.core import mail
from django.test import TestCase, override_settings

from niqabaty.utils.email_utils import _send_with_retry


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class EmailReplyToTests(TestCase):
    def test_app_emails_reply_to_support(self):
        self.assertTrue(_send_with_retry(
            'Subject', 'Body', 'Naqabti <support@naqabti.ly>',
            ['member@example.com'], '<p>Body</p>',
        ))
        sent = mail.outbox[0]
        self.assertEqual(sent.reply_to, ['support@naqabti.ly'])
        self.assertEqual(sent.from_email, 'Naqabti <support@naqabti.ly>')
        self.assertEqual(sent.alternatives[0][1], 'text/html')
