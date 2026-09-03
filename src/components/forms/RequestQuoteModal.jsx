import { useEffect, useState } from 'react';
import { Send, Trash2, Package } from 'lucide-react';
import { requestApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Modal, Textarea } from '../ui';
import { currency } from '../../utils/format';

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/**
 * Review step before a vendor sends a purchase request.
 *
 * The totals here are indicative only - they use the vendor's current assigned
 * price. The binding numbers come back from the super admin as a quotation.
 */
export default function RequestQuoteModal({ open, lines, onRemove, onQuantityChange, onClose, onSent }) {
  const toast = useToast();
  const [notes, setNotes] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNotes('');
      setExpectedDeliveryDate('');
    }
  }, [open]);

  const indicativeTotal = lines.reduce(
    (sum, line) => sum + round2((line.effectivePrice || 0) * line.quantity),
    0
  );

  const submit = async () => {
    if (!lines.length) return;

    setSaving(true);
    try {
      const response = await requestApi.create({
        items: lines.map((line) => ({ product: line.productId, quantity: line.quantity })),
        notes,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
      });
      toast.success(response.message);
      onSent?.(response.data.request);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      size="md"
      title="Request a quotation"
      subtitle="Confirm the quantities you need. The super admin will price them and send a quotation back."
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <span className="text-sm text-muted" style={{ marginRight: 'auto' }}>
            {lines.length} product{lines.length === 1 ? '' : 's'}
          </span>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Keep browsing
          </Button>
          <Button icon={Send} onClick={submit} loading={saving} disabled={!lines.length}>
            Send request
          </Button>
        </>
      }
    >
      {!lines.length ? (
        <div className="empty">
          <div className="empty-icon">
            <Package size={22} />
          </div>
          <div className="empty-title">Nothing selected yet</div>
          <div className="empty-text">Enter a quantity against the products you want to buy.</div>
        </div>
      ) : (
        <>
          <div
            className="table-wrap"
            style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ width: 120 }}>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Approx. value</th>
                  <th style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.productId}>
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
                        value={line.quantity}
                        onChange={(e) => onQuantityChange(line.productId, e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }} className="nowrap">
                      {currency(round2((line.effectivePrice || 0) * line.quantity))}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        title="Remove"
                        onClick={() => onRemove(line.productId)}
                      >
                        <Trash2 size={15} color="var(--danger-600)" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row-between mt-16">
            <span className="text-sm text-muted">Indicative value at your current prices</span>
            <span className="text-strong" style={{ fontSize: 16 }}>
              {currency(round2(indicativeTotal))}
            </span>
          </div>

          <div className="form-grid mt-24">
            <Input
              label="Needed by"
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              hint="Optional"
            />
            <div />
            <Textarea
              className="span-2"
              label="Notes for the super admin"
              placeholder="Delivery location, packaging, urgency, anything relevant"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="alert alert-info mt-16">
            These amounts are indicative. Final pricing, taxes and terms come back in the
            quotation, which you can then accept or reject.
          </div>
        </>
      )}
    </Modal>
  );
}
