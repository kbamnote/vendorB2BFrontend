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
  SUBMITTED: 'submitted',
  QUOTED: 'quoted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const REQUEST_STATUS_LABELS = {
  [REQUEST_STATUS.SUBMITTED]: 'Awaiting quotation',
  [REQUEST_STATUS.QUOTED]: 'Quotation sent',
  [REQUEST_STATUS.ACCEPTED]: 'Accepted',
  [REQUEST_STATUS.REJECTED]: 'Rejected',
  [REQUEST_STATUS.CANCELLED]: 'Cancelled',
};

export const REQUEST_STATUS_TONE = {
  [REQUEST_STATUS.SUBMITTED]: 'warning',
  [REQUEST_STATUS.QUOTED]: 'info',
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

export const PAGE_SIZE = 10;
