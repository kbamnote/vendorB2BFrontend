import { useEffect, useMemo, useState } from 'react';
import { Building2, Check, Save } from 'lucide-react';
import { productApi, vendorApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { Button, EmptyState, LoadingBlock, Modal, SearchInput } from '../ui';

/**
 * Assigns catalogue products to vendors, from the product side.
 *
 * Two modes:
 *  - single product: the checkboxes start from that product's current vendors
 *    and saving syncs the exact set, so unticking removes the assignment.
 *  - bulk (many products): additive only. Removing across a mixed selection
 *    would be ambiguous, so the modal says so and only adds.
 */
export default function AssignVendorsModal({ open, product, productIds = [], onClose, onSaved }) {
  const toast = useToast();
  const isBulk = !product;
  const count = isBulk ? productIds.length : 1;

  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState([]);
  const [initial, setInitial] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setSearch('');
      try {
        const vendorResponse = await vendorApi.list({ page: 1, limit: 100, status: 'active' });
        if (cancelled) return;
        setVendors(vendorResponse.data.items || []);

        if (product) {
          // Pre-tick the vendors this product already reaches.
          const detail = await productApi.get(product._id);
          if (cancelled) return;
          const current = (detail.data.assignments || [])
            .map((row) => row.vendor?._id || row.vendor)
            .filter(Boolean)
            .map(String);
          setSelected(current);
          setInitial(current);
        } else {
          setSelected([]);
          setInitial([]);
        }
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, product, toast]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vendors;
    return vendors.filter(
      (vendor) =>
        vendor.name.toLowerCase().includes(term) || vendor.code.toLowerCase().includes(term)
    );
  }, [vendors, search]);

  const toggle = (id) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );

  const allVisibleSelected = visible.length > 0 && visible.every((v) => selected.includes(v._id));

  const toggleAllVisible = () => {
    const ids = visible.map((v) => v._id);
    setSelected((current) =>
      allVisibleSelected
        ? current.filter((id) => !ids.includes(id))
        : [...new Set([...current, ...ids])]
    );
  };

  const added = selected.filter((id) => !initial.includes(id)).length;
  const removed = initial.filter((id) => !selected.includes(id)).length;
  const changed = isBulk ? selected.length > 0 : added > 0 || removed > 0;

  const submit = async () => {
    setSaving(true);
    try {
      const response = isBulk
        ? await productApi.bulkAssign(productIds, selected)
        : await productApi.setVendors(product._id, selected);
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
      size="md"
      title={isBulk ? `Assign ${count} products to vendors` : `Vendors for ${product?.name}`}
      subtitle={
        isBulk
          ? 'Every selected product becomes visible to every vendor you tick.'
          : 'Tick a vendor to give it this product; untick to take it away.'
      }
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <span className="text-sm text-muted" style={{ marginRight: 'auto' }}>
            {isBulk
              ? `${selected.length} vendor(s) selected`
              : added || removed
                ? [added ? `+${added}` : null, removed ? `-${removed}` : null]
                    .filter(Boolean)
                    .join(' / ')
                : 'No changes'}
          </span>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button icon={Save} onClick={submit} loading={saving} disabled={!changed}>
            {isBulk ? 'Assign' : 'Save vendors'}
          </Button>
        </>
      }
    >
      {loading ? (
        <LoadingBlock label="Loading vendors" />
      ) : !vendors.length ? (
        <EmptyState
          icon={Building2}
          title="No active vendors"
          description="Create a vendor before assigning products."
        />
      ) : (
        <>
          <div className="row gap-12 wrap">
            <SearchInput
              className="grow"
              value={search}
              onChange={setSearch}
              placeholder="Search vendors..."
            />
            <Button variant="secondary" onClick={toggleAllVisible}>
              {allVisibleSelected ? 'Clear shown' : 'Select shown'}
            </Button>
          </div>

          <div
            className="mt-16"
            style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
          >
            {visible.map((vendor) => {
              const checked = selected.includes(vendor._id);
              const wasAssigned = initial.includes(vendor._id);

              return (
                <label key={vendor._id} className="vendor-pick">
                  <input type="checkbox" checked={checked} onChange={() => toggle(vendor._id)} />
                  <div className="avatar">{vendor.code.slice(0, 2)}</div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="text-strong truncate">{vendor.name}</div>
                    <div className="text-xs text-muted mono">{vendor.code}</div>
                  </div>
                  {!isBulk && wasAssigned && (
                    <span className="badge badge-success">
                      <Check size={11} /> Assigned
                    </span>
                  )}
                </label>
              );
            })}
            {!visible.length && (
              <div className="empty" style={{ padding: 28 }}>
                <div className="empty-text">No vendor matches that search.</div>
              </div>
            )}
          </div>

          {isBulk && (
            <div className="alert alert-info mt-16">
              Bulk assignment only adds. To take a product away from a vendor, open that single
              product, or use the vendor&rsquo;s own Assigned products tab.
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
