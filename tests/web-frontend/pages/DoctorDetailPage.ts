import { expect, type Page } from '@playwright/test';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * The doctor profile at /doctors/:id, whose approval switcher is the admin's
 * entry point into the review journey.
 */
export class DoctorDetailPage {
  constructor(private readonly page: Page) {}

  async goto(doctorId: number) {
    await this.page.goto(`/doctors/${doctorId}`);
    await expect(this.switcher()).toBeVisible();
  }

  switcher() {
    return this.page.getByTestId('doctor-status-switcher');
  }

  statusButton(status: ApprovalStatus) {
    return this.page.getByTestId(`doctor-status-${status}`);
  }

  /**
   * Click a status and wait for the corresponding API call to land.
   *
   * The switcher disables the button for the current status, so the disabled
   * one tells you where the doctor currently sits.
   */
  async setStatus(status: ApprovalStatus) {
    const endpoint = { pending: 'set-pending', approved: 'approve', rejected: 'reject' }[status];
    await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes(`/${endpoint}/`) && r.request().method() === 'POST',
      ),
      this.statusButton(status).click(),
    ]);
  }

  /** The status currently in effect, read off the disabled button. */
  async currentStatus(): Promise<ApprovalStatus> {
    for (const status of ['pending', 'approved', 'rejected'] as ApprovalStatus[]) {
      if (await this.statusButton(status).isDisabled()) return status;
    }
    throw new Error('No status button is disabled — cannot tell the current status.');
  }
}
