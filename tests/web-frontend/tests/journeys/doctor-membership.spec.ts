import { test, expect, newAuthedPage } from '../../fixtures/auth';
import {
  ANNUAL_PRICE,
  BRANCH_MAIN_PREFIX,
  DEGREE_BACHELOR,
  PASSWORD,
  TYPE_ANNUAL,
  TYPE_PHD_ANNUAL,
} from '../../fixtures/users';
import { RegisterPage } from '../../pages/RegisterPage';
import { MemberMembershipPage } from '../../pages/MemberMembershipPage';

/**
 * The doctor's side of the product: sign up, apply for a membership, pay.
 *
 * Each test creates its own doctor via the API so the specs don't depend on
 * each other's leftovers — the suite shares one database.
 */
test.describe('Doctor member journey', () => {
  const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  test('a new doctor can register and lands signed in, pending approval', async ({
    page,
    adminApi,
  }) => {
    const email = `doctor.new.${unique()}@e2e.test`;
    const register = new RegisterPage(page);

    await register.goto();
    await register.chooseAccountType('doctor');
    await register.fillCredentials({
      firstName: 'أحمد',
      familyName: 'الجديد',
      email,
      password: PASSWORD,
    });
    await register.submit();

    // Registration auto-logs the doctor in and drops them on the dashboard.
    await expect(page).toHaveURL(/\/(\?.*)?$|\/member/, { timeout: 20_000 });

    const created = await adminApi.findUserByEmail(email);
    expect(created, `no user was created for ${email}`).toBeTruthy();
    expect(created.user_type).toBe('doctor');
    // Doctors always start unapproved — an admin has to review them.
    expect(created.approval_status).toBe('pending');
    // The wizard never asks for a branch, so a fresh doctor has none. That is
    // exactly why the admin's Approve button stays disabled until one is set.
    expect(created.branches ?? []).toHaveLength(0);
  });

  test('the apply screen offers only membership types the doctor qualifies for', async ({
    browser,
    adminApi,
  }) => {
    const branch = await adminApi.findBranchByPrefix(BRANCH_MAIN_PREFIX);
    const bachelor = await adminApi.findDegreeByName(DEGREE_BACHELOR);
    const email = `doctor.apply.${unique()}@e2e.test`;
    await adminApi.createDoctor({
      email,
      branchId: branch.id,
      degreeId: bachelor.id,
      approvalStatus: 'approved',
    });

    const { context, page } = await newAuthedPage(browser, email);
    try {
      const membership = new MemberMembershipPage(page);
      await membership.goto();

      const offered = await membership.offeredTypeNames();
      expect(offered).toContain(TYPE_ANNUAL);
      // Restricted to the PhD degree — the backend filters it out of the
      // catalogue this doctor is shown.
      expect(offered).not.toContain(TYPE_PHD_ANNUAL);
    } finally {
      await context.close();
    }
  });

  test('applying creates a pending application with a membership number', async ({
    browser,
    adminApi,
  }) => {
    const branch = await adminApi.findBranchByPrefix(BRANCH_MAIN_PREFIX);
    const bachelor = await adminApi.findDegreeByName(DEGREE_BACHELOR);
    const annual = await adminApi.findMembershipTypeByName(TYPE_ANNUAL);
    const email = `doctor.applyflow.${unique()}@e2e.test`;
    const doctor = await adminApi.createDoctor({
      email,
      branchId: branch.id,
      degreeId: bachelor.id,
      approvalStatus: 'approved',
    });

    const { context, page } = await newAuthedPage(browser, email);
    try {
      const membership = new MemberMembershipPage(page);
      await membership.goto();
      await membership.apply(annual.id);

      await expect(membership.pendingView()).toBeVisible({ timeout: 15_000 });
      await expect(membership.applicationNumber()).not.toBeEmpty();

      const stored = await adminApi.membershipsForDoctor(doctor.id);
      expect(stored).toHaveLength(1);
      expect(stored[0].status).toBe('pending');
      expect(Number(stored[0].total_amount)).toBe(ANNUAL_PRICE);
      expect(stored[0].branch?.id ?? stored[0].branch).toBe(branch.id);
    } finally {
      await context.close();
    }
  });

  test('a doctor with an application sees its status instead of the catalogue', async ({
    browser,
    adminApi,
  }) => {
    const branch = await adminApi.findBranchByPrefix(BRANCH_MAIN_PREFIX);
    const bachelor = await adminApi.findDegreeByName(DEGREE_BACHELOR);
    const annual = await adminApi.findMembershipTypeByName(TYPE_ANNUAL);
    const email = `doctor.dupe.${unique()}@e2e.test`;
    const doctor = await adminApi.createDoctor({
      email,
      branchId: branch.id,
      degreeId: bachelor.id,
      approvalStatus: 'approved',
    });
    await adminApi.createMembership({
      doctorId: doctor.id,
      membershipTypeId: annual.id,
      branchId: branch.id,
      status: 'pending',
    });

    const { context, page } = await newAuthedPage(browser, email);
    try {
      const membership = new MemberMembershipPage(page);
      await membership.goto();

      await expect(membership.pendingView()).toBeVisible({ timeout: 15_000 });
      // No second application can be started from here.
      await expect(page.locator('[data-testid^="apply-membership-"]')).toHaveCount(0);
      expect(await adminApi.membershipsForDoctor(doctor.id)).toHaveLength(1);
    } finally {
      await context.close();
    }
  });

  test('cancelling an application returns the doctor to the catalogue', async ({
    browser,
    adminApi,
  }) => {
    const branch = await adminApi.findBranchByPrefix(BRANCH_MAIN_PREFIX);
    const bachelor = await adminApi.findDegreeByName(DEGREE_BACHELOR);
    const annual = await adminApi.findMembershipTypeByName(TYPE_ANNUAL);
    const email = `doctor.cancel.${unique()}@e2e.test`;
    const doctor = await adminApi.createDoctor({
      email,
      branchId: branch.id,
      degreeId: bachelor.id,
      approvalStatus: 'approved',
    });
    await adminApi.createMembership({
      doctorId: doctor.id,
      membershipTypeId: annual.id,
      branchId: branch.id,
      status: 'pending',
    });

    const { context, page } = await newAuthedPage(browser, email);
    try {
      const membership = new MemberMembershipPage(page);
      await membership.goto();
      await expect(membership.pendingView()).toBeVisible({ timeout: 15_000 });

      await membership.cancelApplication();

      await expect(page.locator('[data-testid^="apply-membership-"]').first()).toBeVisible({
        timeout: 15_000,
      });
      const stored = await adminApi.membershipsForDoctor(doctor.id);
      expect(stored[0].status).toBe('canceled');
    } finally {
      await context.close();
    }
  });

  test('a doctor can submit a payment against an active membership', async ({
    browser,
    adminApi,
  }) => {
    const branch = await adminApi.findBranchByPrefix(BRANCH_MAIN_PREFIX);
    const bachelor = await adminApi.findDegreeByName(DEGREE_BACHELOR);
    const annual = await adminApi.findMembershipTypeByName(TYPE_ANNUAL);
    const email = `doctor.pay.${unique()}@e2e.test`;
    const doctor = await adminApi.createDoctor({
      email,
      branchId: branch.id,
      degreeId: bachelor.id,
      approvalStatus: 'approved',
    });
    const created = await adminApi.createMembership({
      doctorId: doctor.id,
      membershipTypeId: annual.id,
      branchId: branch.id,
      status: 'pending',
    });
    // Approving is what unlocks the payment prompt for the doctor.
    await adminApi.patchMembership(created.id, { status: 'active' });

    const { context, page } = await newAuthedPage(browser, email);
    try {
      const membership = new MemberMembershipPage(page);
      await membership.goto();
      await expect(membership.statusView()).toBeVisible({ timeout: 15_000 });
      await expect(membership.memberNumber()).not.toHaveText('-');

      await membership.submitPayment({
        amount: String(ANNUAL_PRICE),
        receipt: {
          name: 'receipt.png',
          mimeType: 'image/png',
          buffer: PNG_PIXEL,
        },
      });

      await expect(membership.paymentSubmittedBanner()).toBeVisible({ timeout: 15_000 });

      const payments = await adminApi.paymentsForDoctor(doctor.id);
      expect(payments).toHaveLength(1);
      expect(Number(payments[0].amount)).toBe(ANNUAL_PRICE);
      // Payments start unreviewed — an admin still has to approve them.
      expect(payments[0].status).toBe('pending');
    } finally {
      await context.close();
    }
  });
});

/** Smallest valid PNG, used as a stand-in receipt upload. */
const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
