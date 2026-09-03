import { NavLink } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME, ROLE_LABELS } from '../../utils/constants';
import { initials } from '../../utils/format';
import NAV_BY_ROLE from './navConfig';

export default function Sidebar({ open, onNavigate }) {
  const { user, role, vendor } = useAuth();
  const sections = NAV_BY_ROLE[role] || [];

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`.trim()}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Boxes size={19} />
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name truncate">{APP_NAME}</div>
          <div className="sidebar-brand-sub">B2B Vendor CRM</div>
        </div>
      </div>

      {vendor && (
        <div className="sidebar-scope">
          <div className="sidebar-scope-label">Vendor workspace</div>
          <div className="sidebar-scope-name truncate">{vendor.name}</div>
          <div className="text-xs mono" style={{ color: '#7c8bb5', marginTop: 2 }}>
            {vendor.code}
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{initials(user?.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div className="sidebar-user-name truncate">{user?.name}</div>
            <div className="sidebar-user-role">{ROLE_LABELS[role] || role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
