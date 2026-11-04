import * as path from 'path';

import {
  test as base,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
  type APIResponse,
  type Browser,
  type Page,
} from '@playwright/test';

import { AUTH_DIR, BACKEND_URL, BASE_URL } from '../e2e.env';
import { PASSWORD, USERS, type Role } from './users';

/**
 * A page already signed in as one of the seeded roles, plus an API helper
 * authenticated as the admin for arranging state and for asserting on what the
 * server actually stored.
 *
 *   test('...', async ({ doctorApprovedPage, adminApi }) => { ... });
 */
export interface AuthFixtures {
  adminPage: Page;
  managerPage: Page;
  doctorApprovedPage: Page;
  doctorPendingPage: Page;
  doctorAppliedPage: Page;
  adminApi: ApiHelper;
}

function storageStatePath(role: Role) {
  return path.join(AUTH_DIR, `${role}.json`);
}

async function pageForRole(browser: Browser, role: Role, use: (page: Page) => Promise<void>) {
  const context = await browser.newContext({ storageState: storageStatePath(role) });
  const page = await context.newPage();
  try {
    await use(page);
  } finally {
    await context.close();
  }
}

/**
 * Thin wrapper over the REST API, authenticated as the admin.
 *
 * Access tokens expire after 1 minute, so every call re-authenticates once on a
 * 401 rather than assuming the token minted at fixture setup is still good.
 */
export class ApiHelper {
  private token: string | null = null;

  constructor(private readonly context: APIRequestContext) {}

  private async login() {
    const response = await this.context.post('/api/auth/login/', {
      data: { username: USERS.admin.email, password: USERS.admin.password },
    });
    expect(response.ok(), `admin login failed: ${response.status()}`).toBeTruthy();
    this.token = (await response.json()).access;
  }

  private async send(
    method: 'get' | 'post' | 'patch',
    url: string,
    options: { params?: Record<string, string>; data?: unknown } = {},
  ): Promise<APIResponse> {
    if (!this.token) await this.login();

    const call = () =>
      this.context[method](url, {
        ...options,
        headers: { Authorization: `Bearer ${this.token}` },
      });

    let response = await call();
    if (response.status() === 401) {
      await this.login();
      response = await call();
    }
    if (!response.ok()) {
      throw new Error(
        `${method.toUpperCase()} ${url} -> ${response.status()}\n${await response.text()}`,
      );
    }
    return response;
  }

  /** Some viewsets paginate, some (academic-degrees) set pagination_class = None. */
  private async list(url: string, params: Record<string, string> = {}): Promise<any[]> {
    const body = await (await this.send('get', url, { params })).json();
    return Array.isArray(body) ? body : body.results;
  }

  private async findOne(url: string, params: Record<string, string>, match: (item: any) => boolean) {
    const found = (await this.list(url, params)).find(match);
    expect(found, `no match in ${url} for ${JSON.stringify(params)}`).toBeTruthy();
    return found;
  }

  async findUserByEmail(email: string) {
    // Not findOne: callers use this to assert a user was (or wasn't) created.
    return (await this.list('/api/users/', { search: email, page_size: '50' })).find(
      (u: any) => u.email === email,
    );
  }

  async findBranchByPrefix(prefix: string) {
    return this.findOne('/api/branches/', { page_size: '200' }, (b) => b.prefix === prefix);
  }

  async findMembershipTypeByName(name: string) {
    return this.findOne('/api/membership-types/', { page_size: '200' }, (t) => t.name === name);
  }

  async findDegreeByName(name: string) {
    return this.findOne('/api/academic-degrees/', {}, (d) => d.name === name);
  }

  /**
   * Create a throwaway doctor so a test owns its own state instead of mutating
   * the shared seeded cast.
   */
  async createDoctor(options: {
    email: string;
    branchId: number;
    degreeId?: number;
    approvalStatus?: 'pending' | 'approved';
  }) {
    const response = await this.send('post', '/api/users/', {
      data: {
        username: options.email.split('@')[0].replace(/[^a-z0-9]/gi, '_'),
        email: options.email,
        password: PASSWORD,
        confirm_password: PASSWORD,
        user_type: 'doctor',
        first_name_field: 'طبيب',
        family_name: 'تجريبي',
        branch_ids: [options.branchId],
        current_degree: options.degreeId,
      },
    });
    const doctor = await response.json();

    // POST /api/users/ can't set approval_status (it's read-only on the
    // serializer); the dedicated actions are the only way in.
    if (options.approvalStatus) {
      await this.setApprovalStatus(doctor.id, options.approvalStatus);
    }
    return doctor;
  }

