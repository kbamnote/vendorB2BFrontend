import { useMemo, useState } from 'react';
import { Package, Grid2x2, List } from 'lucide-react';
import { myApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import usePaginatedQuery from '../../hooks/usePaginatedQuery';
import useDebounce from '../../hooks/useDebounce';
import {
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
import { PAGE_SIZE } from '../../utils/constants';
import { currency, formatDate } from '../../utils/format';
import { thumbUrl } from '../../utils/upload';

/**
 * The vendor facing catalogue.
 *
 * This page calls /my/products, which the API scopes to the signed-in user's
 * own vendor - there is no way to request another vendor's list from here.
 */
export default function VendorProducts() {
  const { vendor, isVendorStaff } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('table');
  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: 'active',
    }),
    [page, debouncedSearch]
  );

  const { items, pagination, loading, error } = usePaginatedQuery(myApi.products, params);

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
      key: 'tax',
      header: 'Tax',
      align: 'center',
      render: (row) => <span className="text-sm">{row.product.taxPercent || 0}%</span>,
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
  ];

  return (
    <div>
      <PageHeader
        title={isVendorStaff ? 'Products' : 'My products'}
        description={`Everything assigned to ${vendor?.name || 'your organisation'} by the super admin. Products outside this list are not visible to you.`}
      />

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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>
    </div>
  );
}
