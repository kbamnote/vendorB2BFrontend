import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight,
  Package,
  PackagePlus,
  Pencil,
  Power,
  Trash2,
  UserPlus,
  Users,
  KeyRound,
  Link2,
  Building2,
} from 'lucide-react';
import { vendorApi, userApi } from '../../api/services';
import usePaginatedQuery from '../../hooks/usePaginatedQuery';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import VendorFormModal from '../../components/forms/VendorFormModal';
import UserFormModal from '../../components/forms/UserFormModal';
import ResetPasswordModal from '../../components/forms/ResetPasswordModal';
import AssignProductsModal from '../../components/forms/AssignProductsModal';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  DataTable,
  LoadingBlock,
  Modal,
  Input,
  Pagination,
  PageHeader,
  SearchInput,
  StatCard,
  StatusBadge,
} from '../../components/ui';
import { PAGE_SIZE, ROLES } from '../../utils/constants';
import { currency, formatDate } from '../../utils/format';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Assigned products' },
  { key: 'admins', label: 'Admin accounts' },
];

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('overview');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [priceRow, setPriceRow] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      const response = await vendorApi.get(id);
      setDetail(response.data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  /* ---------------- Assigned products ---------------- */
  const [productPage, setProductPage] = useState(1);
  const [productSearch, setProductSearch] = useState('');
  const debouncedProductSearch = useDebounce(productSearch);

  const productParams = useMemo(
    () => ({
      page: productPage,
      limit: PAGE_SIZE,
      search: debouncedProductSearch || undefined,
    }),
    [productPage, debouncedProductSearch]
  );

  const productFetcher = useCallback((query) => vendorApi.products(id, query), [id]);

  const products = usePaginatedQuery(productFetcher, productParams);

  /* ---------------- Admin accounts ---------------- */
  const [adminPage, setAdminPage] = useState(1);
  const adminParams = useMemo(
    () => ({ page: adminPage, limit: PAGE_SIZE, role: ROLES.VENDOR_ADMIN, vendorId: id }),
    [adminPage, id]
  );
  const admins = usePaginatedQuery(userApi.list, adminParams);

  const refreshAll = () => {
    loadDetail();
    products.reload();
    admins.reload();
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setWorking(true);
    try {
      const response = await confirm.action();
      toast.success(response?.message || 'Done');
      setConfirm(null);
      if (confirm.afterDelete) navigate('/admin/vendors');
      else refreshAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading vendor" />;
  if (error) return <div className="alert alert-error">{error.message}</div>;

  const { vendor, stats } = detail;

  const productColumns = [
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <div className="row gap-12">
          <div className="avatar sq">
            <Package size={16} />
          </div>
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
      key: 'base',
      header: 'Base price',
      render: (row) => (
        <span className="text-muted">{currency(row.product.basePrice, row.product.currency)}</span>
      ),
    },
    {
      key: 'vendorPrice',
      header: 'Vendor price',
      render: (row) => (
        <div>
          <div className="text-strong">{currency(row.effectivePrice, row.product.currency)}</div>
          <div className="text-xs text-muted">
            {row.vendorPrice === null || row.vendorPrice === undefined
              ? 'Using base price'
              : `MOQ ${row.minOrderQty}`}
          </div>
        </div>
      ),
    },
    {
      key: 'assignedAt',
      header: 'Assigned',
      render: (row) => <span className="text-sm text-muted">{formatDate(row.assignedAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge active={row.isActive && row.product.isActive} />,
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
            title="Edit vendor pricing"
            onClick={() =>
              setPriceRow({
                product: row.product,
                vendorPrice: row.vendorPrice ?? '',
                minOrderQty: row.minOrderQty ?? 1,
              })
            }
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title={row.isActive ? 'Pause this assignment' : 'Resume this assignment'}
            onClick={() =>
              setConfirm({
                title: row.isActive ? 'Pause this product?' : 'Resume this product?',
                message: row.isActive
                  ? `${row.product.name} stays assigned but is hidden as inactive for ${vendor.name}.`
                  : `${row.product.name} becomes active again for ${vendor.name}.`,
                confirmLabel: row.isActive ? 'Pause' : 'Resume',
                tone: row.isActive ? 'danger' : 'success',
                action: () =>
                  vendorApi.updateAssignment(vendor._id, row.product._id, {
                    isActive: !row.isActive,
                  }),
              })
            }
          >
            <Power size={15} color={row.isActive ? 'var(--danger-600)' : 'var(--success-600)'} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title="Remove from this vendor"
            onClick={() =>
              setConfirm({
                title: 'Remove this product?',
                message: `${row.product.name} will no longer be visible to ${vendor.name} or its staff.`,
                confirmLabel: 'Remove',
                tone: 'danger',
                action: () => vendorApi.unassignProducts(vendor._id, [row.product._id]),
              })
            }
          >
            <Trash2 size={15} color="var(--danger-600)" />
          </button>
        </div>
      ),
    },
  ];

  const adminColumns = [
    {
      key: 'name',
      header: 'Admin',
      render: (row) => (
        <div>
          <div className="cell-primary">{row.name}</div>
          <div className="text-xs text-muted">{row.email}</div>
        </div>
      ),
    },
    { key: 'designation', header: 'Designation', render: (row) => row.designation || '-' },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '-' },
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
              setEditingUser(row);
              setUserFormOpen(true);
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
                  ? 'This admin will be signed out and blocked from signing in again.'
                  : 'This admin will be able to sign in again.',
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
                message: 'The login is permanently removed. This cannot be undone.',
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
        breadcrumb={
          <div className="breadcrumb">
            <Link to="/admin/vendors">Vendors</Link>
            <ChevronRight size={13} />
            <span className="text-strong">{vendor.name}</span>
          </div>
        }
        title={vendor.name}
        description={vendor.notes || 'Vendor workspace: assigned products and admin accounts.'}
        actions={
          <>
            <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
              Edit vendor
            </Button>
            <Button
              variant={vendor.isActive ? 'danger' : 'success'}
              icon={Power}
              onClick={() =>
                setConfirm({
                  title: vendor.isActive ? `Deactivate ${vendor.name}?` : `Activate ${vendor.name}?`,
                  message: vendor.isActive
                    ? 'Every admin and staff account under this vendor will be blocked from signing in.'
                    : 'The vendor and its users regain access to the portal.',
                  confirmLabel: vendor.isActive ? 'Deactivate' : 'Activate',
                  tone: vendor.isActive ? 'danger' : 'success',
                  action: () => vendorApi.setStatus(vendor._id, !vendor.isActive),
                })
              }
            >
              {vendor.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      />

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard
          label="Assigned products"
          value={stats.productCount}
          meta="Visible to this vendor"
          icon={Link2}
        />
        <StatCard label="Admin accounts" value={stats.adminCount} icon={Users} tone="blue" />
        <StatCard label="Staff accounts" value={stats.staffCount} icon={Users} tone="amber" />
        <StatCard
          label="Status"
          value={vendor.isActive ? 'Active' : 'Deactivated'}
          meta={`Vendor code ${vendor.code}`}
          icon={Building2}
          tone={vendor.isActive ? 'green' : 'red'}
        />
      </div>

      <div className="tabs">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`tab ${tab === item.key ? 'active' : ''}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <Card>
          <CardHeader title="Vendor details" subtitle="Registered organisation information" />
          <CardBody>
            <div className="detail-grid">
              <Detail label="Vendor name" value={vendor.name} />
              <Detail label="Vendor code" value={vendor.code} />
              <Detail label="Contact person" value={vendor.contactPerson} />
              <Detail label="Email" value={vendor.email} />
              <Detail label="Phone" value={vendor.phone} />
              <Detail label="GST number" value={vendor.gstNumber} />
              <Detail
                label="Address"
                value={
                  [
                    vendor.address?.line1,
                    vendor.address?.city,
                    vendor.address?.state,
                    vendor.address?.pincode,
                    vendor.address?.country,
                  ]
                    .filter(Boolean)
                    .join(', ') || '-'
                }
              />
              <Detail label="Created on" value={formatDate(vendor.createdAt)} />
            </div>

            {vendor.notes && (
              <div className="mt-24">
                <div className="detail-label">Internal notes</div>
                <p className="detail-value" style={{ marginTop: 6 }}>
                  {vendor.notes}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'products' && (
        <Card>
          <div className="toolbar">
            <SearchInput
              className="search"
              value={productSearch}
              onChange={(value) => {
                setProductSearch(value);
                setProductPage(1);
              }}
              placeholder="Search assigned products..."
            />
            <Button icon={PackagePlus} onClick={() => setAssignOpen(true)} style={{ marginLeft: 'auto' }}>
              Assign products
            </Button>
          </div>

          <DataTable
            columns={productColumns}
            rows={products.items}
            rowKey={(row) => row.assignmentId}
            loading={products.loading}
            error={products.error}
            empty={{
              icon: Package,
              title: 'No products assigned yet',
              description: `${vendor.name} cannot see any product until you assign one.`,
              action: (
                <Button icon={PackagePlus} onClick={() => setAssignOpen(true)}>
                  Assign products
                </Button>
              ),
            }}
          />

          <Pagination pagination={products.pagination} onPageChange={setProductPage} />
        </Card>
      )}

      {tab === 'admins' && (
        <Card>
          <div className="toolbar">
            <div className="text-sm text-muted">
              Admin logins for {vendor.name}. Each admin can create staff accounts inside this vendor
              only.
            </div>
            <Button
              icon={UserPlus}
              style={{ marginLeft: 'auto' }}
              onClick={() => {
                setEditingUser(null);
                setUserFormOpen(true);
              }}
            >
              New vendor admin
            </Button>
          </div>

          <DataTable
            columns={adminColumns}
            rows={admins.items}
            loading={admins.loading}
            error={admins.error}
            empty={{
              icon: Users,
              title: 'No admin account yet',
              description: 'Create the first admin login so this vendor can access the portal.',
              action: (
                <Button
                  icon={UserPlus}
                  onClick={() => {
                    setEditingUser(null);
                    setUserFormOpen(true);
                  }}
                >
                  New vendor admin
                </Button>
              ),
            }}
          />

          <Pagination pagination={admins.pagination} onPageChange={setAdminPage} />
        </Card>
      )}

      <VendorFormModal
        open={editOpen}
        vendor={vendor}
        onClose={() => setEditOpen(false)}
        onSaved={loadDetail}
      />

      <AssignProductsModal
        open={assignOpen}
        vendor={vendor}
        onClose={() => setAssignOpen(false)}
        onSaved={refreshAll}
      />

      <UserFormModal
        open={userFormOpen}
        user={editingUser}
        role={ROLES.VENDOR_ADMIN}
        lockedVendor={vendor}
        onClose={() => setUserFormOpen(false)}
        onSaved={refreshAll}
      />

      <ResetPasswordModal
        open={Boolean(resetUser)}
        user={resetUser}
        onClose={() => setResetUser(null)}
      />

      <VendorPriceModal
        row={priceRow}
        vendorId={vendor._id}
        onClose={() => setPriceRow(null)}
        onSaved={() => {
          setPriceRow(null);
          products.reload();
        }}
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

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value || '-'}</div>
    </div>
  );
}

/** Vendor specific price / MOQ override for one assigned product. */
function VendorPriceModal({ row, vendorId, onClose, onSaved }) {
  const toast = useToast();
  const [vendorPrice, setVendorPrice] = useState('');
  const [minOrderQty, setMinOrderQty] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (row) {
      setVendorPrice(row.vendorPrice === null || row.vendorPrice === undefined ? '' : row.vendorPrice);
      setMinOrderQty(row.minOrderQty ?? 1);
    }
  }, [row]);

  const submit = async () => {
    setSaving(true);
    try {
      const response = await vendorApi.updateAssignment(vendorId, row.product._id, {
        vendorPrice: vendorPrice === '' ? null : Number(vendorPrice),
        minOrderQty: Number(minOrderQty) || 0,
      });
      toast.success(response.message);
      onSaved?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(row)}
      title="Vendor pricing"
      subtitle={row ? row.product.name : ''}
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Input
          label="Vendor price"
          type="number"
          min="0"
          step="0.01"
          placeholder={row ? String(row.product.basePrice) : ''}
          value={vendorPrice}
          onChange={(e) => setVendorPrice(e.target.value)}
          hint="Leave blank to use the catalogue base price"
        />
        <Input
          label="Minimum order quantity"
          type="number"
          min="0"
          step="1"
          value={minOrderQty}
          onChange={(e) => setMinOrderQty(e.target.value)}
        />
      </div>
    </Modal>
  );
}
