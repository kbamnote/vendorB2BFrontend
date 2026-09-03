import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Grid2x2, List, ShoppingCart, X } from 'lucide-react';
import { myApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import usePaginatedQuery from '../../hooks/usePaginatedQuery';
import useDebounce from '../../hooks/useDebounce';
import RequestQuoteModal from '../../components/forms/RequestQuoteModal';
import {
  Button,
  Card,
  CardBody,
  DataTable,
  EmptyState,
  LoadingBlock,
  Pagination,
  PageHeader,
  SearchInput,
  StatusBadge,
} from '../../components/ui';
import { PAGE_SIZE, REQUESTS_ROUTE } from '../../utils/constants';
import { currency, formatDate } from '../../utils/format';
import { thumbUrl } from '../../utils/upload';

/**
 * The vendor facing catalogue.
 *
 * Reads through /my/products, which the API scopes to the signed-in user's own
 * vendor. Quantities entered here build up a purchase request that the super
 * admin prices and returns as a quotation.
 */
export default function VendorProducts() {
  const { user, vendor, isVendorStaff } = useAuth();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('table');
  const debouncedSearch = useDebounce(search);

  // productId -> { productId, name, sku, unit, effectivePrice, quantity }
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);

  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined, status: 'active' }),
    [page, debouncedSearch]
  );

  const { items, pagination, loading, error } = usePaginatedQuery(myApi.products, params);

  const lines = useMemo(() => Object.values(cart), [cart]);
  const totalUnits = lines.reduce((sum, line) => sum + line.quantity, 0);

  const setQuantity = (row, rawValue) => {
    const quantity = Math.max(0, Math.floor(Number(rawValue) || 0));
    const productId = row.product._id;

    setCart((current) => {
      const next = { ...current };
      if (!quantity) {
        delete next[productId];
        return next;
      }
      next[productId] = {
        productId,
        name: row.product.name,
        sku: row.product.sku,
        unit: row.product.unit,
        effectivePrice: row.effectivePrice,
        quantity,
      };
      return next;
    });
  };

  // Used from inside the review modal, where only the id is to hand.
  const setQuantityById = (productId, rawValue) => {
    const quantity = Math.max(0, Math.floor(Number(rawValue) || 0));
    setCart((current) => {
      const next = { ...current };
      if (!quantity) delete next[productId];
      else next[productId] = { ...next[productId], quantity };
      return next;
    });
  };

  const removeLine = (productId) =>
    setCart((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });

  const quantityInput = (row) => (
    <input
      className="input"
      type="number"
      min="0"
      step="1"
      placeholder="0"
      style={{ width: 92, textAlign: 'center' }}
      value={cart[row.product._id]?.quantity ?? ''}
      onChange={(e) => setQuantity(row, e.target.value)}
      onClick={(e) => e.stopPropagation()}
      aria-label={`Quantity for ${row.product.name}`}
    />
  );

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <div className="row gap-12">
          {row.product.imageUrl ? (
            <img className="thumb" src={thumbUrl(row.product.imageUrl)} alt="" loading="lazy" />
          ) : (
            <div className="avatar sq">
              <Package size={16} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div className="cell-primary truncate">{row.product.name}</div>
            <div className="text-xs text-muted mono">{row.product.sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span className="badge">{row.product.category}</span>,
    },
    {
      key: 'price',
      header: 'Your price',
      render: (row) => (
        <div>
          <div className="text-strong">{currency(row.effectivePrice, row.product.currency)}</div>
          <div className="text-xs text-muted">per {row.product.unit}</div>
        </div>
      ),
    },
    {
      key: 'moq',
      header: 'Min. order',
      align: 'center',
      render: (row) => (
        <span className="text-sm">
          {row.minOrderQty} {row.product.unit}
        </span>
      ),
    },
    {
      key: 'assignedAt',
      header: 'Available since',
      render: (row) => <span className="text-sm text-muted">{formatDate(row.assignedAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge active={row.product.isActive} />,
    },
    {
      key: 'quantity',
      header: 'Order qty',
      align: 'center',
      render: quantityInput,
    },
  ];

  return (
    <div>
      <PageHeader
        title={isVendorStaff ? 'Products' : 'My products'}
        description={`Everything assigned to ${
          vendor?.name || 'your organisation'
        }. Enter the quantities you want and send a request - the super admin will reply with a quotation.`}
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate(REQUESTS_ROUTE[user?.role] || '/')}
          >
            View my requests
          </Button>
        }
      />

      {lines.length > 0 && (
        <div className="card request-bar">
          <div className="row gap-12 grow" style={{ minWidth: 0 }}>
            <div className="stat-icon" style={{ position: 'static', width: 38, height: 38 }}>
              <ShoppingCart size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="text-strong">
                {lines.length} product{lines.length === 1 ? '' : 's'} selected
              </div>
              <div className="text-xs text-muted">{totalUnits} units in this request</div>
            </div>
          </div>
          <div className="row gap-8">
            <Button variant="ghost" icon={X} onClick={() => setCart({})}>
              Clear
            </Button>
            <Button icon={ShoppingCart} onClick={() => setCartOpen(true)}>
              Review &amp; send request
            </Button>
          </div>
        </div>
      )}

      <Card>
        <div className="toolbar">
          <SearchInput
            className="search"
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search your products..."
          />
          <div className="row gap-6" style={{ marginLeft: 'auto' }}>
            <span className="text-sm text-muted nowrap" style={{ marginRight: 8 }}>
              {pagination.total} product{pagination.total === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              className={`btn btn-icon ${view === 'table' ? '' : 'btn-secondary'}`}
              onClick={() => setView('table')}
              title="Table view"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              className={`btn btn-icon ${view === 'grid' ? '' : 'btn-secondary'}`}
              onClick={() => setView('grid')}
              title="Card view"
            >
              <Grid2x2 size={15} />
            </button>
          </div>
        </div>

        {view === 'table' ? (
          <DataTable
            columns={columns}
            rows={items}
            rowKey={(row) => row.assignmentId}
            loading={loading}
            error={error}
            empty={{
              icon: Package,
              title: 'No products available',
              description: search
                ? 'No assigned product matches your search.'
                : 'Your super admin has not assigned any product to your organisation yet.',
            }}
          />
        ) : (
          <CardBody>
            {loading ? (
              <LoadingBlock />
            ) : error ? (
              <div className="alert alert-error">{error.message}</div>
            ) : !items.length ? (
              <EmptyState
                icon={Package}
                title="No products available"
                description="Nothing has been assigned to your organisation yet."
              />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
                {items.map((row) => (
                  <div key={row.assignmentId} className="card" style={{ overflow: 'hidden' }}>
                    <div
                      className="center"
                      style={{
                        height: 120,
                        background: 'var(--ink-50)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {row.product.imageUrl ? (
                        <img
                          src={thumbUrl(row.product.imageUrl, 480)}
                          alt={row.product.name}
                          style={{ height: '100%', objectFit: 'cover', width: '100%' }}
                        />
                      ) : (
                        <Package size={30} color="var(--ink-300)" />
                      )}
                    </div>
                    <div style={{ padding: 14 }}>
                      <div className="row-between gap-8">
                        <span className="badge">{row.product.category}</span>
                        <StatusBadge active={row.product.isActive} />
                      </div>
                      <div className="text-strong mt-8 truncate">{row.product.name}</div>
                      <div className="text-xs text-muted mono">{row.product.sku}</div>
                      <div className="row-between mt-16">
                        <span className="text-strong" style={{ fontSize: 15 }}>
                          {currency(row.effectivePrice, row.product.currency)}
                        </span>
                        <span className="text-xs text-muted">per {row.product.unit}</span>
                      </div>
                      <div className="row gap-8 mt-16">
                        {quantityInput(row)}
                        <span className="text-xs text-muted">{row.product.unit} to request</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      <RequestQuoteModal
        open={cartOpen}
        lines={lines}
        onRemove={removeLine}
        onQuantityChange={setQuantityById}
        onClose={() => setCartOpen(false)}
        onSent={(request) => {
          setCart({});
          navigate(`${REQUESTS_ROUTE[user?.role]}/${request._id}`);
        }}
      />
    </div>
  );
}
