import { test, expect } from '@playwright/test';

import { USERS } from '../../fixtures/users';

/**
 * The identifier field accepts a username, an email or a phone number, so the
 * copy is not simply "Username is required" — keep these in step with
 * frontend/src/i18n/locales/{ar,en}/auth.ts.
 */
const USERNAME_REQUIRED =
  /اسم المستخدم، البريد الإلكتروني، أو رقم الهاتف مطلوب|Username, email, or phone number is required/i;
const PASSWORD_REQUIRED = /كلمة المرور مطلوبة|Password is required/i;

test.describe('Login Page', () => {
  const loginUrl = '/auth/login';

  test.beforeEach(async ({ page }) => {
    await page.goto(loginUrl);
  });

  test('should display the login form', async ({ page }) => {
    // Check that the login heading is visible
    await expect(page.getByRole('heading', { name: /تسجيل الدخول|Sign In/i })).toBeVisible();
    
    // Check that username input is visible
    await expect(page.locator('#username')).toBeVisible();
    
    // Check that password input is visible
    await expect(page.locator('#password')).toBeVisible();
    
    // Check that login button is visible
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors when submitting empty form', async ({ page }) => {
    // Click the login button without entering any credentials
    await page.locator('form button[type="submit"]').click();
    
    // Check for username required error
    await expect(page.getByText(USERNAME_REQUIRED)).toBeVisible();
    
    // Check for password required error  
    await expect(page.getByText(PASSWORD_REQUIRED)).toBeVisible();
  });

  test('should show username error when username is empty', async ({ page }) => {
    // Enter only password
    await page.locator('#password').fill('somepassword');
    
    // Click login button
    await page.locator('form button[type="submit"]').click();
    
    // Check for username required error
    await expect(page.getByText(USERNAME_REQUIRED)).toBeVisible();
  });

  test('should show password error when password is empty', async ({ page }) => {
    // Enter only username
    await page.locator('#username').fill('admin');
    
    // Click login button
    await page.locator('form button[type="submit"]').click();
    
    // Check for password required error
    await expect(page.getByText(PASSWORD_REQUIRED)).toBeVisible();
  });

  test('should clear username error when user starts typing', async ({ page }) => {
    // Submit empty form to trigger error
    await page.locator('form button[type="submit"]').click();
    
    // Verify error is shown
    await expect(page.getByText(USERNAME_REQUIRED)).toBeVisible();
    
    // Start typing in username field
    await page.locator('#username').fill('admin');
    
    // Error should be cleared
    await expect(page.getByText(USERNAME_REQUIRED)).not.toBeVisible();
  });

  test('should clear password error when user starts typing', async ({ page }) => {
    // Submit empty form to trigger error
    await page.locator('form button[type="submit"]').click();
    
    // Verify error is shown
    await expect(page.getByText(PASSWORD_REQUIRED)).toBeVisible();
    
    // Start typing in password field
    await page.locator('#password').fill('password');
    
    // Error should be cleared
    await expect(page.getByText(PASSWORD_REQUIRED)).not.toBeVisible();
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.locator('#username').fill('invaliduser');
    await page.locator('#password').fill('wrongpassword');
    
    // Click login button
    await page.locator('form button[type="submit"]').click();
    
    // Wait for error message (login failed)
    await expect(page.getByText(/فشل تسجيل الدخول|Login failed|تسجيل الدخول غير ناجح/i)).toBeVisible({ timeout: 10000 });
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('#password');
    const toggleButton = page.getByRole('button', { name: /toggle password visibility/i });
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle button
    await toggleButton.click();
    
    // Password should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle button again
    await toggleButton.click();
    
    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should have create account link', async ({ page }) => {
    // Check that the create account link is visible
    const createAccountLink = page.getByRole('link', { name: /إنشاء حساب|Create Account/i });
    await expect(createAccountLink).toBeVisible();
    
    // Verify it points to the registration page
    await expect(createAccountLink).toHaveAttribute('href', '/auth/register');
  });

  test('should have forgot password link', async ({ page }) => {
    // Check that the forgot password link is visible
    const forgotPasswordLink = page.getByRole('link', { name: /نسيت كلمة المرور|Forgot Password/i });
    await expect(forgotPasswordLink).toBeVisible();
    
    // Verify it points to the reset password page
    await expect(forgotPasswordLink).toHaveAttribute('href', '/auth/reset-password');
  });

  test('should redirect to home after successful login', async ({ page }) => {
    // Credentials come from `manage.py seed_e2e_data` (see fixtures/users.ts).
    await page.locator('#username').fill(USERS.admin.email);
    await page.locator('#password').fill(USERS.admin.password);

    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL('/', { timeout: 15000 });
  });

  test('should accept a doctor logging in with their email', async ({ page }) => {
    // The login serializer resolves the identifier against username, email or
    // phone — doctors only ever know their email.
    await page.locator('#username').fill(USERS.doctorApproved.email);
    await page.locator('#password').fill(USERS.doctorApproved.password);

    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/(member)?$/, { timeout: 15000 });
  });
});
