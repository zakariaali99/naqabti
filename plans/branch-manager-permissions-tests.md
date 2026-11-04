# Plan: Branch Manager Permissions Tests

## Overview
This plan outlines the implementation of unit tests to ensure branch managers can only manage and view doctors and doctors_membership related to their branch.

## Current Project Analysis

### Models
- **Branch**: Has `manager` (ForeignKey to User), `parent` for hierarchy
- **User**: Has `user_type` ('doctor', 'student', 'manager', 'institution'), `branches` (ManyToManyField to Branch)
- **DoctorsMembership**: Has `doctor` (FK to User), `branch` (FK to Branch), `status`, `payment_status`

### Existing Permissions
- **UserViewSet**: Has branch-based filtering (managers see users from their branches)
- **DoctorsMembershipViewSet**: **Missing** branch-based filtering - returns ALL memberships

## Implementation Plan

### Phase 1: Test Infrastructure Setup

1. **Delete** `backend/niqabaty/tests.py`
2. **Create** `backend/niqabaty/tests/` directory
3. **Create** `backend/niqabaty/tests/__init__.py`
4. **Create** `backend/niqabaty/tests/conftest.py` - Common test fixtures:
   - `branch_factory` - Create test branches
   - `manager_user_factory` - Create manager user type
   - `admin_user_factory` - Create admin/institution user with branch membership
   - `doctor_user_factory` - Create doctor user type
   - `membership_type_factory` - Create membership type
   - `membership_factory` - Create doctors membership

### Phase 2: Model Relationship Tests

5. **Create** `backend/niqabaty/tests/test_models.py`:
   - Test Branch.manager relationship
   - Test User.branches ManyToMany relationship
   - Test DoctorsMembership-Branch relationship

### Phase 3: View Permission Tests

6. **Create** `backend/niqabaty/tests/test_views.py`:
   - Test manager assigned via Branch.manager can see their branch's doctors
   - Test admin/user with branch membership can see their branch's doctors
   - Test manager cannot see doctors from other branches
   - Test manager assigned via Branch.manager can see their branch's memberships
   - Test admin/user with branch membership can see their branch's memberships
   - Test manager cannot see memberships from other branches

### Phase 4: Data Retrieval Tests

7. **Create** `backend/niqabaty/tests/test_permissions.py`:
   - Test GET /api/users/ returns only branch-related doctors
   - Test GET /api/doctors-memberships/ returns only branch-related memberships
   - Test filtered queries work correctly

## Test Scenarios Summary

| Scenario | User Type | Permission |
|----------|-----------|------------|
| Manager via Branch.manager | manager | Can manage doctors/memberships of that branch |
| Admin via User.branches | manager/institution | Can view doctors/memberships of assigned branches |
| Superuser | superuser | Can view all doctors/memberships |
| Other users | doctor/student | Cannot view any branch data |

## Notes
- The DoctorsMembershipViewSet.get_queryset() needs branch-based filtering added
- Tests will use Django's test client with JWT authentication
- Each test will create isolated test data