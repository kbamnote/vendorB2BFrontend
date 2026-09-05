import { useEffect, useState } from 'react';
import {
  Check,
  CornerDownLeft,
  SlidersHorizontal,
  Trash2,
  ArrowUp,
  Send,
  Pencil,
  Clock,
} from 'lucide-react';
import { requestApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Card, CardBody, CardHeader, Modal, Textarea } from '../ui';
import { REQUEST_STATUS, ROLES, VENDOR_ADMIN_LEVEL, levelLabel } from '../../utils/constants';
import { formatDateTime } from '../../utils/format';

const ACTION_META = {
  submitted: { icon: Send, tone: 'info', label: 'Raised' },
  approved: { icon: ArrowUp, tone: 'success', label: 'Approved' },
  returned: { icon: CornerDownLeft, tone: 'danger', label: 'Sent back' },
  edited: { icon: Pencil, tone: 'warning', label: 'Adjusted' },
  sent_to_supplier: { icon: Send, tone: 'brand', label: 'Sent to Print World' },
};

/** The level the signed-in user acts at. */
const myLevel = (user) =>
  user?.role === ROLES.VENDOR_ADMIN ? VENDOR_ADMIN_LEVEL : user?.approvalLevel || 1;

/**
 * Approval controls and audit trail for a purchase request.
 *
 * Only rendered for vendor roles. The action buttons appear solely when the
 * request is actually sitting at this user's level - the API enforces the same
 * rule, this just keeps the UI honest.
 */
