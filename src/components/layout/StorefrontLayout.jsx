import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME, REQUESTS_ROUTE, SHOP_ROUTE } from '../../utils/constants';
import StorefrontHeader from './StorefrontHeader';

/** Public-shop style shell used by vendor admins and vendor staff. */
export default function StorefrontLayout() {
  const { user, vendor, isVendorAdmin } = useAuth();
  const shopPath = SHOP_ROUTE[user?.role] || '/';
  const requestsPath = REQUESTS_ROUTE[user?.role] || '/';
  const base = isVendorAdmin ? '/vendor' : '/staff';

  return (
    <div className="store-shell">
      <StorefrontHeader />

      <main className="store-main">
        <div className="store-container">
          <Outlet />
        </div>
      </main>

      <footer className="store-footer">
        <div className="store-container store-footer-inner">
          <div>
            <div className="store-footer-title">{APP_NAME}</div>
            <p className="store-footer-text">
              Wholesale ordering for {vendor?.name}. Every price is confirmed by quotation before
              anything is committed.
            </p>
          </div>

          <div className="store-footer-links">
            <span className="store-footer-heading">Shop</span>
            <Link to={shopPath}>All products</Link>
            <Link to={`${shopPath}/cart`}>Your basket</Link>
            <Link to={`${base}/products`}>Product list</Link>
          </div>

          <div className="store-footer-links">
            <span className="store-footer-heading">Your account</span>
            <Link to={`${base}/dashboard`}>Dashboard</Link>
            <Link to={requestsPath}>My requests</Link>
            {isVendorAdmin && <Link to="/vendor/staff">Staff accounts</Link>}
            <Link to="/profile">My profile</Link>
          </div>
        </div>

        <div className="store-container store-footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} {APP_NAME}
          </span>
          <span>
            Signed in as {user?.name} - {vendor?.code}
          </span>
        </div>
      </footer>
    </div>
  );
}
