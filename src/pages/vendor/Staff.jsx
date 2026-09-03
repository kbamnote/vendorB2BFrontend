import { useMemo, useState } from 'react';
import { UserPlus, Pencil, Power, Trash2, KeyRound, Users } from 'lucide-react';
import { userApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
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

/**
 * Staff management for a vendor admin.
 *
 * The API pins both the listing and the creation to the caller's own vendor,
 * so every account created here stays linked to this organisation.
 */
export default function VendorStaff() {
  const { vendor } = useAuth();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      role: ROLES.VENDOR_STAFF,
      status,
      search: debouncedSearch || undefined,
    }),
    [page, status, debouncedSearch]
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
      header: 'Staff member',
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
    { key: 'designation', header: 'Designation', render: (row) => row.designation || '-' },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '-' },
    {
      key: 'createdAt',
      header: 'Added on',
      render: (row) => <span className="text-sm text-muted">{formatDate(row.createdAt)}</span>,
    },
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
                  ? 'This staff member will immediately lose access to the portal.'
                  : 'This staff member will be able to sign in again.',
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
                message: 'The staff login is permanently removed. This cannot be undone.',
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
        title="Staff accounts"
        description={`Create and manage the logins your team uses. Every account you create stays linked to ${
          vendor?.name || 'your organisation'
        } and can only see products assigned to it.`}
        actions={
          <Button
            icon={UserPlus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            New staff login
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
            placeholder="Search staff by name or email..."
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
            {pagination.total} staff account{pagination.total === 1 ? '' : 's'}
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          error={error}
          empty={{
            icon: Users,
            title: 'No staff accounts yet',
            description: 'Create a login for each team member who needs access to your products.',
            action: (
              <Button
                icon={UserPlus}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                New staff login
              </Button>
            ),
          }}
        />

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      <UserFormModal
        open={formOpen}
        user={editing}
        role={ROLES.VENDOR_STAFF}
        lockedVendor={vendor}
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
