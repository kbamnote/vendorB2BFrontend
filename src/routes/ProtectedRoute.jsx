import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from '../components/ui/Spinner';
import { HOME_ROUTE } from '../utils/constants';

/** Requires a signed-in user. */
export function RequireAuth() {
  const { isAuthenticated, booting } = useAuth();
  const location = useLocation();

  if (booting) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}

/**
 * Requires one of the given roles. A signed-in user who lands on a route
 * outside their role is bounced to their own home rather than shown an error.
 */
export function RequireRole({ roles = [] }) {
  const { user, booting } = useAuth();

  if (booting) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={HOME_ROUTE[user.role] || '/login'} replace />;

  return <Outlet />;
}

/** Keeps an already signed-in user away from the login page. */
export function RedirectIfAuthenticated({ children }) {
  const { user, booting } = useAuth();

  if (booting) return <FullPageLoader />;
  if (user) return <Navigate to={HOME_ROUTE[user.role] || '/'} replace />;

  return children;
}
