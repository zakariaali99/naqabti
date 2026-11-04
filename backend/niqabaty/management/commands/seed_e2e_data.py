"""Deterministic fixtures for the Playwright end-to-end suite.

Unlike ``seed_test_data`` (which generates tens of thousands of random rows for
load testing) this command creates a small, fixed cast of records that the E2E
specs address by name. Re-running it is safe: every record is looked up by a
natural key first.

Everything it creates is tagged with the ``E2E`` prefix or the ``@e2e.test``
email domain so ``--reset`` can remove exactly its own rows and nothing else.

    DJANGO_DB_NAME=/tmp/e2e.sqlite3 python manage.py migrate --noinput
    DJANGO_DB_NAME=/tmp/e2e.sqlite3 python manage.py seed_e2e_data --reset
"""
import io
from datetime import date
from decimal import Decimal

from django.conf import settings
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from niqabaty.models import (
    AcademicDegree,
    Branch,
    City,
    DoctorSpecialty,
    DoctorsMembership,
    Institution,
    MembershipType,
    Nationality,
    Payment,
    User,
)

# The specs import these same values from tests/web-frontend/fixtures/users.ts.
# Keep the two files in sync.
PASSWORD = "Passw0rd!"
EMAIL_DOMAIN = "e2e.test"
MARKER = "E2E"

ADMIN_EMAIL = f"admin@{EMAIL_DOMAIN}"
MANAGER_EMAIL = f"manager@{EMAIL_DOMAIN}"
DOCTOR_APPROVED_EMAIL = f"doctor.approved@{EMAIL_DOMAIN}"
DOCTOR_PENDING_EMAIL = f"doctor.pending@{EMAIL_DOMAIN}"
DOCTOR_APPLIED_EMAIL = f"doctor.applied@{EMAIL_DOMAIN}"
DOCTOR_OTHER_BRANCH_EMAIL = f"doctor.otherbranch@{EMAIL_DOMAIN}"

BRANCH_MAIN_PREFIX = "E2EM"
BRANCH_SUB_PREFIX = "E2ES"
BRANCH_OTHER_PREFIX = "E2EO"

DEGREE_BACHELOR = "E2E Bachelor"
DEGREE_PHD = "E2E PhD"

TYPE_ANNUAL = "E2E Annual"
TYPE_PHD_ANNUAL = "E2E PhD Annual"
TYPE_STUDENT = "E2E Student"

ANNUAL_PRICE = Decimal("500.00")
ANNUAL_DURATION_MONTHS = 12


