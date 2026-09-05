import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, ShoppingBag, Inbox } from 'lucide-react';
import { requestApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import usePaginatedQuery from '../../hooks/usePaginatedQuery';
import useDebounce from '../../hooks/useDebounce';
import {
  Badge,
  Card,
  DataTable,
  Pagination,
  PageHeader,
  SearchInput,
} from '../../components/ui';
import {
  PAGE_SIZE,
  REQUESTS_ROUTE,
  REQUEST_STATUS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONE,
  levelLabel,
} from '../../utils/constants';
import { currency, formatDate } from '../../utils/format';

const totalUnits = (items = []) => items.reduce((sum, item) => sum + (item.quantity || 0), 0);

/**
 * Shared between the super admin and the vendor roles.
 *
 * The API decides what each caller may see - a vendor role is pinned to its own
 * vendor server-side, so this component only varies the columns it renders.
 */
export default function RequestList() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const basePath = REQUESTS_ROUTE[user?.role] || '/';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [inbox, setInbox] = useState(false);
  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      status: inbox ? undefined : status,
      inbox: inbox ? 'me' : undefined,
      search: debouncedSearch || undefined,
    }),
    [page, status, inbox, debouncedSearch]
  );

  const { items, pagination, loading, error } = usePaginatedQuery(requestApi.list, params);

  const columns = [
    {
      key: 'requestNumber',
      header: 'Request',
      render: (row) => (
        <div>
          <div className="cell-primary mono">{row.requestNumber}</div>
          <div className="text-xs text-muted">{formatDate(row.createdAt)}</div>
        </div>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            key: 'vendor',
            header: 'Vendor',
            render: (row) => (
              <div>
                <div className="text-strong">{row.vendor?.name || '-'}</div>
                <div className="text-xs text-muted mono">{row.vendor?.code}</div>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'raisedBy',
      header: 'Raised by',
      render: (row) => (
        <div>
          <div>{row.requestedBy?.name || '-'}</div>
          <div className="text-xs text-muted">{row.requestedBy?.email}</div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      align: 'center',
      render: (row) => (
        <span className="text-sm nowrap">
          {row.items?.length || 0} line{row.items?.length === 1 ? '' : 's'}
          <span className="text-muted"> / {totalUnits(row.items)} units</span>
        </span>
      ),
    },
    {
      key: 'value',
      header: 'Quoted value',
      render: (row) =>
        row.quotation?.grandTotal ? (
          <span className="text-strong">
            {currency(row.quotation.grandTotal, row.quotation.currency)}
          </span>
        ) : (
          <span className="text-muted text-sm">Not quoted yet</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div>
          <Badge tone={REQUEST_STATUS_TONE[row.status]}>{REQUEST_STATUS_LABELS[row.status]}</Badge>
          {row.status === REQUEST_STATUS.PENDING_APPROVAL && (
            <div className="text-xs text-muted" style={{ marginTop: 3 }}>
              with {levelLabel(row.approval?.currentLevel)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(`${basePath}/${row._id}`)}
        >
          <Eye size={14} />
          {isSuperAdmin && row.status === REQUEST_STATUS.SUBMITTED ? 'Quote' : 'Open'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={isSuperAdmin ? 'Quotation requests' : 'My requests'}
        description={
          isSuperAdmin
            ? 'What each vendor wants to buy and how many units. Open a request to price it and send back a quotation.'
            : 'Purchase requests your organisation has raised, and the quotations sent back for them.'
        }
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
            placeholder="Search by request number or product..."
          />
          {!isSuperAdmin && (
            <button
              type="button"
              className={`btn ${inbox ? '' : 'btn-secondary'}`}
              onClick={() => {
                setInbox((value) => !value);
                setPage(1);
              }}
            >
              <Inbox size={15} />
              Awaiting my approval
            </button>
          )}
          <select
            className="select"
            value={status}
            disabled={inbox}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            {Object.values(REQUEST_STATUS).map((value) => (
              <option key={value} value={value}>
                {REQUEST_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>
            {pagination.total} request{pagination.total === 1 ? '' : 's'}
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          error={error}
          onRowClick={(row) => navigate(`${basePath}/${row._id}`)}
          empty={{
            icon: FileText,
            title: 'No requests yet',
            description: isSuperAdmin
              ? 'When a vendor asks to buy something it will appear here with the quantities they want.'
              : 'Pick the quantities you need on the products page and send a request for a quotation.',
            action: isSuperAdmin ? null : (
              <button
                type="button"
                className="btn"
                onClick={() =>
                  navigate(user?.role === 'vendor_staff' ? '/staff/products' : '/vendor/products')
                }
              >
                <ShoppingBag size={16} /> Browse products
              </button>
            ),
          }}
        />

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>
    </div>
  );
}
