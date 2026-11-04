import { test, expect } from '@playwright/test';
  
  test.describe('Role Based Permissions', () => {
    
    test.beforeEach(async ({ page }) => {
      // Set tokens and language to simulate being logged in and in English
      await page.addInitScript(() => {
        window.localStorage.setItem('access_token', 'mock-access-token');
        window.localStorage.setItem('refresh_token', 'mock-refresh-token');
        window.localStorage.setItem('i18nextLng', 'en');
      });

      // Always mock token refresh to prevent logout cascade from 401s on other endpoints
      await page.route('**/api/auth/token/refresh/', async (route) => {
        await route.fulfill({ json: { access: 'mock-access-token', refresh: 'mock-refresh-token' } });
      });

      // Always mock dashboard so the home page doesn't crash from 401s
      await page.route('**/api/dashboard/**', async (route) => {
        await route.fulfill({ json: { total_members: 0, active_members: 0 } });
      });
    });

    // Helper function to mock user profile with specific permissions
    const mockUserPermissions = async (page: any, permissions: string[], isSuperuser: boolean = false) => {
      await page.route('**/api/users/me/', async (route: any) => {
        console.log(`Mocking users/me for ${permissions}`);
        const json = {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          full_name: 'Test User',
          is_active: true,
          is_staff: isSuperuser,
          is_superuser: isSuperuser,
          user_type: 'staff',
          group_names: ['Test Group'],
          group_permissions: permissions,
        };
        await route.fulfill({ json });
      });
    };
  
    // 1. Test Sidebar Rendering (Hide menus without permission)
    test('Sidebar hides items without permissions', async ({ page }) => {
      await mockUserPermissions(page, []); // No permissions
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
  
      // 'Dashboard' doesn't have a permission requirement and should be visible
      // Use first() since the sidebar may duplicate items in mobile/desktop views
      await expect(page.getByText('Dashboard').first()).toBeVisible();
  
      // 'Doctors' requires MEMBERSHIP.VIEW - should not be visible in the sidebar
      // (sidebar items with opacity-0 are rendered but invisible, we check they're all invisible)
      const doctorItems = page.getByText('Doctors', { exact: true });
      const count = await doctorItems.count();
      for (let i = 0; i < count; i++) {
        await expect(doctorItems.nth(i)).not.toBeVisible();
      }
    });
  
    // 2. Test Sidebar Rendering (Show menus with permission)
    test('Sidebar shows items with correct permissions', async ({ page }) => {
      await mockUserPermissions(page, ['niqabaty.view_doctorsmembership']); 
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
  
      // Both Doctors and Memberships should now be visible in sidebar
      // Use first() since sidebar may render items for both mobile and desktop
      await expect(page.getByText('Doctors', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('Memberships', { exact: true }).first()).toBeVisible();
    });
  
    // 3. Test PermissionGuard (Direct URL Access) - using /branches which IS guarded
    test('Direct URL access triggers Forbidden page', async ({ page }) => {
      await mockUserPermissions(page, []); // No permissions
      
      // Attempt to access a guarded route directly (/branches requires VIEW_BRANCH)
      await page.goto('/branches');
      await page.waitForLoadState('domcontentloaded');
      
      // The Forbidden page component should be rendered
      await expect(page.getByText('This route not permitted')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('403')).toBeVisible();
    });
  
    // 4. Test API request rendering (permissionsApi.ts usage example)
    test('User groups form requests and displays grouped permissions', async ({ page }) => {
      // Must be superuser or have group management permissions
      await mockUserPermissions(page, [], true); 
  
      // Mock the grouped permissions API response
      await page.route('**/api/permissions/grouped/', async (route) => {
        const json = {
          "user": {
            "model": "user",
            "app_label": "niqabaty",
            "model_name": "User",
            "permissions": [
              { "id": 1, "name": "Can view user", "codename": "view_user", "content_type": 1, "content_type_name": "user" }
            ]
          }
        };
        await route.fulfill({ json });
      });
  
      await page.goto('/user-groups/add');
      await page.waitForLoadState('networkidle');
  
      // Click the "User" accordion section to reveal permissions
      // The accordion button text is just "User" (badge "0/1" is a child span)
      // Find the button within the permissions section that has the text "User"
      const userAccordion = page.locator('button').filter({ hasText: /^User/ });
      await userAccordion.first().click();
  
      // The mock permission name should now be visible
      await expect(page.getByText('Can view user')).toBeVisible();
    });

    // 5. Test PermissionField (View-only vs Edit)
    test('PermissionField renders as view-only when user has view but not change permission', async ({ page }) => {
      // Mock user with only view permission for branches (no change permission)
      await mockUserPermissions(page, ['niqabaty.view_branch']);

      // Mock the specific branch being edited
      await page.route('**/api/branches/1/', async route => {
        console.log('Mocking /api/branches/1/');
        return route.fulfill({ json: { id: 1, name: 'Main Branch', prefix: 'BR001', is_active: true } });
      });

      // Mock parent branches (query param: ?parent__isnull=true)
      await page.route('**/api/branches/*', async route => {
        const url = route.request().url();
        console.log(`Branch wildcard hit: ${url}`);
        if (url.includes('parent__isnull')) {
          return route.fulfill({ json: { count: 0, results: [], next: null, previous: null } });
        }
        await route.continue();
      });

      // Navigate to branch edit page
      await page.goto('/branches/1/edit');
      
      // Wait for page to load - either the form contents or the forbidden page
      await Promise.race([
        page.waitForSelector('label:has-text("Prefix")', { timeout: 15000 }),
        page.waitForSelector('[data-testid="view-only-chip"]', { timeout: 15000 }),
        page.waitForSelector('text=This route not permitted', { timeout: 15000 })
      ]);

      // If we see Forbidden, it's a logic error (user has VIEW but still blocked)
      await expect(page.getByText('This route not permitted')).not.toBeVisible();

      // The 'prefix' field should show "View Only" chip
      // because the user has view_branch but lacks change_branch
      await expect(page.getByText('View Only').first()).toBeVisible({ timeout: 10000 });
    });
  
  });