class Command(BaseCommand):
    help = "Seed the deterministic fixture set used by the Playwright E2E suite."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Hard-delete the existing E2E fixtures before seeding.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Allow --reset even when pointed at the default db.sqlite3.",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self._guard_database(force=options["force"])
            self._reset()

        with transaction.atomic():
            self._seed()

        self.stdout.write(self.style.SUCCESS("E2E fixtures ready."))

    # ------------------------------------------------------------------ guards

    def _guard_database(self, *, force):
        """Refuse to wipe fixtures out of the developer's working database.

        --reset hard-deletes rows, so pointing it at the committed db.sqlite3 by
        forgetting DJANGO_DB_NAME would be destructive and silent.
        """
        if force:
            return

        current = str(settings.DATABASES["default"]["NAME"])
        default = str(settings.BASE_DIR / "db.sqlite3")
        if current == default:
            raise CommandError(
                "--reset refuses to run against the default database "
                f"({default}). Set DJANGO_DB_NAME to a throwaway file, or pass "
                "--force if you really mean it."
            )

    # ------------------------------------------------------------------- reset

    def _reset(self):
        """Hard-delete previous fixtures.

        BaseModel.delete() only soft-deletes, but the unique constraints on
        Branch.prefix, MembershipType.name and AcademicDegree.name are
        unconditional — a soft-deleted row would still collide on re-seed. So
        this goes through all_objects querysets, whose delete() is Django's
        real one.
        """
        users = User.all_objects.filter(email__endswith=f"@{EMAIL_DOMAIN}")
        user_ids = list(users.values_list("id", flat=True))

        Payment.all_objects.filter(user_id__in=user_ids).delete()
        DoctorsMembership.all_objects.filter(doctor_id__in=user_ids).delete()
        users.delete()

        MembershipType.all_objects.filter(name__startswith=MARKER).delete()
        # Sub-branches cascade from their parent, but delete children first so
        # the ordering doesn't depend on that.
        Branch.all_objects.filter(prefix__startswith=MARKER, parent__isnull=False).delete()
        Branch.all_objects.filter(prefix__startswith=MARKER).delete()
        AcademicDegree.all_objects.filter(name__startswith=MARKER).delete()
        DoctorSpecialty.all_objects.filter(name__startswith=MARKER).delete()
        Institution.all_objects.filter(name__startswith=MARKER).delete()
        City.all_objects.filter(name__startswith=MARKER).delete()
        Nationality.all_objects.filter(name__startswith=MARKER).delete()

        self.stdout.write("Removed previous E2E fixtures.")

    # -------------------------------------------------------------------- seed

    def _seed(self):
        # The frontend hides sidebar items and guards routes off group
        # permissions, so the groups have to exist before users join them.
        # setup_permissions writes progress unconditionally; swallow it.
        call_command("setup_permissions", stdout=io.StringIO())

        city = self._get_or_create(City, name=f"{MARKER} City", defaults={"name_ar": "مدينة الاختبار"})
        nationality = self._get_or_create(
            Nationality, name=f"{MARKER} Nationality", defaults={"name_ar": "جنسية الاختبار", "code": "E2E"}
        )
        specialty = self._get_or_create(DoctorSpecialty, name=f"{MARKER} Specialty")

        bachelor = self._get_or_create(
            AcademicDegree, name=DEGREE_BACHELOR, defaults={"allows_multiple_subscriptions": False}
        )
        phd = self._get_or_create(
            AcademicDegree, name=DEGREE_PHD, defaults={"allows_multiple_subscriptions": True}
        )

        main_branch = self._get_or_create(
            Branch,
            prefix=BRANCH_MAIN_PREFIX,
            defaults={"name": "E2E Main Branch", "city": "Tripoli", "is_active": True},
        )
        # Exercises the max-depth-2 hierarchy rule in Branch.clean().
        self._get_or_create(
            Branch,
            prefix=BRANCH_SUB_PREFIX,
            defaults={
                "name": "E2E Sub Branch",
                "city": "Tripoli",
                "is_active": True,
                "parent": main_branch,
            },
        )
        # A second root branch, so branch-scoping assertions have something the
        # manager is genuinely not allowed to see.
        other_branch = self._get_or_create(
            Branch,
            prefix=BRANCH_OTHER_PREFIX,
            defaults={"name": "E2E Other Branch", "city": "Benghazi", "is_active": True},
        )

        annual = self._get_or_create(
            MembershipType,
            name=TYPE_ANNUAL,
            defaults={
                "description": "Open to every academic degree.",
                "duration_months": ANNUAL_DURATION_MONTHS,
                "price": ANNUAL_PRICE,
                "is_active": True,
                "applicable_user_type": "doctor",
                "academic_degree": None,
            },
        )
        # Restricted to the PhD degree — the apply screen must not offer this to
        # a Bachelor doctor.
        self._get_or_create(
            MembershipType,
            name=TYPE_PHD_ANNUAL,
            defaults={
                "description": "Restricted to the PhD degree.",
                "duration_months": ANNUAL_DURATION_MONTHS,
                "price": Decimal("900.00"),
                "is_active": True,
                "applicable_user_type": "doctor",
                "academic_degree": phd,
            },
        )
        self._get_or_create(
            MembershipType,
            name=TYPE_STUDENT,
            defaults={
                "description": "Students only.",
                "duration_months": 6,
                "price": Decimal("100.00"),
                "is_active": True,
                "applicable_user_type": "student",
                "academic_degree": None,
            },
        )

        admin = self._upsert_user(
            email=ADMIN_EMAIL,
            username="e2e_admin",
            user_type="manager",
            is_staff=True,
            is_superuser=True,
            first_name_field="مدير",
            family_name="النظام",
        )
        self._join_group(admin, "Admin")

        manager = self._upsert_user(
            email=MANAGER_EMAIL,
            username="e2e_manager",
            user_type="manager",
            is_staff=True,
            first_name_field="مسؤول",
            family_name="الفرع",
        )
        # Manager group carries change_user, which _can_manage_doctor_action
        # requires before approve/reject will work.
        self._join_group(manager, "Manager")
        manager.branches.set([main_branch])
        main_branch.manager = manager
        main_branch.save()

        doctor_defaults = {
            "user_type": "doctor",
            "city": city,
            "nationality": nationality,
            "current_degree": bachelor,
            "specialty": specialty.name,
            "university_name": "E2E University",
            "graduation_year": 2015,
            "gender": "male",
        }

        approved = self._upsert_user(
            email=DOCTOR_APPROVED_EMAIL,
            username="e2e_doctor_approved",
            approval_status="approved",
            doctor_number="1001",
            first_name_field="طبيب",
            family_name="معتمد",
            **doctor_defaults,
        )
        approved.branches.set([main_branch])
        self._join_group(approved, "Doctor")

        pending = self._upsert_user(
            email=DOCTOR_PENDING_EMAIL,
            username="e2e_doctor_pending",
            approval_status="pending",
            doctor_number="1002",
            first_name_field="طبيب",
            family_name="منتظر",
            **doctor_defaults,
        )
        pending.branches.set([main_branch])
        self._join_group(pending, "Doctor")

        applied = self._upsert_user(
            email=DOCTOR_APPLIED_EMAIL,
            username="e2e_doctor_applied",
            approval_status="approved",
            doctor_number="1003",
            first_name_field="طبيب",
            family_name="متقدم",
            **doctor_defaults,
        )
        applied.branches.set([main_branch])
        self._join_group(applied, "Doctor")

        # Lives in the branch the manager does NOT manage — the negative case
        # for user_viewset's branch scoping.
        outsider = self._upsert_user(
            email=DOCTOR_OTHER_BRANCH_EMAIL,
            username="e2e_doctor_other",
            approval_status="approved",
            doctor_number="2001",
            first_name_field="طبيب",
            family_name="خارجي",
            **doctor_defaults,
        )
        outsider.branches.set([other_branch])
        self._join_group(outsider, "Doctor")

        # A pending application waiting for an admin to activate it.
        if not DoctorsMembership.objects.filter(doctor=applied).exists():
            DoctorsMembership.objects.create(
                doctor=applied,
                membership_type=annual,
                branch=main_branch,
                start_date=date.today(),
                status="pending",
                subscription_count=1,
            )

        self._report(
            [
                ("admin", ADMIN_EMAIL),
                ("manager", MANAGER_EMAIL),
                ("doctor (approved, no membership)", DOCTOR_APPROVED_EMAIL),
                ("doctor (awaiting approval)", DOCTOR_PENDING_EMAIL),
                ("doctor (pending membership)", DOCTOR_APPLIED_EMAIL),
                ("doctor (other branch)", DOCTOR_OTHER_BRANCH_EMAIL),
            ]
        )

    # ----------------------------------------------------------------- helpers

    def _get_or_create(self, model, defaults=None, **lookup):
        obj, _ = model.objects.get_or_create(defaults=defaults or {}, **lookup)
        return obj

    def _upsert_user(self, *, email, username, **fields):
        """Create or update a fixture user, always resetting the password.

        Uses all_objects so a soft-deleted leftover is revived rather than
        colliding with the unique_active_email constraint.
        """
        user = User.all_objects.filter(email=email).first()
        if user is None:
            user = User(username=username, email=email)

        for field, value in fields.items():
            setattr(user, field, value)
        user.is_active = True
        user.email_verified = True
        user.is_deleted = False
        user.language = "en"
        user.set_password(PASSWORD)
        user.save()
        return user

    def _join_group(self, user, group_name):
        group = Group.objects.filter(name=group_name).first()
        if group:
            user.groups.set([group])

    def _report(self, accounts):
        self.stdout.write("")
        self.stdout.write(f"Accounts (password: {PASSWORD})")
        for label, email in accounts:
            self.stdout.write(f"  {email:<34} {label}")
