import { ROLE_BADGE, ROLE_LABELS } from '../../utils/constants';

export function Badge({ children, tone = '', className = '' }) {
  return <span className={`badge ${tone ? `badge-${tone}` : ''} ${className}`.trim()}>{children}</span>;
}

export function StatusBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }) {
  return (
    <span className={`badge ${active ? 'badge-success' : 'badge-danger'}`}>
      <span className="dot" />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export function RoleBadge({ role }) {
  return <span className={`badge ${ROLE_BADGE[role] || ''}`}>{ROLE_LABELS[role] || role}</span>;
}

export default Badge;
