# Backend tests

Plain `django.test.TestCase` + `rest_framework.test.APIClient`. There is no
pytest configuration in this repo despite `pytest`/`factory-boy` appearing in
`requirements.txt` — those declarations are unused. Run everything with Django's
own runner:

```bash
cd backend
python manage.py test niqabaty              # whole suite
python manage.py test niqabaty.tests.test_membership_degree_rules -v 2
```

The runner creates and destroys its own `test_` database, so it never touches
`db.sqlite3`.

## Fixtures

`factories.py` holds plain functions, not factory-boy classes. Prefer them over
hand-rolling model instances so the required-field set stays in one place:

| Helper | Notes |
|---|---|
| `create_branch(name=, prefix=, manager=, parent=)` | `prefix` is globally unique — give each test its own |
| `create_doctor(username=, current_degree=)` | `user_type='doctor'`, password `testpass123` |
| `create_student`, `create_manager`, `create_institution`, `create_superuser` | same password |
| `create_academic_degree(name=, allows_multiple_subscriptions=)` | the multi-period flag |
| `create_membership_type(name=, academic_degree=, duration_months=, price=)` | `academic_degree=None` means open to every degree |
| `create_membership(doctor=, branch=, membership_type=, status=)` | defaults to 500.00 / pending |
| `create_payment(user=, membership=, amount=, status=)` | `Payment.save()` recomputes the membership's `paid_amount` |
| `create_renew_history(membership=, amount=, paid_amount=)` | for the payment-distribution tests |
| `grant_user_change_permission(user=)` | the model perm `_can_manage_doctor_action` checks |

Most models soft-delete (`BaseModel.delete()` sets `is_deleted`), so
`Model.objects` hides deleted rows and `Model.all_objects` shows them. Assert
against whichever one matches what you mean.

## What each module covers

| Module | Area |
|---|---|
| `test_auth_registration_uniqueness` | email/phone uniqueness, incl. reuse after soft delete |
| `test_email_sending` | verification / reset emails. **These dispatch on a daemon thread** — call `_wait_for_email_dispatch()` before touching `mail.outbox` |
| `test_users_api_branch_scope`, `_filters`, `_actions_permissions` | who can see and act on which users |
| `test_user_branch_dynamic_field_validation` | required branch, required per-branch custom fields, `doctor_number` uniqueness |
| `test_memberships_api_branch_scope`, `_filters` | membership visibility and query params |
| `test_membership_degree_rules` | degree ↔ membership-type gate, `subscription_count` |
| `test_membership_type_degree_filter` | what `GET /api/membership-types/` offers each role |
| `test_membership_payments` | `add_payment` validation and oldest-first renewal distribution |
| `test_membership_status_notifications` | the "approved, please pay" notification on pending → active |
| `test_payment_review_flow` | payment visibility, approve/reject gating |
| `test_branch_model`, `test_user_branch_relations_model` | model-level hierarchy and relations |
| `test_dashboard_summary_permissions`, `test_medical_reports` | dashboard scoping, medical reports |

End-to-end coverage of the doctor and admin journeys lives in
`tests/web-frontend/` (Playwright, real backend) — see its README.
