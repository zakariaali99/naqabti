"""Shared test factories for niqabaty tests."""
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission

from niqabaty.models import (
    AcademicDegree,
    Branch,
    DoctorsMembership,
    DoctorsMembershipRenewHistory,
    MembershipType,
    Payment,
)

User = get_user_model()


def create_branch(*, name: str, prefix: str, manager=None, parent=None):
    return Branch.objects.create(
        name=name,
        prefix=prefix,
        manager=manager,
        parent=parent,
        city="Tripoli",
        is_active=True,
    )


def create_manager(*, username: str):
    return User.objects.create_user(
        username=username,
        email=f"{username}@test.com",
        password="testpass123",
        user_type="manager",
    )


def create_institution(*, username: str):
    return User.objects.create_user(
        username=username,
        email=f"{username}@test.com",
        password="testpass123",
        user_type="institution",
    )


def create_doctor(*, username: str, full_name: str = "Doctor Test", current_degree=None):
    return User.objects.create_user(
        username=username,
        email=f"{username}@test.com",
        password="testpass123",
        user_type="doctor",
        full_name=full_name,
        current_degree=current_degree,
    )


def create_student(*, username: str):
    return User.objects.create_user(
        username=username,
        email=f"{username}@test.com",
        password="testpass123",
        user_type="student",
    )


def create_superuser(*, username: str = "root"):
    return User.objects.create_superuser(
        username=username,
        email=f"{username}@test.com",
        password="testpass123",
    )


def create_academic_degree(*, name: str = "Bachelor", allows_multiple_subscriptions: bool = False):
    return AcademicDegree.objects.create(
        name=name,
        allows_multiple_subscriptions=allows_multiple_subscriptions,
    )


def create_membership_type(
    *,
    name: str = "Annual",
    academic_degree=None,
    duration_months: int = 12,
    price: Decimal = Decimal("500.00"),
    applicable_user_type: str = "doctor",
):
    return MembershipType.objects.create(
        name=name,
        description=f"{name} description",
        duration_months=duration_months,
        price=price,
        is_active=True,
        applicable_user_type=applicable_user_type,
        academic_degree=academic_degree,
    )


def create_membership(
    *,
    doctor,
    branch,
    membership_type=None,
    status="pending",
    total_amount: Decimal = Decimal("500.00"),
    paid_amount: Decimal = Decimal("0.00"),
    end_date=None,
):
    membership_type = membership_type or create_membership_type()
    return DoctorsMembership.objects.create(
        doctor=doctor,
        membership_type=membership_type,
        branch=branch,
        start_date=date.today(),
        end_date=end_date if end_date is not None else date.today() + timedelta(days=365),
        status=status,
        total_amount=total_amount,
        paid_amount=paid_amount,
    )


def create_payment(*, user, membership=None, amount: Decimal = Decimal("100.00"), status: str = "pending"):
    return Payment.objects.create(
        user=user,
        membership=membership,
        amount=amount,
        payment_method="cash",
        status=status,
    )


def create_renew_history(
    *,
    membership,
    amount: Decimal = Decimal("500.00"),
    paid_amount: Decimal = Decimal("0.00"),
    new_end_date=None,
):
    return DoctorsMembershipRenewHistory.objects.create(
        membership=membership,
        previous_end_date=membership.end_date,
        new_end_date=new_end_date or (date.today() + timedelta(days=365)),
        amount=amount,
        paid_amount=paid_amount,
    )


def grant_user_change_permission(*, user):
    """Grant Django model permission required to edit user-like resources."""
    permission = Permission.objects.get(codename="change_user")
    user.user_permissions.add(permission)
    return user
