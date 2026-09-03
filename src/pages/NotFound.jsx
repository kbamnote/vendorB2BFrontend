import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button, EmptyState } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { HOME_ROUTE } from '../utils/constants';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="card">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you were looking for does not exist or is outside your access level."
        action={
          <Button onClick={() => navigate(HOME_ROUTE[user?.role] || '/login')}>
            Back to dashboard
          </Button>
        }
      />
    </div>
  );
}
