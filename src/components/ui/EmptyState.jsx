import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = '',
  action = null,
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={24} />
      </div>
      <div className="empty-title">{title}</div>
      {description && <div className="empty-text">{description}</div>}
      {action && <div className="mt-16">{action}</div>}
    </div>
  );
}
