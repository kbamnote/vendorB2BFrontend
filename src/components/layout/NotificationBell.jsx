import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  ArrowUp,
  CornerDownLeft,
  Pencil,
  Send,
  FileText,
  Package,
  PackageMinus,
  Ban,
} from 'lucide-react';
import { notificationApi } from '../../api/services';
import { LoadingBlock } from '../ui';

const POLL_MS = 45000;

const ICONS = {
  'request.needs_approval': { icon: FileText, tone: 'warning' },
  'request.approved': { icon: ArrowUp, tone: 'success' },
  'request.returned': { icon: CornerDownLeft, tone: 'danger' },
  'request.edited': { icon: Pencil, tone: 'warning' },
  'request.received': { icon: Send, tone: 'brand' },
  'request.cancelled': { icon: Ban, tone: 'danger' },
  'quotation.sent': { icon: FileText, tone: 'brand' },
  'quotation.accepted': { icon: Check, tone: 'success' },
  'quotation.rejected': { icon: Ban, tone: 'danger' },
  'products.assigned': { icon: Package, tone: 'success' },
  'products.unassigned': { icon: PackageMinus, tone: 'danger' },
};

/** "3m ago" style stamp - short enough for a dropdown row. */
function ago(value) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (Number.isNaN(seconds)) return '';
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(value).toLocaleDateString();
}

/**
 * Notification bell, shared by the admin console and the storefront header.
 *
 * The unread count is polled rather than pushed - there is no socket layer in
 * this stack, and a request every 45 seconds is cheap next to the alternative.
 * The list itself is only fetched when the panel is opened.
 */
export default function NotificationBell({ variant = 'admin' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const refreshCount = useCallback(async () => {
    try {
      const response = await notificationApi.unreadCount();
      setCount(response.data.count || 0);
    } catch {
      // A failed poll is not worth surfacing.
    }
  }, []);

  // Poll, and re-check whenever the route changes since acting on something is
  // what usually clears it.
  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount, location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onClickAway = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [open]);

  const openPanel = async () => {
    const next = !open;
    setOpen(next);
    if (!next) return;

    setLoading(true);
    try {
      const response = await notificationApi.list({ page: 1, limit: 12 });
      setItems(response.data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openItem = async (item) => {
    setOpen(false);
    if (!item.isRead) {
      setItems((current) =>
        current.map((entry) => (entry._id === item._id ? { ...entry, isRead: true } : entry))
      );
      setCount((value) => Math.max(0, value - 1));
      notificationApi.markRead(item._id).catch(() => {});
    }
    if (item.link) navigate(item.link);
  };

  const markAll = async () => {
    setItems((current) => current.map((entry) => ({ ...entry, isRead: true })));
    setCount(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      refreshCount();
    }
  };

  return (
    <div className="user-menu" ref={panelRef}>
      <button
        type="button"
        className={variant === 'store' ? 'store-action' : 'icon-btn'}
        onClick={openPanel}
        aria-label={count ? `${count} unread notifications` : 'Notifications'}
        title="Notifications"
      >
        <span className="store-cart-icon">
          <Bell size={variant === 'store' ? 19 : 18} />
          {count > 0 && <span className="store-cart-count">{count > 99 ? '99+' : count}</span>}
        </span>
        {variant === 'store' && (
          <span className="store-action-text">
            <small>{count > 0 ? `${count} new` : 'Up to date'}</small>
            <strong>Alerts</strong>
          </span>
        )}
      </button>

      {open && (
        <div className="dropdown notif-panel">
          <div className="notif-head">
            <span className="text-strong">Notifications</span>
            {count > 0 && (
              <button type="button" className="notif-mark-all" onClick={markAll}>
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <LoadingBlock label="Loading" />
          ) : !items.length ? (
            <div className="empty" style={{ padding: 32 }}>
              <div className="empty-icon" style={{ width: 42, height: 42 }}>
                <Bell size={19} />
              </div>
              <div className="empty-title">Nothing yet</div>
              <div className="empty-text">Approvals and quotations will show up here.</div>
            </div>
          ) : (
            <div className="notif-list">
              {items.map((item) => {
                const meta = ICONS[item.type] || { icon: Bell, tone: '' };
                return (
                  <button
                    key={item._id}
                    type="button"
                    className={`notif-item ${item.isRead ? '' : 'unread'}`}
                    onClick={() => openItem(item)}
                  >
                    <span className={`timeline-dot ${meta.tone}`}>
                      <meta.icon size={13} />
                    </span>
                    <span className="grow" style={{ minWidth: 0 }}>
                      <span className="notif-title">{item.title}</span>
                      {item.body && <span className="notif-body">{item.body}</span>}
                      <span className="notif-time">{ago(item.createdAt)}</span>
                    </span>
                    {!item.isRead && <span className="notif-dot" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
