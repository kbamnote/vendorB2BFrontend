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
  [ROLES.VENDOR_ADMIN]: '/vendor/dashboard',
  [ROLES.VENDOR_STAFF]: '/staff/dashboard',
};

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Vendor B2B Portal';

export const PAGE_SIZE = 10;
