import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HOME_ROUTE } from '../utils/constants';

/** Sends each signed-in role to its own landing page. */
export default function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={HOME_ROUTE[user?.role] || '/login'} replace />;
}
