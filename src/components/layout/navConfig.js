import {
  LayoutDashboard,
  Building2,
  Package,
  Users,
  UserCog,
  ShoppingBag,
  UserCircle,
  FileText,
} from 'lucide-react';
import { ROLES } from '../../utils/constants';

/** Sidebar entries per role. The router enforces the same boundaries. */
export const NAV_BY_ROLE = {
  [ROLES.SUPER_ADMIN]: [
    {
      label: 'Overview',
      items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      label: 'Management',
      items: [
        { to: '/admin/vendors', label: 'Vendors', icon: Building2 },
        { to: '/admin/products', label: 'Product Catalogue', icon: Package },
        { to: '/admin/users', label: 'Vendor Admins', icon: UserCog },
        { to: '/admin/requests', label: 'Quotation Requests', icon: FileText },
      ],
    },
    {
      label: 'Account',
      items: [{ to: '/profile', label: 'My Profile', icon: UserCircle }],
    },
  ],

  [ROLES.VENDOR_ADMIN]: [
    {
      label: 'Overview',
      items: [{ to: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      label: 'Workspace',
      items: [
        { to: '/vendor/products', label: 'My Products', icon: ShoppingBag },
        { to: '/vendor/staff', label: 'Staff Accounts', icon: Users },
        { to: '/vendor/requests', label: 'My Requests', icon: FileText },
      ],
    },
    {
      label: 'Account',
      items: [{ to: '/profile', label: 'My Profile', icon: UserCircle }],
    },
  ],

  [ROLES.VENDOR_STAFF]: [
    {
      label: 'Overview',
      items: [{ to: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      label: 'Workspace',
      items: [
        { to: '/staff/products', label: 'Products', icon: ShoppingBag },
        { to: '/staff/requests', label: 'My Requests', icon: FileText },
      ],
    },
    {
      label: 'Account',
      items: [{ to: '/profile', label: 'My Profile', icon: UserCircle }],
    },
  ],
};

export default NAV_BY_ROLE;
