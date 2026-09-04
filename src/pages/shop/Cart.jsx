import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Send, Package, ArrowLeft } from 'lucide-react';
import { requestApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  Textarea,
} from '../../components/ui';
import { REQUESTS_ROUTE, SHOP_ROUTE } from '../../utils/constants';
import { currency } from '../../utils/format';
import { thumbUrl } from '../../utils/upload';

/**
 * Basket and checkout.
 *
 * Checkout does not place an order: it submits a purchase request that the
 * super admin prices and returns as a quotation.
 */
export default function ShopCart() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, vendor } = useAuth();
  const cart = useCart();

  const shopPath = SHOP_ROUTE[user?.role] || '/';
  const requestsPath = REQUESTS_ROUTE[user?.role] || '/';

  const [notes, setNotes] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!cart.lines.length) return;

    setSaving(true);
    try {
      const response = await requestApi.create({
        items: cart.lines.map((line) => ({
          product: line.productId,
          quantity: line.quantity,
        })),
        notes,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
      });
      toast.success(response.message);
      cart.clear();
      navigate(`${requestsPath}/${response.data.request._id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!cart.lines.length) {
    return (
      <div>
        <div className="breadcrumb">
          <Link to={shopPath}>Shop</Link>
        </div>
        <Card>
          <EmptyState
            icon={ShoppingCart}
            title="Your basket is empty"
            description="Browse the catalogue and add the products you need."
            action={
              <Button onClick={() => navigate(shopPath)}>
                <ArrowLeft size={15} /> Back to the shop
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to={shopPath}>Shop</Link>
        <span>/</span>
        <span className="text-strong">Basket</span>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">Your basket</h1>
          <p className="page-desc">
            {cart.count} product{cart.count === 1 ? '' : 's'} and {cart.totalUnits} units for{' '}
            {vendor?.name}. Sending this asks the Print World team for a firm quotation.
          </p>
        </div>
        <Button variant="ghost" onClick={cart.clear}>
          Empty basket
        </Button>
      </div>

      <div className="cart-layout">
        <Card>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ width: 130 }}>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Approx. line</th>
                  <th style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {cart.lines.map((line) => (
                  <tr key={line.productId}>
                    <td>
                      <div className="row gap-12">
                        {line.imageUrl ? (
                          <img className="thumb" src={thumbUrl(line.imageUrl)} alt="" />
                        ) : (
                          <div className="avatar sq">
                            <Package size={16} />
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <Link
                            to={`${shopPath}/${line.productId}`}
                            className="cell-primary truncate"
                          >
                            {line.name}
                          </Link>
                          <div className="text-xs text-muted">
                            {currency(line.effectivePrice)} per {line.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        min={line.minOrderQty || 1}
                        step="1"
                        value={line.quantity}
                        onChange={(e) => cart.setQuantityById(line.productId, e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }} className="text-strong nowrap">
                      {currency((line.effectivePrice || 0) * line.quantity)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        title="Remove"
                        onClick={() => cart.remove(line.productId)}
                      >
                        <Trash2 size={15} color="var(--danger-600)" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="cart-summary">
          <Card>
            <CardHeader title="Request summary" />
            <CardBody>
              <div className="col gap-8">
                <div className="row-between text-sm">
                  <span className="text-muted">Products</span>
                  <span className="text-strong">{cart.count}</span>
                </div>
                <div className="row-between text-sm">
                  <span className="text-muted">Total units</span>
                  <span className="text-strong">{cart.totalUnits}</span>
                </div>
                <div
                  className="row-between"
                  style={{ paddingTop: 10, borderTop: '1px solid var(--border)' }}
                >
                  <span className="text-strong">Indicative value</span>
                  <span className="text-strong" style={{ fontSize: 17 }}>
                    {currency(cart.indicativeTotal)}
                  </span>
                </div>
              </div>

              <div className="col gap-16 mt-24">
                <Input
                  label="Needed by"
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  hint="Optional"
                />
                <Textarea
                  label="Notes"
                  placeholder="Sizes, finishes, delivery location, urgency..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button className="btn-block mt-24" icon={Send} loading={saving} onClick={submit}>
                Send for quotation
              </Button>

              <p className="text-xs text-muted mt-16">
                Indicative amounts use your current assigned rates. Final pricing, taxes and terms
                arrive in the quotation, which you can accept or reject.
              </p>
            </CardBody>
          </Card>

          <Button variant="secondary" className="btn-block mt-16" onClick={() => navigate(shopPath)}>
            <ArrowLeft size={15} /> Continue shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
