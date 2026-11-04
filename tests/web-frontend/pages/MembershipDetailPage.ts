import { expect, type Page } from '@playwright/test';

/**
 * The admin membership record at /memberships/:id.
 *
 * "Approve" and "Reject" are PATCHes of `status` to active/canceled — there is
 * no dedicated endpoint. Approving is what triggers the doctor's "please pay"
 * notification server-side.
 */
export class MembershipDetailPage {
  constructor(private readonly page: Page) {}

  async goto(membershipId: number) {
    await this.page.goto(`/memberships/${membershipId}`);
    await expect(this.statusChip()).toBeVisible();
  }

  membershipNumber() {
    return this.page.getByTestId('membership-number');
  }

  statusChip() {
    return this.page.getByTestId('membership-status');
  }

  paymentStatusChip() {
    return this.page.getByTestId('membership-payment-status');
  }

  private async patchAndWait(testId: string) {
    await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes('/api/memberships/') && r.request().method() === 'PATCH',
      ),
      this.page.getByTestId(testId).click(),
    ]);
  }

  async approve() {
    await this.patchAndWait('approve-membership');
  }

  async reject() {
    await this.patchAndWait('reject-membership');
  }
}
