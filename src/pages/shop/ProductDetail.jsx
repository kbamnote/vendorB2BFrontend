import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight,
  Package,
  ShoppingCart,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  FileText,
} from 'lucide-react';
import { myApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { Button, Card, LoadingBlock } from '../../components/ui';
import { SHOP_ROUTE } from '../../utils/constants';
import { currency } from '../../utils/format';
import { thumbUrl } from '../../utils/upload';

export default function ShopProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const cart = useCart();
  const shopPath = SHOP_ROUTE[user?.role] || '/';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [chosen, setChosen] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await myApi.get(id);
      setData(response.data);
      setQuantity(response.data.item.minOrderQty || 1);
      setActiveImage(0);
      setChosen({});
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

  if (loading) return <LoadingBlock label="Loading product" />;
  if (error) return <div className="alert alert-error">{error.message}</div>;

  const { item, related = [] } = data;
  const { product } = item;

  const gallery = product.images?.length
    ? product.images
    : product.imageUrl
      ? [{ url: product.imageUrl, alt: product.name }]
      : [];

  const minQty = item.minOrderQty || 1;
  const inCart = cart.quantityOf(product._id);

  const addToBasket = () => {
    // Selected options are appended to the request note, since pricing is
    // settled per quotation rather than per variant.
    cart.add(item, quantity);
    toast.success(`${quantity} x ${product.name} added to your basket`);
  };

  return (
    <div>
      <div className="breadcrumb">
        <Link to={shopPath}>Shop</Link>
        <ChevronRight size={13} />
        <span>{product.category}</span>
        <ChevronRight size={13} />
        <span className="text-strong truncate">{product.name}</span>
      </div>

      <div className="pdp">
        <div className="pdp-media">
          <div className="pdp-main-image">
            {gallery.length ? (
              <img
                src={thumbUrl(gallery[activeImage]?.url, 900)}
                alt={gallery[activeImage]?.alt || product.name}
              />
            ) : (
              <Package size={54} color="var(--ink-300)" />
            )}
          </div>

          {gallery.length > 1 && (
            <div className="pdp-thumbs">
              {gallery.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  className={`pdp-thumb ${index === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={thumbUrl(image.url, 120)} alt={image.alt || product.name} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp-info">
          <span className="badge">{product.category}</span>
          <h1 className="pdp-title">{product.name}</h1>
          <div className="text-xs text-muted mono">{product.sku}</div>

          {product.shortDescription && <p className="pdp-lede">{product.shortDescription}</p>}

          <div className="pdp-price-block">
            <span className="pdp-price">{currency(item.effectivePrice, product.currency)}</span>
            <span className="text-sm text-muted">per {product.unit}</span>
            {item.vendorPrice !== null &&
              item.vendorPrice !== undefined &&
              item.vendorPrice !== product.basePrice && (
                <span className="badge badge-success">Your negotiated rate</span>
              )}
          </div>

          {product.attributes?.length > 0 && (
            <div className="col gap-16 mt-16">
              {product.attributes.map((attribute) => (
                <div key={attribute.name}>
                  <div className="field-label" style={{ textTransform: 'capitalize' }}>
                    {attribute.name}
                  </div>
                  <div className="row gap-8 wrap mt-8">
                    {attribute.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`chip ${chosen[attribute.name] === option ? 'active' : ''}`}
                        onClick={() =>
                          setChosen((current) => ({ ...current, [attribute.name]: option }))
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted">
                Options are confirmed with your quotation - mention anything specific in the request
                notes.
              </p>
            </div>
          )}

          <div className="pdp-buy">
            <div className="qty-stepper">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(minQty, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus size={15} />
              </button>
              <input
                type="number"
                min={minQty}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(minQty, Math.floor(Number(e.target.value) || minQty)))}
                aria-label="Quantity"
              />
              <button type="button" onClick={() => setQuantity((q) => q + 1)} aria-label="Increase quantity">
                <Plus size={15} />
              </button>
            </div>

            <Button icon={ShoppingCart} onClick={addToBasket}>
              Add to basket
            </Button>

            {inCart > 0 && (
              <Button variant="secondary" onClick={() => navigate(`${shopPath}/cart`)}>
                Basket ({inCart})
              </Button>
            )}
          </div>

          <div className="row-between text-sm text-muted mt-8">
            <span>Line total</span>
            <span className="text-strong" style={{ fontSize: 15 }}>
              {currency(item.effectivePrice * quantity, product.currency)}
            </span>
          </div>

          <div className="pdp-assurances">
            <div className="pdp-assurance">
              <FileText size={16} />
              <span>Final pricing confirmed by quotation before you commit</span>
            </div>
            <div className="pdp-assurance">
              <ShieldCheck size={16} />
              <span>Minimum order {minQty} {product.unit}</span>
            </div>
            <div className="pdp-assurance">
              <Truck size={16} />
              <span>Delivery timeline agreed with your quotation</span>
            </div>
          </div>
        </div>
      </div>

      {product.description && (
        <Card className="mt-24">
          <div className="card-header">
            <div className="card-title">Product details</div>
          </div>
          <div className="card-body">
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--ink-700)', lineHeight: 1.7 }}>
              {product.description}
            </p>
            {(product.hsnCode || product.taxPercent > 0) && (
              <div className="detail-grid mt-24">
                {product.hsnCode && (
                  <div className="detail-item">
                    <div className="detail-label">HSN code</div>
                    <div className="detail-value">{product.hsnCode}</div>
                  </div>
                )}
                {product.taxPercent > 0 && (
                  <div className="detail-item">
                    <div className="detail-label">Tax</div>
                    <div className="detail-value">{product.taxPercent}%</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {related.length > 0 && (
        <div className="mt-24">
          <h2 style={{ fontSize: 17, marginBottom: 14 }}>More in {product.category}</h2>
          <div className="shop-grid">
            {related.map((row) => (
              <article className="shop-card" key={row.assignmentId}>
                <Link to={`${shopPath}/${row.product._id}`} className="shop-card-media">
                  {row.product.imageUrl ? (
                    <img src={thumbUrl(row.product.imageUrl, 480)} alt={row.product.name} loading="lazy" />
                  ) : (
                    <Package size={30} color="var(--ink-300)" />
                  )}
                </Link>
                <div className="shop-card-body">
                  <Link to={`${shopPath}/${row.product._id}`} className="shop-card-title">
                    {row.product.name}
                  </Link>
                  <div className="shop-card-price">
                    <span className="shop-price">
                      {currency(row.effectivePrice, row.product.currency)}
                    </span>
                    <span className="text-xs text-muted">per {row.product.unit}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
