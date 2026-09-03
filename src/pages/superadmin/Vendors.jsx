import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Pencil, Power, Trash2, Eye } from 'lucide-react';
import { vendorApi } from '../../api/services';
import usePaginatedQuery from '../../hooks/usePaginatedQuery';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import VendorFormModal from '../../components/forms/VendorFormModal';
import {
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Pagination,
  PageHeader,
  SearchInput,
  StatusBadge,
} from '../../components/ui';
import { PAGE_SIZE } from '../../utils/constants';
import { formatDate } from '../../utils/format';

export default function Vendors() {
  const navigate = useNavigate();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined, status }),
    [page, debouncedSearch, status]
  );

  const { items, pagination, loading, error, reload } = usePaginatedQuery(vendorApi.list, params);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (vendor) => {
    setEditing(vendor);
    setFormOpen(true);
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setWorking(true);
    try {
      const response = await confirm.action();
      toast.success(response?.message || 'Done');
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Vendor',
      render: (row) => (
        <div className="row gap-12">
          <div className="avatar">{row.code.slice(0, 2)}</div>
          <div style={{ minWidth: 0 }}>
            <div className="cell-primary truncate">{row.name}</div>
            <div className="text-xs text-muted mono">{row.code}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div>
          <div>{row.contactPerson || '-'}</div>
          <div className="text-xs text-muted">{row.email || row.phone || 'No contact details'}</div>
        </div>
      ),
    },
    {
      key: 'products',
      header: 'Products',
      align: 'center',
      render: (row) => <span className="badge badge-brand">{row.stats?.productCount ?? 0}</span>,
    },
    {
      key: 'users',
      header: 'Users',
      align: 'center',
      render: (row) => (
        <span className="text-sm nowrap">
          {row.stats?.adminCount ?? 0} admin / {row.stats?.staffCount ?? 0} staff
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => <span className="text-sm text-muted">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge active={row.isActive} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="row gap-6" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title="Open vendor"
            onClick={() => navigate(`/admin/vendors/${row._id}`)}
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title="Edit vendor"
            onClick={() => openEdit(row)}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title={row.isActive ? 'Deactivate' : 'Activate'}
            onClick={() =>
              setConfirm({
                title: row.isActive ? `Deactivate ${row.name}?` : `Activate ${row.name}?`,
                message: row.isActive
                  ? 'All admin and staff accounts of this vendor will immediately be blocked from signing in. Their data stays intact.'
                  : 'The vendor and all of its user accounts will be able to sign in again.',
                confirmLabel: row.isActive ? 'Deactivate' : 'Activate',
                tone: row.isActive ? 'danger' : 'success',
                action: () => vendorApi.setStatus(row._id, !row.isActive),
              })
            }
          >
            <Power size={15} color={row.isActive ? 'var(--danger-600)' : 'var(--success-600)'} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title="Delete vendor"
            onClick={() =>
              setConfirm({
                title: `Delete ${row.name}?`,
                message:
                  'This permanently removes the vendor, every admin and staff account under it, and all of its product assignments. This cannot be undone.',
                confirmLabel: 'Delete permanently',
                tone: 'danger',
                action: () => vendorApi.remove(row._id),
              })
            }
          >
            <Trash2 size={15} color="var(--danger-600)" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vendors"
        description="Create the organisations that use this portal, control their access and open their workspace to assign products."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            New vendor
          </Button>
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
            placeholder="Search by name, code, email..."
          />
          <select
            className="select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Deactivated only</option>
          </select>
          <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>
            {pagination.total} vendor{pagination.total === 1 ? '' : 's'}
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          error={error}
          empty={{
            icon: Building2,
            title: 'No vendors found',
            description: search
              ? 'No vendor matches your search.'
              : 'Create your first vendor to start assigning products.',
            action: !search ? (
              <Button icon={Plus} onClick={openCreate}>
                New vendor
              </Button>
            ) : null,
          }}
        />

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      <VendorFormModal
        open={formOpen}
        vendor={editing}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        tone={confirm?.tone}
        loading={working}
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
