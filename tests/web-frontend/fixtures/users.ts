/**
 * The cast created by `manage.py seed_e2e_data`.
 *
 * Keep in sync with backend/niqabaty/management/commands/seed_e2e_data.py —
 * these constants mirror the ones defined there.
 */

export const PASSWORD = 'Passw0rd!';

export type Role = 'admin' | 'manager' | 'doctorApproved' | 'doctorPending' | 'doctorApplied';

export interface SeededUser {
  role: Role;
  email: string;
  password: string;
  description: string;
}

export const USERS: Record<Role, SeededUser> = {
  admin: {
    role: 'admin',
    email: 'admin@e2e.test',
    password: PASSWORD,
    description: 'Superuser — sees every branch',
  },
  manager: {
    role: 'manager',
    email: 'manager@e2e.test',
    password: PASSWORD,
    description: 'Branch manager of E2E Main, in the Manager group',
  },
  doctorApproved: {
    role: 'doctorApproved',
    email: 'doctor.approved@e2e.test',
    password: PASSWORD,
    description: 'Approved doctor with no membership — the apply-flow subject',
  },
  doctorPending: {
    role: 'doctorPending',
    email: 'doctor.pending@e2e.test',
    password: PASSWORD,
    description: 'Doctor awaiting approval — the admin-approval subject',
  },
  doctorApplied: {
    role: 'doctorApplied',
    email: 'doctor.applied@e2e.test',
    password: PASSWORD,
    description: 'Approved doctor holding a pending membership application',
  },
};

/** A doctor in a branch the manager does not manage. */
export const DOCTOR_OTHER_BRANCH_EMAIL = 'doctor.otherbranch@e2e.test';

export const BRANCH_MAIN_PREFIX = 'E2EM';
export const BRANCH_OTHER_PREFIX = 'E2EO';

export const DEGREE_BACHELOR = 'E2E Bachelor';
export const DEGREE_PHD = 'E2E PhD';

/** Degree-agnostic, 500.00 LYD, 12 months — what a Bachelor doctor can buy. */
export const TYPE_ANNUAL = 'E2E Annual';
/** Restricted to the PhD degree — must NOT be offered to a Bachelor doctor. */
export const TYPE_PHD_ANNUAL = 'E2E PhD Annual';

export const ANNUAL_PRICE = 500;
export const ANNUAL_DURATION_MONTHS = 12;
