export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  VENDOR_ADMIN: 'vendor_admin',
  VENDOR_STAFF: 'vendor_staff',
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.VENDOR_ADMIN]: 'Vendor Admin',
  [ROLES.VENDOR_STAFF]: 'Vendor Staff',
};

export const ROLE_BADGE = {
  [ROLES.SUPER_ADMIN]: 'badge-brand',
  [ROLES.VENDOR_ADMIN]: 'badge-info',
  [ROLES.VENDOR_STAFF]: 'badge',
};

/** Where each role lands after signing in. */
export const HOME_ROUTE = {
  [ROLES.SUPER_ADMIN]: '/admin/dashboard',
  // Vendors are buyers, so they land in the shop. The dashboard stays
  // reachable from the account menu.
  [ROLES.VENDOR_ADMIN]: '/vendor/shop',
  [ROLES.VENDOR_STAFF]: '/staff/shop',
};

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Vendor B2B Portal';

export const REQUEST_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  SUBMITTED: 'submitted',
  QUOTED: 'quoted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const REQUEST_STATUS_LABELS = {
  [REQUEST_STATUS.PENDING_APPROVAL]: 'In approval',
  [REQUEST_STATUS.SUBMITTED]: 'Awaiting quotation',
  [REQUEST_STATUS.QUOTED]: 'Quotation sent',
  [REQUEST_STATUS.ACCEPTED]: 'Accepted',
  [REQUEST_STATUS.REJECTED]: 'Rejected',
  [REQUEST_STATUS.CANCELLED]: 'Cancelled',
};

export const REQUEST_STATUS_TONE = {
  [REQUEST_STATUS.PENDING_APPROVAL]: 'warning',
  [REQUEST_STATUS.SUBMITTED]: 'info',
  [REQUEST_STATUS.QUOTED]: 'brand',
  [REQUEST_STATUS.ACCEPTED]: 'success',
  [REQUEST_STATUS.REJECTED]: 'danger',
  [REQUEST_STATUS.CANCELLED]: '',
};

/** Where the requests module lives for each role. */
export const REQUESTS_ROUTE = {
  [ROLES.SUPER_ADMIN]: '/admin/requests',
  [ROLES.VENDOR_ADMIN]: '/vendor/requests',
  [ROLES.VENDOR_STAFF]: '/staff/requests',
};

/** Storefront root per role. */
export const SHOP_ROUTE = {
  [ROLES.VENDOR_ADMIN]: '/vendor/shop',
  [ROLES.VENDOR_STAFF]: '/staff/shop',
};

/* ---------------- Approval hierarchy ---------------- */

export const STAFF_LEVEL_MIN = 1;
export const STAFF_LEVEL_MAX = 9;
export const VENDOR_ADMIN_LEVEL = 10;

export const LEVEL_LABELS = {
  1: 'Level 1 - Requester',
  2: 'Level 2 - Senior',
  3: 'Level 3 - Supervisor',
  4: 'Level 4 - Manager',
  5: 'Level 5 - Senior Manager',
  6: 'Level 6',
  7: 'Level 7',
  8: 'Level 8',
  9: 'Level 9 - Head',
  [VENDOR_ADMIN_LEVEL]: 'Vendor Admin',
};

/** Short label for whoever a request is currently sitting with. */
export const levelLabel = (level) => {
  if (level === null || level === undefined) return 'Sent to Print World';
  if (level >= VENDOR_ADMIN_LEVEL) return 'Vendor Admin';
  return LEVEL_LABELS[level] || `Level ${level}`;
};

export const PAGE_SIZE = 10;
