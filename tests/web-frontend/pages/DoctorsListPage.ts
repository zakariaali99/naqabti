import { expect, type Page } from '@playwright/test';

/** The admin doctors directory at /doctors. */
export class DoctorsListPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/doctors');
  }

  /** Type a term and run the search, waiting for the API round trip. */
  async search(term: string) {
    // HeroUI spreads unknown props onto the inner <input>, so the testid is on
    // the field itself.
    await this.page.getByTestId('doctors-search').fill(term);
    await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes('/api/users/') && r.request().method() === 'GET',
      ),
      this.page.getByTestId('doctors-search-submit').click(),
    ]);
  }

  row(doctorId: number) {
    return this.page.getByTestId(`doctor-row-${doctorId}`);
  }

  async openDoctor(doctorId: number) {
    await this.row(doctorId).click();
    await expect(this.page).toHaveURL(new RegExp(`/doctors/${doctorId}$`));
  }

  /** Ids of every doctor currently listed. */
  async listedDoctorIds(): Promise<number[]> {
    const rows = this.page.locator('[data-testid^="doctor-row-"]');
    const ids = await rows.evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLElement).dataset.testid!.replace('doctor-row-', '')),
    );
    return ids.map(Number);
  }
}
