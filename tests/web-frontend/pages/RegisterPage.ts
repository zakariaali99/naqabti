import { expect, type Page } from '@playwright/test';

export interface RegistrationDetails {
  firstName: string;
  familyName: string;
  email: string;
  password: string;
}

/**
 * The two-step registration wizard at /auth/register.
 *
 * Step 1 picks the account type; step 2 collects names, email and password.
 * Note it does NOT collect a branch — a freshly registered doctor has none,
 * which is why an admin can't approve them until one is assigned.
 */
export class RegisterPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/auth/register');
    await expect(this.page.getByTestId('account-type-doctor')).toBeVisible();
  }

  async chooseAccountType(type: 'doctor' | 'student' | 'institution') {
    await this.page.getByTestId(`account-type-${type}`).click();
    await this.page.getByTestId('account-type-continue').click();
  }

  async fillCredentials({ firstName, familyName, email, password }: RegistrationDetails) {
    await this.page.locator('input[name="first_name"]').fill(firstName);
    await this.page.locator('input[name="family_name"]').fill(familyName);
    await this.page.locator('input[name="email"]').fill(email);
    await this.page.locator('input[name="password"]').fill(password);
    await this.page.locator('input[name="confirm_password"]').fill(password);
  }

  async submit() {
    await this.page.getByTestId('register-submit').click();
  }
}
