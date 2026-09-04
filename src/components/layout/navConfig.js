import {
  LayoutDashboard,
  Building2,
  Package,
  UserCog,
  UserCircle,
  FileText,
} from 'lucide-react';
import { ROLES } from '../../utils/constants';

/**
 * Sidebar entries for the admin console.
 *
 * Only the super admin uses a sidebar. Vendor admins and vendor staff get the
 * storefront shell instead, where the same destinations live in the header's
 * account menu - see StorefrontHeader.
 */
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
};

export default NAV_BY_ROLE;
