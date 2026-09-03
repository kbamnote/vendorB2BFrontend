import { useEffect, useMemo, useState } from 'react';
import { Package, Plus, Pencil, Power, Trash2 } from 'lucide-react';
import { productApi } from '../../api/services';
import usePaginatedQuery from '../../hooks/usePaginatedQuery';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import ProductFormModal from '../../components/forms/ProductFormModal';
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
import { currency } from '../../utils/format';
import { thumbUrl } from '../../utils/upload';

export default function Products() {
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('');
  const debouncedSearch = useDebounce(search);

  const [categories, setCategories] = useState([]);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status,
      category: category || undefined,
    }),
    [page, debouncedSearch, status, category]
  );

  const { items, pagination, loading, error, reload } = usePaginatedQuery(productApi.list, params);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(false);

  const loadCategories = async () => {
    try {
      const response = await productApi.categories();
      setCategories(response.data.categories || []);
    } catch {
      // A failed category lookup must not block the product list.
      setCategories([]);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
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
      header: 'Product',
      render: (row) => (
        <div className="row gap-12">
          {row.imageUrl ? (
            <img className="thumb" src={thumbUrl(row.imageUrl)} alt="" loading="lazy" />
          ) : (
            <div className="avatar sq">
              <Package size={16} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div className="cell-primary truncate">{row.name}</div>
            <div className="text-xs text-muted mono">{row.sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span className="badge">{row.category}</span>,
    },
    {
      key: 'basePrice',
      header: 'Base price',
      render: (row) => (
        <div>
          <div className="text-strong">{currency(row.basePrice, row.currency)}</div>
          <div className="text-xs text-muted">per {row.unit}</div>
        </div>
      ),
    },
    {
      key: 'assigned',
      header: 'Assigned to',
      align: 'center',
      render: (row) => (
        <span className="badge badge-brand">
          {row.assignedVendorCount} vendor{row.assignedVendorCount === 1 ? '' : 's'}
        </span>
      ),
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
            title="Edit product"
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
            title={row.isActive ? 'Deactivate' : 'Activate'}
            onClick={() =>
              setConfirm({
                title: row.isActive ? `Deactivate ${row.name}?` : `Activate ${row.name}?`,
                message: row.isActive
                  ? 'Vendors will keep the assignment but the product is flagged inactive across the portal.'
                  : 'The product becomes active again for every vendor it is assigned to.',
                confirmLabel: row.isActive ? 'Deactivate' : 'Activate',
                tone: row.isActive ? 'danger' : 'success',
                action: () => productApi.setStatus(row._id, !row.isActive),
              })
            }
          >
            <Power size={15} color={row.isActive ? 'var(--danger-600)' : 'var(--success-600)'} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title="Delete product"
            onClick={() =>
              setConfirm({
                title: `Delete ${row.name}?`,
                message: `This removes the product from the catalogue and unassigns it from ${row.assignedVendorCount} vendor(s). This cannot be undone.`,
                confirmLabel: 'Delete permanently',
                tone: 'danger',
                action: () => productApi.remove(row._id),
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
        title="Product catalogue"
        description="The master list of everything the business sells. Assign products to a vendor from that vendor's page."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Add product
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
            placeholder="Search by name, SKU, category..."
          />
          <select
            className="select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
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
            <option value="inactive">Inactive only</option>
          </select>
          <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>
            {pagination.total} product{pagination.total === 1 ? '' : 's'}
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          error={error}
          empty={{
            icon: Package,
            title: 'No products found',
            description: search
              ? 'No product matches your search.'
              : 'Add products to the catalogue before assigning them to vendors.',
            action: !search ? (
              <Button icon={Plus} onClick={openCreate}>
                Add product
              </Button>
            ) : null,
          }}
        />

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      <ProductFormModal
        open={formOpen}
        product={editing}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          reload();
          loadCategories();
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
