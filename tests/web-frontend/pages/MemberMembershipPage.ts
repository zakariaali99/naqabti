import { expect, type Page } from '@playwright/test';

/**
 * The member self-service screen at /member/membership.
 *
 * It renders one of several views depending on the doctor's state: "apply"
 * (a catalogue of membership types), "pending" (application submitted, awaiting
 * an admin) or the active/expired membership card with the payment flow.
 */
export class MemberMembershipPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/member/membership');
  }

  /* ── apply view ─────────────────────────────────────────────────────────── */

  typeCard(typeId: number) {
    return this.page.getByTestId(`membership-type-card-${typeId}`);
  }

  applyButton(typeId: number) {
    return this.page.getByTestId(`apply-membership-${typeId}`);
  }

  /** Names of every membership type currently offered. */
  async offeredTypeNames(): Promise<string[]> {
    const cards = this.page.locator('[data-testid^="membership-type-card-"]');
    await expect(cards.first()).toBeVisible();
    return cards.locator('h3').allTextContents();
  }

  async apply(typeId: number) {
    await this.applyButton(typeId).click();
  }

  /* ── pending view ───────────────────────────────────────────────────────── */

  pendingView() {
    return this.page.getByTestId('membership-application-pending');
  }

  applicationNumber() {
    return this.page.getByTestId('application-number');
  }

  async cancelApplication() {
    await this.page.getByTestId('cancel-application').click();
    await this.page.getByTestId('cancel-application-confirm').click();
  }

  /* ── active / payment view ──────────────────────────────────────────────── */

  statusView() {
    return this.page.getByTestId('membership-status-view');
  }

  statusChip() {
    return this.page.getByTestId('membership-status');
  }

  memberNumber() {
    return this.page.getByTestId('member-number');
  }

  paymentSubmittedBanner() {
    return this.page.getByTestId('payment-submitted-banner');
  }

  async submitPayment(options: { amount: string; receipt?: { name: string; mimeType: string; buffer: Buffer } }) {
    await this.page.getByTestId('pay-now').click();

    // HeroUI spreads unknown props onto the inner <input>, so the testid lands
    // on the field itself rather than a wrapper.
    const amount = this.page.getByTestId('payment-amount');
    await expect(amount).toBeVisible();
    await amount.fill(options.amount);

    if (options.receipt) {
      await this.page.getByTestId('payment-receipt-input').setInputFiles(options.receipt);
    }

    await this.page.getByTestId('submit-payment').click();
  }
}
