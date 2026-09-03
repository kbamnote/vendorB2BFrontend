import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Pencil, Power, Trash2, KeyRound, Users } from 'lucide-react';
import { userApi, vendorApi } from '../../api/services';
import usePaginatedQuery from '../../hooks/usePaginatedQuery';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import UserFormModal from '../../components/forms/UserFormModal';
import ResetPasswordModal from '../../components/forms/ResetPasswordModal';
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
import { PAGE_SIZE, ROLES } from '../../utils/constants';
import { formatDate, initials } from '../../utils/format';

export default function VendorAdmins() {
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('');
  const [role, setRole] = useState(ROLES.VENDOR_ADMIN);
  const debouncedSearch = useDebounce(search);

  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await vendorApi.list({ page: 1, limit: 100 });
        if (!cancelled) setVendors(response.data.items || []);
      } catch {
        if (!cancelled) setVendors([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      role,
      status,
      search: debouncedSearch || undefined,
      vendorId: vendorFilter || undefined,
    }),
    [page, role, status, debouncedSearch, vendorFilter]
  );

  const { items, pagination, loading, error, reload } = usePaginatedQuery(userApi.list, params);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(false);

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
      header: 'User',
      render: (row) => (
        <div className="row gap-12">
          <div className="avatar">{initials(row.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div className="cell-primary truncate">{row.name}</div>
            <div className="text-xs text-muted truncate">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (row) =>
        row.vendor ? (
          <Link to={`/admin/vendors/${row.vendor._id}`} className="badge badge-brand">
            {row.vendor.name}
          </Link>
        ) : (
          '-'
        ),
    },
    { key: 'designation', header: 'Designation', render: (row) => row.designation || '-' },
    {
      key: 'lastLoginAt',
      header: 'Last sign-in',
      render: (row) => <span className="text-sm text-muted">{formatDate(row.lastLoginAt)}</span>,
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge active={row.isActive} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="row gap-6" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title="Edit"
            onClick={() => {
              setEditing(row);
              setFormOpen(true);
            }}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title="Reset password"
            onClick={() => setResetUser(row)}
          >
            <KeyRound size={15} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title={row.isActive ? 'Deactivate' : 'Activate'}
            onClick={() =>
              setConfirm({
                title: row.isActive ? `Deactivate ${row.name}?` : `Activate ${row.name}?`,
                message: row.isActive
                  ? 'This login will immediately be blocked from signing in.'
                  : 'This login will be able to sign in again.',
                confirmLabel: row.isActive ? 'Deactivate' : 'Activate',
                tone: row.isActive ? 'danger' : 'success',
                action: () => userApi.setStatus(row._id, !row.isActive),
              })
            }
          >
            <Power size={15} color={row.isActive ? 'var(--danger-600)' : 'var(--success-600)'} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title="Delete"
            onClick={() =>
              setConfirm({
                title: `Delete ${row.name}?`,
                message: 'The account is permanently removed. This cannot be undone.',
                confirmLabel: 'Delete',
                tone: 'danger',
                action: () => userApi.remove(row._id),
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
        title="Vendor accounts"
        description="Issue and manage the admin logins that vendors use to access their workspace. Staff accounts created by those admins are listed here too."
        actions={
          <Button
            icon={UserPlus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            New account
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
            placeholder="Search by name or email..."
          />
          <select
            className="select"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value={ROLES.VENDOR_ADMIN}>Vendor admins</option>
            <option value={ROLES.VENDOR_STAFF}>Vendor staff</option>
          </select>
          <select
            className="select"
            value={vendorFilter}
            onChange={(e) => {
              setVendorFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor._id} value={vendor._id}>
                {vendor.name}
              </option>
            ))}
          </select>
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
            {pagination.total} account{pagination.total === 1 ? '' : 's'}
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          error={error}
          empty={{
            icon: Users,
            title: 'No accounts found',
            description:
              role === ROLES.VENDOR_ADMIN
                ? 'Create a vendor admin login so a vendor can start using the portal.'
                : 'Vendor staff accounts are created by each vendor admin from their own workspace.',
          }}
        />

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      <UserFormModal
        open={formOpen}
        user={editing}
        role={editing ? editing.role : role}
        vendors={vendors}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
      />

      <ResetPasswordModal
        open={Boolean(resetUser)}
        user={resetUser}
        onClose={() => setResetUser(null)}
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
