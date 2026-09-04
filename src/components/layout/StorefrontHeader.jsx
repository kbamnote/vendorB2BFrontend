import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  ChevronDown,
  User,
  FileText,
  Users,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Store,
  ListOrdered,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { myApi } from '../../api/services';
import { APP_NAME, REQUESTS_ROUTE, ROLES, SHOP_ROUTE } from '../../utils/constants';
import { initials } from '../../utils/format';

/**
 * Storefront header for vendor roles.
 *
 * Everything a vendor needs lives up here - search, categories, basket and the
 * account menu holding staff, requests and profile - so the shop itself gets
 * the full width of the page.
 */
export default function StorefrontHeader() {
  const { user, vendor, isVendorAdmin, signOut } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const shopPath = SHOP_ROUTE[user?.role] || '/';
  const requestsPath = REQUESTS_ROUTE[user?.role] || '/';
  const base = user?.role === ROLES.VENDOR_STAFF ? '/staff' : '/vendor';

  const [term, setTerm] = useState(searchParams.get('q') || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const menuRef = useRef(null);

  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await myApi.categories();
        if (!cancelled) setCategories(response.data.categories || []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClickAway = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [menuOpen]);

  const submitSearch = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (term.trim()) query.set('q', term.trim());
    if (activeCategory) query.set('category', activeCategory);
    navigate(`${shopPath}?${query.toString()}`);
  };

  const goToCategory = (category) => {
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (term.trim()) query.set('q', term.trim());
    navigate(`${shopPath}?${query.toString()}`);
    setDrawerOpen(false);
  };

  const accountLinks = [
    { to: `${base}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { to: requestsPath, label: 'My requests', icon: FileText },
    { to: `${base}/products`, label: 'Product list', icon: ListOrdered },
    ...(isVendorAdmin ? [{ to: '/vendor/staff', label: 'Staff accounts', icon: Users }] : []),
    { to: '/profile', label: 'My profile', icon: User },
  ];

  return (
    <header className="store-header">
      <div className="store-header-main">
        <button
          type="button"
          className="store-burger"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <Link to={shopPath} className="store-brand">
          <span className="store-logo">
            <Store size={18} />
          </span>
          <span className="store-brand-text">
            <span className="store-brand-name">{APP_NAME}</span>
            <span className="store-brand-sub truncate">{vendor?.name}</span>
          </span>
        </Link>

        <form className="store-search" onSubmit={submitSearch} role="search">
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search for products, categories, SKUs..."
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search">
            <Search size={18} />
          </button>
        </form>

        <div className="store-header-actions">
          <NavLink to={requestsPath} className="store-action">
            <FileText size={18} />
            <span className="store-action-text">
              <small>Quotations</small>
              <strong>My requests</strong>
            </span>
          </NavLink>

          <div className="user-menu" ref={menuRef}>
            <button type="button" className="store-action" onClick={() => setMenuOpen((v) => !v)}>
              <span className="avatar" style={{ width: 26, height: 26, borderRadius: '50%', fontSize: 10 }}>
                {initials(user?.name)}
              </span>
              <span className="store-action-text">
                <small>Hello, {user?.name?.split(' ')[0]}</small>
                <strong>
                  Account <ChevronDown size={12} style={{ verticalAlign: -1 }} />
                </strong>
              </span>
            </button>

            {menuOpen && (
              <div className="dropdown">
                <div className="dropdown-head">
                  <div className="text-strong">{user?.name}</div>
                  <div className="text-xs text-muted">{user?.email}</div>
                </div>
                {accountLinks.map((link) => (
                  <button
                    key={link.to}
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(link.to);
                    }}
                  >
                    <link.icon size={16} />
                    {link.label}
                  </button>
                ))}
                <button type="button" className="dropdown-item danger" onClick={signOut}>
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>

          <Link to={`${shopPath}/cart`} className="store-action store-cart">
            <span className="store-cart-icon">
              <ShoppingCart size={19} />
              {cart.count > 0 && <span className="store-cart-count">{cart.count}</span>}
            </span>
            <span className="store-action-text">
              <small>{cart.totalUnits} units</small>
              <strong>Basket</strong>
            </span>
          </Link>
        </div>
      </div>

      <nav className="store-subnav">
        <button
          type="button"
          className={`store-subnav-item ${!activeCategory ? 'active' : ''}`}
          onClick={() => goToCategory('')}
        >
          All products
        </button>
        {categories.map((entry) => (
          <button
            key={entry.category}
            type="button"
            className={`store-subnav-item ${activeCategory === entry.category ? 'active' : ''}`}
            onClick={() => goToCategory(entry.category)}
          >
            {entry.category}
            <span className="store-subnav-count">{entry.count}</span>
          </button>
        ))}
      </nav>

      {drawerOpen && (
        <>
          <div className="store-drawer-backdrop" role="presentation" onClick={() => setDrawerOpen(false)} />
          <aside className="store-drawer">
            <div className="store-drawer-head">
              <div>
                <div className="text-strong">{user?.name}</div>
                <div className="text-xs text-muted">{vendor?.name}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="store-drawer-section">Your account</div>
            {accountLinks.map((link) => (
              <button
                key={link.to}
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setDrawerOpen(false);
                  navigate(link.to);
                }}
              >
                <link.icon size={16} />
                {link.label}
              </button>
            ))}

            <div className="store-drawer-section">Shop by category</div>
            <button type="button" className="dropdown-item" onClick={() => goToCategory('')}>
              All products
            </button>
            {categories.map((entry) => (
              <button
                key={entry.category}
                type="button"
                className="dropdown-item"
                onClick={() => goToCategory(entry.category)}
              >
                {entry.category}
                <span className="badge" style={{ marginLeft: 'auto' }}>
                  {entry.count}
                </span>
              </button>
            ))}

            <button type="button" className="dropdown-item danger" onClick={signOut}>
              <LogOut size={16} />
              Sign out
            </button>
          </aside>
        </>
      )}
    </header>
  );
}
