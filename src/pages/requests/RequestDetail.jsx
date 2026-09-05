import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight,
  Send,
  Check,
  X,
  Ban,
  FileText,
  Package,
  CalendarClock,
} from 'lucide-react';
import { requestApi } from '../../api/services';
import ApprovalPanel from '../../components/forms/ApprovalPanel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  Input,
  LoadingBlock,
  PageHeader,
  Textarea,
} from '../../components/ui';
import {
  REQUESTS_ROUTE,
  REQUEST_STATUS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONE,
} from '../../utils/constants';
import { currency, formatDate, formatDateTime } from '../../utils/format';

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

/**
 * One request, shown to both sides.
 *
 * The super admin prices each line and sends a quotation; the vendor reviews it
 * and accepts or rejects. Which half is interactive depends on the role and the
 * current status - the API enforces the same transitions.
 */
export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isSuperAdmin } = useAuth();

  const basePath = REQUESTS_ROUTE[user?.role] || '/';

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  // Super admin quotation form
  const [lines, setLines] = useState({});
  const [validUntil, setValidUntil] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await requestApi.get(id);
      const loaded = response.data.request;
      setRequest(loaded);

      // Seed the pricing form: an existing quote, else the indicative price.
      const seeded = {};
      (loaded.items || []).forEach((item) => {
        seeded[item.product] = {
          unitPrice: item.unitPrice ?? item.indicativePrice ?? 0,
          taxPercent: item.taxPercent ?? 0,
        };
      });
      setLines(seeded);
      setValidUntil(toDateInput(loaded.quotation?.validUntil));
      setQuoteNotes(loaded.quotation?.notes || '');
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const editable =
    isSuperAdmin &&
    request &&
    ![REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.CANCELLED].includes(request.status);

  const totals = useMemo(() => {
    if (!request) return { subtotal: 0, taxTotal: 0, grandTotal: 0 };

    let subtotal = 0;
    let taxTotal = 0;
    (request.items || []).forEach((item) => {
      const line = lines[item.product] || {};
      const lineTotal = round2((Number(line.unitPrice) || 0) * item.quantity);
      subtotal += lineTotal;
      taxTotal += round2((lineTotal * (Number(line.taxPercent) || 0)) / 100);
    });

    subtotal = round2(subtotal);
    taxTotal = round2(taxTotal);
    return { subtotal, taxTotal, grandTotal: round2(subtotal + taxTotal) };
  }, [request, lines]);

  const setLine = (productId, key) => (e) => {
    const { value } = e.target;
    setLines((current) => ({
      ...current,
      [productId]: { ...current[productId], [key]: value },
    }));
  };

  const sendQuotation = async () => {
    setSaving(true);
    try {
      const response = await requestApi.quote(id, {
        items: request.items.map((item) => ({
          product: item.product,
          unitPrice: Number(lines[item.product]?.unitPrice) || 0,
          taxPercent: Number(lines[item.product]?.taxPercent) || 0,
        })),
        validUntil: validUntil || undefined,
        notes: quoteNotes,
      });
      toast.success(response.message);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status, note) => {
    setSaving(true);
    try {
      const response = await requestApi.setStatus(id, status, note);
      toast.success(response.message);
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading request" />;
  if (error) return <div className="alert alert-error">{error.message}</div>;

  const { quotation } = request;
  const isQuoted = request.status === REQUEST_STATUS.QUOTED;
  const inApproval = request.status === REQUEST_STATUS.PENDING_APPROVAL;
  const canDecide = !isSuperAdmin && isQuoted;
  const canCancel =
    !isSuperAdmin &&
    [REQUEST_STATUS.PENDING_APPROVAL, REQUEST_STATUS.SUBMITTED, REQUEST_STATUS.QUOTED].includes(
      request.status
    );

  return (
    <div>
      <PageHeader
        breadcrumb={
          <div className="breadcrumb">
            <Link to={basePath}>{isSuperAdmin ? 'Quotation requests' : 'My requests'}</Link>
            <ChevronRight size={13} />
            <span className="text-strong mono">{request.requestNumber}</span>
          </div>
        }
        title={request.requestNumber}
        description={
          isSuperAdmin
            ? `Raised by ${request.requestedBy?.name} at ${request.vendor?.name}.`
            : 'Your purchase request and the quotation sent back for it.'
        }
        actions={
          <>
            <Badge tone={REQUEST_STATUS_TONE[request.status]}>
              {REQUEST_STATUS_LABELS[request.status]}
            </Badge>
            {canDecide && (
              <>
                <Button
                  variant="success"
                  icon={Check}
                  loading={saving}
                  onClick={() =>
                    setConfirm({
                      title: 'Accept this quotation?',
                      message: `You are accepting ${currency(
                        quotation.grandTotal,
                        quotation.currency
                      )} for ${request.items.length} line(s). The super admin will be able to see your decision.`,
                      confirmLabel: 'Accept quotation',
                      tone: 'success',
                      status: REQUEST_STATUS.ACCEPTED,
                    })
                  }
                >
                  Accept
                </Button>
                <Button
                  variant="danger"
                  icon={X}
                  loading={saving}
                  onClick={() =>
                    setConfirm({
                      title: 'Reject this quotation?',
                      message: 'The super admin can revise the prices and send a new quotation.',
                      confirmLabel: 'Reject',
                      tone: 'danger',
                      status: REQUEST_STATUS.REJECTED,
                    })
                  }
                >
                  Reject
                </Button>
              </>
            )}
            {canCancel && (
              <Button
                variant="secondary"
                icon={Ban}
                loading={saving}
                onClick={() =>
                  setConfirm({
                    title: 'Cancel this request?',
                    message: 'The request is withdrawn and can no longer be quoted.',
                    confirmLabel: 'Cancel request',
                    tone: 'danger',
                    status: REQUEST_STATUS.CANCELLED,
                  })
                }
              >
                Cancel request
              </Button>
            )}
          </>
        }
      />

      <div style={{ display: 'grid', gap: 20 }}>
        {!isSuperAdmin && <ApprovalPanel request={request} onChanged={load} />}

        <Card>
          <CardHeader title="Request details" />
          <CardBody>
            <div className="detail-grid">
              {isSuperAdmin && <Detail label="Vendor" value={request.vendor?.name} />}
              {isSuperAdmin && <Detail label="Vendor code" value={request.vendor?.code} />}
              <Detail label="Raised by" value={request.requestedBy?.name} />
              <Detail label="Contact email" value={request.requestedBy?.email} />
              <Detail label="Submitted on" value={formatDateTime(request.createdAt)} />
              <Detail
                label="Expected delivery"
                value={
                  request.expectedDeliveryDate ? formatDate(request.expectedDeliveryDate) : 'Not specified'
                }
              />
            </div>
            {request.notes && (
              <div className="mt-24">
                <div className="detail-label">Notes from the vendor</div>
                <p className="detail-value" style={{ marginTop: 6 }}>
                  {request.notes}
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Requested items"
            subtitle={
              editable
                ? 'Set a unit price for each line. Totals update as you type.'
                : 'Quantities requested by the vendor.'
            }
          />

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: 'center' }}>Quantity</th>
                  <th>Unit price</th>
                  <th style={{ textAlign: 'center' }}>Tax %</th>
                  <th style={{ textAlign: 'right' }}>Line total</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item) => {
                  const line = lines[item.product] || {};
                  const unitPrice = Number(line.unitPrice) || 0;
                  const lineTotal = round2(unitPrice * item.quantity);

                  return (
                    <tr key={item.product}>
                      <td>
                        <div className="row gap-12">
                          <div className="avatar sq">
                            <Package size={16} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="cell-primary">{item.name}</div>
                            <div className="text-xs text-muted mono">{item.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-brand">
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td style={{ minWidth: 150 }}>
                        {editable ? (
                          <input
                            className="input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitPrice ?? ''}
                            onChange={setLine(item.product, 'unitPrice')}
                          />
                        ) : item.unitPrice !== null && item.unitPrice !== undefined ? (
                          <span className="text-strong">
                            {currency(item.unitPrice, quotation?.currency)}
                          </span>
                        ) : (
                          <span className="text-muted text-sm">
                            approx {currency(item.indicativePrice)}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', minWidth: 100 }}>
                        {editable ? (
                          <input
                            className="input"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={line.taxPercent ?? ''}
                            onChange={setLine(item.product, 'taxPercent')}
                          />
                        ) : (
                          <span className="text-sm">{item.taxPercent || 0}%</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }} className="text-strong nowrap">
                        {editable || item.unitPrice !== null
                          ? currency(editable ? lineTotal : item.lineTotal, quotation?.currency)
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(editable || quotation) && (
            <div className="card-footer">
              <div className="col gap-6" style={{ marginLeft: 'auto', maxWidth: 280 }}>
                <div className="row-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="text-strong">
                    {currency(editable ? totals.subtotal : quotation.subtotal, quotation?.currency)}
                  </span>
                </div>
                <div className="row-between text-sm">
                  <span className="text-muted">Tax</span>
                  <span className="text-strong">
                    {currency(editable ? totals.taxTotal : quotation.taxTotal, quotation?.currency)}
                  </span>
                </div>
                <div
                  className="row-between"
                  style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}
                >
                  <span className="text-strong">Grand total</span>
                  <span className="text-strong" style={{ fontSize: 17 }}>
                    {currency(
                      editable ? totals.grandTotal : quotation.grandTotal,
                      quotation?.currency
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {editable && (
          <Card>
            <CardHeader
              title={quotation ? 'Revise the quotation' : 'Send a quotation'}
              subtitle="The vendor sees these terms and can accept or reject them."
            />
            <CardBody>
              <div className="form-grid">
                <Input
                  label="Valid until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  hint="Optional - when this pricing expires"
                />
                <div />
                <Textarea
                  className="span-2"
                  label="Terms and notes"
                  placeholder="Payment terms, delivery timeline, freight, anything the vendor should know"
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                />
              </div>
              <div className="mt-24">
                <Button icon={Send} loading={saving} onClick={sendQuotation}>
                  {quotation ? `Send revision ${quotation.revision + 1}` : 'Send quotation'}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {quotation && !editable && (
          <Card>
            <CardHeader
              title={`Quotation${quotation.revision > 1 ? ` (revision ${quotation.revision})` : ''}`}
              subtitle={`Sent ${formatDateTime(quotation.quotedAt)}`}
            />
            <CardBody>
              <div className="detail-grid">
                <Detail label="Quoted by" value={quotation.quotedBy?.name} />
                <Detail
                  label="Valid until"
                  value={quotation.validUntil ? formatDate(quotation.validUntil) : 'No expiry'}
                />
                <Detail
                  label="Grand total"
                  value={currency(quotation.grandTotal, quotation.currency)}
                />
              </div>
              {quotation.notes && (
                <div className="mt-24">
                  <div className="detail-label">Terms and notes</div>
                  <p className="detail-value" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>
                    {quotation.notes}
                  </p>
                </div>
              )}
              {quotation.validUntil && isQuoted && (
                <div className="alert alert-warning mt-16">
                  <CalendarClock size={16} />
                  This pricing is valid until {formatDate(quotation.validUntil)}.
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {request.respondedAt && (
          <Card>
            <CardHeader title="Decision" />
            <CardBody>
              <div className="detail-grid">
                <Detail label="Outcome" value={REQUEST_STATUS_LABELS[request.status]} />
                <Detail label="By" value={request.respondedBy?.name} />
                <Detail label="On" value={formatDateTime(request.respondedAt)} />
              </div>
              {request.responseNote && (
                <div className="mt-24">
                  <div className="detail-label">Note</div>
                  <p className="detail-value" style={{ marginTop: 6 }}>
                    {request.responseNote}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {inApproval && (
          <div className="alert alert-info">
            <FileText size={16} />
            This request is still moving through your organisation. Print World will only see it
            once your vendor admin approves it.
          </div>
        )}

        {!quotation && !editable && request.status === REQUEST_STATUS.SUBMITTED && (
          <div className="alert alert-info">
            <FileText size={16} />
            Your request has been sent. The super admin will price it and send a quotation back
            here.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        tone={confirm?.tone}
        loading={saving}
        onConfirm={() => changeStatus(confirm.status)}
        onClose={() => setConfirm(null)}
      />

      <div className="mt-24">
        <Button variant="ghost" onClick={() => navigate(basePath)}>
          Back to all requests
        </Button>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value || '-'}</div>
    </div>
  );
}