  async createMembership(options: {
    doctorId: number;
    membershipTypeId: number;
    branchId: number;
    status?: 'pending' | 'active';
  }) {
    const response = await this.send('post', '/api/memberships/', {
      data: {
        doctor_id: options.doctorId,
        membership_type_id: options.membershipTypeId,
        branch_id: options.branchId,
        start_date: new Date().toISOString().split('T')[0],
        status: options.status ?? 'pending',
      },
    });
    return response.json();
  }

  async membershipsForDoctor(doctorId: number) {
    const response = await this.send('get', '/api/memberships/', {
      params: { doctor_id: String(doctorId), page_size: '50' },
    });
    return (await response.json()).results;
  }

  async paymentsForDoctor(doctorId: number) {
    const response = await this.send('get', '/api/payments/', {
      params: { doctor_id: String(doctorId), page_size: '50' },
    });
    return (await response.json()).results;
  }

  async patchMembership(id: number, data: Record<string, unknown>) {
    return (await this.send('patch', `/api/memberships/${id}/`, { data })).json();
  }

  async addPayment(membershipId: number, amount: number, paymentMethod = 'bank_transfer') {
    const response = await this.send('post', `/api/memberships/${membershipId}/add_payment/`, {
      data: { amount: String(amount), payment_method: paymentMethod },
    });
    return (await response.json()).payment;
  }

  /**
   * Sign a doctor up through the public endpoint — the only way to produce the
   * branchless account a self-registration actually creates.
   */
  async registerDoctor(email: string) {
    const response = await this.context.post('/api/auth/register/', {
      data: {
        email,
        password: PASSWORD,
        confirm_password: PASSWORD,
        user_type: 'doctor',
        // RegisterSerializer names the Arabic first name `first_name`, unlike
        // the model field (`first_name_field`) the users endpoint expects.
        first_name: 'طبيب',
        family_name: 'مسجل',
      },
    });
    if (!response.ok()) {
      throw new Error(`register ${email} -> ${response.status()}\n${await response.text()}`);
    }
    return response.json();
  }

  async setApprovalStatus(userId: number, status: 'pending' | 'approved' | 'rejected') {
    const action = { pending: 'set-pending', approved: 'approve', rejected: 'reject' }[status];
    return (await this.send('post', `/api/users/${userId}/${action}/`)).json();
  }
}

/**
 * Open a page already signed in as an arbitrary account.
 *
 * Logs in over the API and injects the tokens the same way global-setup does,
 * so tests that create their own doctor don't have to drive the login form.
 * The caller owns the returned context.
 */
export async function newAuthedPage(browser: Browser, email: string, password = PASSWORD) {
  const api = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
  try {
    const response = await api.post('/api/auth/login/', {
      data: { username: email, password },
    });
    expect(response.ok(), `login for ${email} -> ${response.status()}`).toBeTruthy();
    const { access, refresh } = await response.json();

    const context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: BASE_URL,
            localStorage: [
              { name: 'access_token', value: access },
              { name: 'refresh_token', value: refresh },
              { name: 'i18nextLng', value: 'en' },
            ],
          },
        ],
      },
    });
    return { context, page: await context.newPage() };
  } finally {
    await api.dispose();
  }
}

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    await pageForRole(browser, 'admin', use);
  },
  managerPage: async ({ browser }, use) => {
    await pageForRole(browser, 'manager', use);
  },
  doctorApprovedPage: async ({ browser }, use) => {
    await pageForRole(browser, 'doctorApproved', use);
  },
  doctorPendingPage: async ({ browser }, use) => {
    await pageForRole(browser, 'doctorPending', use);
  },
  doctorAppliedPage: async ({ browser }, use) => {
    await pageForRole(browser, 'doctorApplied', use);
  },

  adminApi: async ({}, use) => {
    const context = await playwrightRequest.newContext({ baseURL: BACKEND_URL });
    try {
      await use(new ApiHelper(context));
    } finally {
      await context.dispose();
    }
  },
});

export { expect };
