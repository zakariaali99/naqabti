import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  readonly username = () => this.page.locator('#username');
  readonly password = () => this.page.locator('#password');
  readonly submit = () => this.page.locator('form button[type="submit"]');

  async goto() {
    await this.page.goto('/auth/login');
    await expect(this.username()).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.username().fill(username);
    await this.password().fill(password);
    await this.submit().click();
  }
}