export default function ApprovalPanel({ request, onChanged }) {
  const { user, isSuperAdmin } = useAuth();
  const toast = useToast();

  const [note, setNote] = useState('');
  const [prompt, setPrompt] = useState(null); // 'approve' | 'return'
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [draft, setDraft] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (adjustOpen) {
      setDraft(
        (request.items || []).map((item) => ({
          product: item.product,
          name: item.name,
          sku: item.sku,
          unit: item.unit,
          quantity: item.quantity,
          original: item.quantity,
          keep: true,
        }))
      );
    }
  }, [adjustOpen, request.items]);

  if (isSuperAdmin) return null;

  const pending = request.status === REQUEST_STATUS.PENDING_APPROVAL;
  const currentLevel = request.approval?.currentLevel ?? null;
  const isMyTurn = pending && currentLevel === myLevel(user);
  const isFinal = currentLevel >= VENDOR_ADMIN_LEVEL;
  const history = request.approval?.history || [];

  const run = async (action) => {
    setSaving(true);
    try {
      const response =
        action === 'approve'
          ? await requestApi.approve(request._id, note)
          : await requestApi.returnToPrevious(request._id, note);
      toast.success(response.message);
      setPrompt(null);
      setNote('');
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveAdjustments = async () => {
    const items = draft
      .filter((line) => line.keep && Number(line.quantity) > 0)
      .map((line) => ({ product: line.product, quantity: Number(line.quantity) }));

    if (!items.length) {
      toast.error('Keep at least one product, or cancel the request instead');
      return;
    }

    setSaving(true);
    try {
      const response = await requestApi.editItems(request._id, items, note);
      toast.success(response.message);
      setAdjustOpen(false);
      setNote('');
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Approval"
          subtitle={
            pending
              ? isMyTurn
                ? 'This request is waiting on you'
                : `Waiting on ${levelLabel(currentLevel)}`
              : 'Internal approval is complete'
          }
          actions={
            pending ? (
              <span className={`badge ${isMyTurn ? 'badge-warning' : ''}`}>
                <Clock size={12} /> {levelLabel(currentLevel)}
              </span>
            ) : (
              <span className="badge badge-success">
                <Check size={12} /> Approved internally
              </span>
            )
          }
        />

        <CardBody>
          {isMyTurn && (
            <div className="row gap-8 wrap" style={{ marginBottom: 18 }}>
              <Button icon={Check} onClick={() => setPrompt('approve')}>
                {isFinal ? 'Approve & send to Print World' : 'Approve & send up'}
              </Button>
              <Button variant="secondary" icon={SlidersHorizontal} onClick={() => setAdjustOpen(true)}>
                Adjust items
              </Button>
              <Button variant="danger" icon={CornerDownLeft} onClick={() => setPrompt('return')}>
                Send back
              </Button>
            </div>
          )}

          {history.length ? (
            <ol className="timeline">
              {history.map((entry, index) => {
                const meta = ACTION_META[entry.action] || ACTION_META.submitted;
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <li className="timeline-item" key={`${entry.at}-${index}`}>
                    <span className={`timeline-dot ${meta.tone}`}>
                      <meta.icon size={13} />
                    </span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="row-between gap-8 wrap">
                        <span className="text-strong">
                          {meta.label} by {entry.actorName || 'a colleague'}
                        </span>
                        <span className="text-xs text-muted">{formatDateTime(entry.at)}</span>
                      </div>
                      <div className="text-xs text-muted">
                        {levelLabel(entry.fromLevel)}
                        {entry.toLevel !== null && entry.toLevel !== undefined
                          ? ` → ${levelLabel(entry.toLevel)}`
                          : entry.action === 'sent_to_supplier'
                            ? ' → Print World'
                            : ''}
                      </div>
                      {entry.note && <p className="timeline-note">{entry.note}</p>}
                      {entry.changes?.length > 0 && (
                        <ul className="timeline-changes">
                          {entry.changes.map((change) => (
                            <li key={change}>{change}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-muted">No approval activity yet.</p>
          )}
        </CardBody>
      </Card>

      <Modal
        open={Boolean(prompt)}
        title={prompt === 'approve' ? 'Approve this request?' : 'Send this request back?'}
        subtitle={
          prompt === 'approve'
            ? isFinal
              ? 'It leaves your organisation and Print World will price it.'
              : 'It moves up to the next approver in your organisation.'
            : 'It returns to the previous step so it can be corrected.'
        }
        onClose={saving ? undefined : () => setPrompt(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPrompt(null)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant={prompt === 'approve' ? 'success' : 'danger'}
              loading={saving}
              onClick={() => run(prompt)}
            >
              {prompt === 'approve' ? 'Approve' : 'Send back'}
            </Button>
          </>
        }
      >
        <Textarea
          label={prompt === 'return' ? 'Reason (recommended)' : 'Note (optional)'}
          placeholder={
            prompt === 'return'
              ? 'Tell them what needs changing before this can move on'
              : 'Anything the next approver should know'
          }
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Modal>

      <Modal
        open={adjustOpen}
        size="md"
        title="Adjust the request"
        subtitle="Trim quantities or drop lines before passing it on. Every change is recorded against your name."
        onClose={saving ? undefined : () => setAdjustOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button loading={saving} onClick={saveAdjustments}>
              Save changes
            </Button>
          </>
        }
      >
        <div
          className="table-wrap"
          style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
        >
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ width: 130 }}>Quantity</th>
                <th style={{ width: 52 }} />
              </tr>
            </thead>
            <tbody>
              {draft.map((line, index) => (
                <tr key={line.product} style={{ opacity: line.keep ? 1 : 0.45 }}>
                  <td>
                    <div className="cell-primary">{line.name}</div>
                    <div className="text-xs text-muted mono">{line.sku}</div>
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      step="1"
                      disabled={!line.keep}
                      value={line.quantity}
                      onChange={(e) =>
                        setDraft((current) =>
                          current.map((entry, i) =>
                            i === index ? { ...entry, quantity: e.target.value } : entry
                          )
                        )
                      }
                    />
                    {line.keep && Number(line.quantity) !== line.original && (
                      <div className="text-xs text-muted">was {line.original}</div>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      title={line.keep ? 'Remove this line' : 'Keep this line'}
                      onClick={() =>
                        setDraft((current) =>
                          current.map((entry, i) =>
                            i === index ? { ...entry, keep: !entry.keep } : entry
                          )
                        )
                      }
                    >
                      {line.keep ? (
                        <Trash2 size={15} color="var(--danger-600)" />
                      ) : (
                        <Check size={15} color="var(--success-600)" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Textarea
          className="mt-16"
          label="Note (optional)"
          placeholder="Why you trimmed it"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Modal>
    </>
  );
}
