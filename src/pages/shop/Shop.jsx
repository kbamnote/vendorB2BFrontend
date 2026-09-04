import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Plus, Check, LayoutGrid, Sparkles } from 'lucide-react';
import { myApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import usePaginatedQuery from '../../hooks/usePaginatedQuery';
import useDebounce from '../../hooks/useDebounce';
import { Card, EmptyState, LoadingBlock, Pagination, SearchInput } from '../../components/ui';
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
 * The vendor storefront.
 *
 * Reads the same vendor-scoped catalogue as My Products, but presented as a
 * shop: category rail, product cards and an add-to-cart. Checkout submits a
 * purchase request, because B2B pricing is settled by quotation.
 */
export default function Shop() {
  const { user, vendor } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const shopPath = SHOP_ROUTE[user?.role] || '/';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const debouncedSearch = useDebounce(search);

  const [categories, setCategories] = useState([]);
  const [totalAvailable, setTotalAvailable] = useState(0);

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
      search: debouncedSearch || undefined,
      category: category || undefined,
      status: 'active',
      onlyActiveProducts: 'true',
    }),
    [page, debouncedSearch, category]
  );

  const { items, pagination, loading, error } = usePaginatedQuery(myApi.products, params);

  // The API paginates by assignment date; sorting is applied to the page in hand.
  const sorted = useMemo(() => {
    const copy = [...items];
    if (sort === 'price_asc') copy.sort((a, b) => a.effectivePrice - b.effectivePrice);
    if (sort === 'price_desc') copy.sort((a, b) => b.effectivePrice - a.effectivePrice);
    if (sort === 'name') copy.sort((a, b) => a.product.name.localeCompare(b.product.name));
    return copy;
  }, [items, sort]);

  const selectCategory = (value) => {
    setCategory(value);
    setPage(1);
  };

  return (
    <div className="shop">
      <section className="shop-hero">
        <div>
          <span className="badge badge-brand">
            <Sparkles size={12} /> {vendor?.name}
          </span>
          <h1 className="shop-hero-title">Everything available to your organisation</h1>
          <p className="shop-hero-text">
            {totalAvailable} product{totalAvailable === 1 ? '' : 's'} across {categories.length}{' '}
            categor{categories.length === 1 ? 'y' : 'ies'}. Add what you need to the basket and send
            it for a quotation - pricing is confirmed by the Print World team before anything is
            committed.
          </p>
        </div>
        <button type="button" className="btn shop-hero-cta" onClick={() => navigate(`${shopPath}/cart`)}>
          <ShoppingCart size={16} />
          View basket
          {cart.count > 0 && <span className="nav-badge">{cart.count}</span>}
        </button>
      </section>

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
              <SearchInput
                className="search"
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder="Search products..."
              />
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>
                {pagination.total} result{pagination.total === 1 ? '' : 's'}
                {category && ` in ${category}`}
              </span>
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
                  search || category
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
