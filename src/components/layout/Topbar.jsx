import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, LogOut, UserCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';
import { initials } from '../../utils/format';
import NotificationBell from './NotificationBell';

export default function Topbar({ onMenuClick }) {
  const { user, role, vendor, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClickAway = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [menuOpen]);

  return (
    <header className="topbar">
      <button type="button" className="icon-btn menu-toggle" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={18} />
      </button>

      <div>
        <div className="topbar-title">{vendor ? vendor.name : 'Control Centre'}</div>
        <div className="topbar-sub">
          {vendor ? `Vendor code ${vendor.code}` : 'Manage vendors, products and access'}
        </div>
      </div>

      <div className="topbar-actions">
        <span className="badge badge-brand">
          <ShieldCheck size={13} />
          {ROLE_LABELS[role] || role}
        </span>

        <NotificationBell />

        <div className="user-menu" ref={menuRef}>
          <button type="button" className="user-chip" onClick={() => setMenuOpen((v) => !v)}>
            <span className="avatar">{initials(user?.name)}</span>
            <span className="user-chip-name">{user?.name}</span>
            <ChevronDown size={15} color="var(--ink-500)" />
          </button>

          {menuOpen && (
            <div className="dropdown">
              <div className="dropdown-head">
                <div className="text-strong">{user?.name}</div>
                <div className="text-xs text-muted">{user?.email}</div>
              </div>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
              >
                <UserCircle size={16} />
                My profile
              </button>
              <button type="button" className="dropdown-item danger" onClick={signOut}>
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
