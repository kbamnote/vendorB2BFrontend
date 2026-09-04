import { useAuth } from '../../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import StorefrontLayout from './StorefrontLayout';

/**
 * Picks the shell for the signed-in role.
 *
 * The super admin runs an admin console, so it keeps the sidebar. Vendors are
 * buyers, so they get a storefront with a top header instead.
 */
export default function RoleLayout() {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? <DashboardLayout /> : <StorefrontLayout />;
}
