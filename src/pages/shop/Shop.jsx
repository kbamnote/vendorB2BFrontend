import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Package, ShoppingCart, Plus, Check, X, Sparkles, LayoutGrid } from 'lucide-react';
import { myApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import usePaginatedQuery from '../../hooks/usePaginatedQuery';
import { Card, EmptyState, LoadingBlock, Pagination } from '../../components/ui';
import { SHOP_ROUTE } from '../../utils/constants';
import { currency } from '../../utils/format';
import { thumbUrl } from '../../utils/upload';

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A-Z' },
];

/**
 * The storefront listing.
 *
 * Search and category come from the URL, because the header owns both - that
 * keeps a filtered view shareable and the back button working.
 */
export default function Shop() {
  const { user, vendor } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shopPath = SHOP_ROUTE[user?.role] || '/';

  const category = searchParams.get('category') || '';
  const query = searchParams.get('q') || '';

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [categories, setCategories] = useState([]);
  const [totalAvailable, setTotalAvailable] = useState(0);

  // Any change of filter starts again from the first page.
  useEffect(() => setPage(1), [category, query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await myApi.categories();
        if (cancelled) return;
        setCategories(response.data.categories || []);
        setTotalAvailable(response.data.total || 0);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const params = useMemo(
    () => ({
      page,
      limit: 12,
      search: query || undefined,
      category: category || undefined,
      status: 'active',
      onlyActiveProducts: 'true',
    }),
    [page, query, category]
  );

  const { items, pagination, loading, error } = usePaginatedQuery(myApi.products, params);

  const sorted = useMemo(() => {
    const copy = [...items];
    if (sort === 'price_asc') copy.sort((a, b) => a.effectivePrice - b.effectivePrice);
    if (sort === 'price_desc') copy.sort((a, b) => b.effectivePrice - a.effectivePrice);
    if (sort === 'name') copy.sort((a, b) => a.product.name.localeCompare(b.product.name));
    return copy;
  }, [items, sort]);

  const hasFilters = Boolean(category || query);

  const selectCategory = (value) => {
    const next = new URLSearchParams();
    if (value) next.set('category', value);
    if (query) next.set('q', query);
    setSearchParams(next);
  };

  return (
    <div>
      {!hasFilters && (
        <section className="shop-hero">
          <div>
            <span className="badge badge-brand">
              <Sparkles size={12} /> {vendor?.name}
            </span>
            <h1 className="shop-hero-title">Everything available to your organisation</h1>
            <p className="shop-hero-text">
              {totalAvailable} product{totalAvailable === 1 ? '' : 's'} across {categories.length}{' '}
              categor{categories.length === 1 ? 'y' : 'ies'}. Add what you need to the basket and send it
              for a quotation - pricing is confirmed before anything is committed.
            </p>
          </div>
          <button
            type="button"
            className="btn shop-hero-cta"
            onClick={() => navigate(`${shopPath}/cart`)}
          >
            <ShoppingCart size={16} />
            View basket
            {cart.count > 0 && <span className="nav-badge">{cart.count}</span>}
          </button>
        </section>
      )}

      {hasFilters && (
        <div className="shop-filters">
          <h1 className="shop-results-title">
            {category || 'All products'}
            {query && <span className="text-muted"> matching &ldquo;{query}&rdquo;</span>}
          </h1>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSearchParams({})}>
            <X size={14} /> Clear filters
          </button>
        </div>
      )}

      <div className="shop-layout">
        <aside className="shop-rail">
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <LayoutGrid size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
                Categories
              </div>
            </div>
            <nav className="shop-cat-list">
              <button
                type="button"
                className={`shop-cat ${category === '' ? 'active' : ''}`}
                onClick={() => selectCategory('')}
              >
                <span>All products</span>
                <span className="badge">{totalAvailable}</span>
              </button>
              {categories.map((entry) => (
                <button
                  key={entry.category}
                  type="button"
                  className={`shop-cat ${category === entry.category ? 'active' : ''}`}
                  onClick={() => selectCategory(entry.category)}
                >
                  <span className="truncate">{entry.category}</span>
                  <span className="badge">{entry.count}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div style={{ minWidth: 0 }}>
          <Card>
        <div className="toolbar">
          <span className="text-sm text-muted">
            {pagination.total} result{pagination.total === 1 ? '' : 's'}
          </span>
          <select
            className="select"
            style={{ marginLeft: 'auto' }}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingBlock label="Loading products" />
        ) : error ? (
          <div style={{ padding: 20 }}>
            <div className="alert alert-error">{error.message}</div>
          </div>
        ) : !sorted.length ? (
          <EmptyState
            icon={Package}
            title="Nothing here"
            description={
              hasFilters
                ? 'No product matches these filters. Try clearing them.'
                : 'No products have been assigned to your organisation yet.'
            }
          />
        ) : (
          <div className="shop-grid">
            {sorted.map((row) => (
              <ProductCard key={row.assignmentId} row={row} shopPath={shopPath} cart={cart} />
            ))}
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ row, shopPath, cart }) {
  const { product } = row;
  const inCart = cart.quantityOf(product._id);

  return (
    <article className="shop-card">
      <Link to={`${shopPath}/${product._id}`} className="shop-card-media">
        {product.imageUrl ? (
          <img src={thumbUrl(product.imageUrl, 480)} alt={product.name} loading="lazy" />
        ) : (
          <Package size={34} color="var(--ink-300)" />
        )}
        {product.attributes?.length > 0 && <span className="shop-card-tag">Options available</span>}
      </Link>

      <div className="shop-card-body">
        <span className="text-xs text-muted">{product.category}</span>
        <Link to={`${shopPath}/${product._id}`} className="shop-card-title">
          {product.name}
        </Link>

        <div className="shop-card-price">
          <span className="shop-price">{currency(row.effectivePrice, product.currency)}</span>
          <span className="text-xs text-muted">per {product.unit}</span>
        </div>

        {row.minOrderQty > 1 && (
          <span className="text-xs text-muted">
            Minimum {row.minOrderQty} {product.unit}
          </span>
        )}

        <button
          type="button"
          className={`btn btn-block ${inCart ? 'btn-secondary' : ''}`}
          onClick={() => cart.add(row, row.minOrderQty || 1)}
        >
          {inCart ? (
            <>
              <Check size={15} /> In basket ({inCart})
            </>
          ) : (
            <>
              <Plus size={15} /> Add to basket
            </>
          )}
        </button>
      </div>
    </article>
  );
}
