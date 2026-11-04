import { type Page } from '@playwright/test';

/** The admin payments list at /payments. */
export class PaymentsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/payments');
  }

  row(paymentId: number) {
    return this.page.getByTestId(`payment-row-${paymentId}`);
  }

  /** Approve/reject buttons only render for managers, on pending payments. */
  async approve(paymentId: number) {
    await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes(`/api/payments/${paymentId}/approve/`),
      ),
      this.page.getByTestId(`approve-payment-${paymentId}`).click(),
    ]);
  }

  async reject(paymentId: number) {
    await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes(`/api/payments/${paymentId}/reject/`),
      ),
      this.page.getByTestId(`reject-payment-${paymentId}`).click(),
    ]);
  }
}
