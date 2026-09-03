import { useEffect, useMemo, useState } from 'react';
import { PackagePlus, Package } from 'lucide-react';
import { vendorApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce';
import usePaginatedQuery from '../../hooks/usePaginatedQuery';
import { Button, EmptyState, LoadingBlock, Modal, Pagination, SearchInput } from '../ui';
import { currency } from '../../utils/format';

/**
 * Assigns catalogue products to one vendor.
 *
 * Only products that are not already assigned are listed, and the selection
 * survives paging and searching so a large batch can be built up in one go.
 */
export default function AssignProductsModal({ open, vendor, onClose, onSaved }) {
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    if (open) {
      setPage(1);
      setSearch('');
      setSelected([]);
    }
  }, [open]);

  const params = useMemo(
    () => ({ page, limit: 8, search: debouncedSearch || undefined }),
    [page, debouncedSearch]
  );

  const fetcher = useMemo(
    () => (query) => vendorApi.assignableProducts(vendor._id, query),
    [vendor?._id]
  );

  const { items, pagination, loading, error } = usePaginatedQuery(fetcher, params, {
    enabled: open && Boolean(vendor?._id),
  });

  const toggle = (id) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );

  const allOnPageSelected = items.length > 0 && items.every((item) => selected.includes(item._id));

  const toggleAllOnPage = () => {
    const pageIds = items.map((item) => item._id);
    setSelected((current) =>
      allOnPageSelected
        ? current.filter((id) => !pageIds.includes(id))
        : [...new Set([...current, ...pageIds])]
    );
  };

  const submit = async () => {
    if (!selected.length) return;
    setSaving(true);
    try {
      const response = await vendorApi.assignProducts(vendor._id, selected);
      toast.success(response.message);
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      size="lg"
      title={`Assign products to ${vendor?.name || ''}`}
      subtitle="Only the products you assign here will be visible to this vendor and its staff."
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <span className="text-sm text-muted" style={{ marginRight: 'auto' }}>
            {selected.length} product{selected.length === 1 ? '' : 's'} selected
          </span>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button icon={PackagePlus} onClick={submit} loading={saving} disabled={!selected.length}>
            Assign selected
          </Button>
        </>
      }
    >
      <div className="col gap-16">
        <div className="row gap-12 wrap">
          <SearchInput
            className="grow"
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search the catalogue..."
          />
          <Button variant="secondary" onClick={toggleAllOnPage} disabled={!items.length}>
            {allOnPageSelected ? 'Clear this page' : 'Select this page'}
          </Button>
        </div>

        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <div className="alert alert-error">{error.message}</div>
        ) : !items.length ? (
          <EmptyState
            icon={Package}
            title="Nothing left to assign"
            description={
              search
                ? 'No unassigned product matches your search.'
                : 'Every active catalogue product is already assigned to this vendor.'
            }
          />
        ) : (
          <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleAllOnPage}
                      aria-label="Select all on this page"
                    />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Base price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((product) => (
                  <tr
                    key={product._id}
                    onClick={() => toggle(product._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(product._id)}
                        onChange={() => toggle(product._id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                    <td>
                      <div className="cell-primary">{product.name}</div>
                      <div className="text-xs text-muted mono">{product.sku}</div>
                    </td>
                    <td>
                      <span className="badge">{product.category}</span>
                    </td>
                    <td className="text-strong">{currency(product.basePrice, product.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>
    </Modal>
  );
}
