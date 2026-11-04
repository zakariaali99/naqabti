import { test, expect } from '../../fixtures/auth';
import {
  ANNUAL_DURATION_MONTHS,
  ANNUAL_PRICE,
  BRANCH_MAIN_PREFIX,
  BRANCH_OTHER_PREFIX,
  DEGREE_BACHELOR,
  DOCTOR_OTHER_BRANCH_EMAIL,
  TYPE_ANNUAL,
  USERS,
} from '../../fixtures/users';
import { DoctorsListPage } from '../../pages/DoctorsListPage';
import { DoctorDetailPage } from '../../pages/DoctorDetailPage';
import { MembershipDetailPage } from '../../pages/MembershipDetailPage';
import { PaymentsPage } from '../../pages/PaymentsPage';

/**
 * The admin's side: find a doctor awaiting review, approve them, activate their
 * membership application, then approve the payment that follows.
 */
test.describe('Admin review journey', () => {
  const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  test('an admin can find a doctor by email in the directory', async ({ adminPage, adminApi }) => {
    const pending = await adminApi.findUserByEmail(USERS.doctorPending.email);
    const list = new DoctorsListPage(adminPage);

    await list.goto();
    await list.search(USERS.doctorPending.email);

    await expect(list.row(pending.id)).toBeVisible({ timeout: 15_000 });
  });

  test('an admin can move a doctor through pending, rejected and approved', async ({
    adminPage,
    adminApi,
  }) => {
    const branch = await adminApi.findBranchByPrefix(BRANCH_MAIN_PREFIX);
    const bachelor = await adminApi.findDegreeByName(DEGREE_BACHELOR);
    const doctor = await adminApi.createDoctor({
      email: `doctor.review.${unique()}@e2e.test`,
      branchId: branch.id,
      degreeId: bachelor.id,
      approvalStatus: 'pending',
    });

    const detail = new DoctorDetailPage(adminPage);
    await detail.goto(doctor.id);
    expect(await detail.currentStatus()).toBe('pending');

    // The doctor has a branch, so approval is available. Without one the
    // switcher keeps this button disabled.
    await expect(detail.statusButton('approved')).toBeEnabled();
    await detail.setStatus('approved');
    await expect
      .poll(async () => (await adminApi.findUserByEmail(doctor.email)).approval_status)
      .toBe('approved');

    await detail.setStatus('rejected');
    await expect
      .poll(async () => (await adminApi.findUserByEmail(doctor.email)).approval_status)
      .toBe('rejected');

    await detail.setStatus('pending');
    await expect
      .poll(async () => (await adminApi.findUserByEmail(doctor.email)).approval_status)
      .toBe('pending');
  });

  test('approval is blocked for a self-registered doctor until a branch is set', async ({
    adminPage,
    adminApi,
  }) => {
    // The registration wizard never asks for a branch, so every self-registered
    // doctor lands here — and the backend refuses to approve a branchless one.
    const email = `doctor.nobranch.${unique()}@e2e.test`;
    await adminApi.registerDoctor(email);
    const doctor = await adminApi.findUserByEmail(email);
    expect(doctor.branches ?? []).toHaveLength(0);

    const detail = new DoctorDetailPage(adminPage);
    await detail.goto(doctor.id);

    await expect(detail.statusButton('approved')).toBeDisabled();
    expect(await detail.currentStatus()).toBe('pending');
  });

  test('activating an application sets the amount and the end date', async ({
    adminPage,
    adminApi,
  }) => {
    const branch = await adminApi.findBranchByPrefix(BRANCH_MAIN_PREFIX);
    const bachelor = await adminApi.findDegreeByName(DEGREE_BACHELOR);
    const annual = await adminApi.findMembershipTypeByName(TYPE_ANNUAL);
    const doctor = await adminApi.createDoctor({
      email: `doctor.activate.${unique()}@e2e.test`,
      branchId: branch.id,
      degreeId: bachelor.id,
      approvalStatus: 'approved',
    });
    const membership = await adminApi.createMembership({
      doctorId: doctor.id,
      membershipTypeId: annual.id,
      branchId: branch.id,
      status: 'pending',
    });

    const detail = new MembershipDetailPage(adminPage);
    await detail.goto(membership.id);
    await expect(detail.membershipNumber()).not.toBeEmpty();

    await detail.approve();

    await expect
      .poll(async () => (await adminApi.membershipsForDoctor(doctor.id))[0].status)
      .toBe('active');

    const [stored] = await adminApi.membershipsForDoctor(doctor.id);
    expect(Number(stored.total_amount)).toBe(ANNUAL_PRICE);
    expect(stored.end_date, 'end_date is derived on activation').toBeTruthy();

    const start = new Date(stored.start_date);
    const end = new Date(stored.end_date);
    const monthsApart =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    expect(monthsApart).toBe(ANNUAL_DURATION_MONTHS);
  });

  test('rejecting an application cancels it', async ({ adminPage, adminApi }) => {
    const branch = await adminApi.findBranchByPrefix(BRANCH_MAIN_PREFIX);
    const annual = await adminApi.findMembershipTypeByName(TYPE_ANNUAL);
    const doctor = await adminApi.createDoctor({
      email: `doctor.rejectapp.${unique()}@e2e.test`,
      branchId: branch.id,
      approvalStatus: 'approved',
    });
    const membership = await adminApi.createMembership({
      doctorId: doctor.id,
      membershipTypeId: annual.id,
      branchId: branch.id,
      status: 'pending',
    });

    const detail = new MembershipDetailPage(adminPage);
    await detail.goto(membership.id);
    await detail.reject();

    await expect
      .poll(async () => (await adminApi.membershipsForDoctor(doctor.id))[0].status)
      .toBe('canceled');
  });

  test('an admin can approve a submitted payment', async ({ adminPage, adminApi }) => {
    const branch = await adminApi.findBranchByPrefix(BRANCH_MAIN_PREFIX);
    const annual = await adminApi.findMembershipTypeByName(TYPE_ANNUAL);
    const doctor = await adminApi.createDoctor({
      email: `doctor.payreview.${unique()}@e2e.test`,
      branchId: branch.id,
      approvalStatus: 'approved',
    });
    const membership = await adminApi.createMembership({
      doctorId: doctor.id,
      membershipTypeId: annual.id,
      branchId: branch.id,
      status: 'pending',
    });
    await adminApi.patchMembership(membership.id, { status: 'active' });
    const payment = await adminApi.addPayment(membership.id, ANNUAL_PRICE);

    const payments = new PaymentsPage(adminPage);
    await payments.goto();
    await expect(payments.row(payment.id)).toBeVisible({ timeout: 15_000 });

    await payments.approve(payment.id);

    await expect
      .poll(async () => (await adminApi.paymentsForDoctor(doctor.id))[0].status)
      .toBe('approved');

    // Paying in full settles the membership.
    const [stored] = await adminApi.membershipsForDoctor(doctor.id);
    expect(stored.payment_status).toBe('paid');
  });

  test('a branch manager only sees doctors from their own branch', async ({
    managerPage,
    adminApi,
  }) => {
    const inBranch = await adminApi.findUserByEmail(USERS.doctorApproved.email);
    const outsider = await adminApi.findUserByEmail(DOCTOR_OTHER_BRANCH_EMAIL);
    expect(outsider, `${DOCTOR_OTHER_BRANCH_EMAIL} should be seeded`).toBeTruthy();

    const otherBranch = await adminApi.findBranchByPrefix(BRANCH_OTHER_PREFIX);
    expect(otherBranch).toBeTruthy();

    const list = new DoctorsListPage(managerPage);
    await list.goto();
    await list.search('doctor.');

    const listed = await list.listedDoctorIds();
    expect(listed, 'the manager should see their own branch').toContain(inBranch.id);
    expect(listed, 'a doctor from another branch must be invisible').not.toContain(outsider.id);
  });
});
