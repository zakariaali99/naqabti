from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from niqabaty.utils.email_utils import send_verification_email

User = get_user_model()


class Command(BaseCommand):
    help = 'Test email sending functionality'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User email to send test to')

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            user = User.objects.get(email=email)
            self.stdout.write(f'Found user: {user.username}')
            
            code = send_verification_email(user)
            
            self.stdout.write(self.style.SUCCESS(
                f'✓ Email sent successfully!'
            ))
            self.stdout.write(f'Verification code: {code}')
            self.stdout.write(f'Code stored in DB: {user.verification_code}')
            self.stdout.write(f'Code created at: {user.verification_code_created}')
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'✗ User with email {email} not found'))
        except User.MultipleObjectsReturned:
            self.stdout.write(self.style.ERROR(f'✗ Multiple users with email {email} found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {str(e)}'))
            import traceback
            self.stdout.write(traceback.format_exc())
