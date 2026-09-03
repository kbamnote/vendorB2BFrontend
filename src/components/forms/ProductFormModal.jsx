import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { productApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Modal, Select, Textarea } from '../ui';
import { fieldErrors } from '../../utils/format';

const EMPTY = {
  name: '',
  sku: '',
  category: 'General',
  description: '',
  unit: 'pcs',
  basePrice: '',
  currency: 'INR',
  hsnCode: '',
  taxPercent: '',
  imageUrl: '',
};

const UNITS = ['pcs', 'box', 'pack', 'ream', 'roll', 'kg', 'litre', 'sqft', 'set'];

export default function ProductFormModal({ open, product, categories = [], onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(product);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      product
        ? {
            name: product.name || '',
            sku: product.sku || '',
            category: product.category || 'General',
            description: product.description || '',
            unit: product.unit || 'pcs',
            basePrice: product.basePrice ?? '',
            currency: product.currency || 'INR',
            hsnCode: product.hsnCode || '',
            taxPercent: product.taxPercent ?? '',
            imageUrl: product.imageUrl || '',
          }
        : EMPTY
    );
  }, [open, product]);

  const set = (key) => (e) => {
    const { value } = e.target;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Product name is required';
    if (!form.sku.trim()) next.sku = 'SKU is required';
    else if (!/^[A-Za-z0-9_-]{2,40}$/.test(form.sku.trim()))
      next.sku = 'Use 2-40 letters, numbers, - or _';
    if (form.basePrice === '' || Number.isNaN(Number(form.basePrice)))
      next.basePrice = 'Base price is required';
    else if (Number(form.basePrice) < 0) next.basePrice = 'Base price cannot be negative';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        sku: form.sku.trim().toUpperCase(),
        basePrice: Number(form.basePrice),
        taxPercent: form.taxPercent === '' ? 0 : Number(form.taxPercent),
        category: form.category?.trim() || 'General',
      };
      const response = isEdit
        ? await productApi.update(product._id, payload)
        : await productApi.create(payload);
      toast.success(response.message);
      onSaved?.(response.data.product);
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      size="md"
      title={isEdit ? `Edit ${product?.name}` : 'Add a product'}
      subtitle="Products live in one master catalogue and are then assigned to specific vendors."
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button icon={Save} onClick={submit} loading={saving}>
            {isEdit ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Input
            className="span-2"
            label="Product name"
            placeholder="A4 Letterhead - 100 GSM"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
            required
          />
          <Input
            label="SKU"
            placeholder="PRN-LH-A4"
            value={form.sku}
            onChange={set('sku')}
            error={errors.sku}
            hint="Unique code across the catalogue"
            required
          />
          <Input
            label="Category"
            placeholder="Stationery"
            list="product-categories"
            value={form.category}
            onChange={set('category')}
            error={errors.category}
          />
          <datalist id="product-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>

          <Input
            label="Base price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.basePrice}
            onChange={set('basePrice')}
            error={errors.basePrice}
            required
          />
          <Select label="Unit" value={form.unit} onChange={set('unit')} error={errors.unit}>
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </Select>

          <Input
            label="Tax %"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.taxPercent}
            onChange={set('taxPercent')}
            error={errors.taxPercent}
          />
          <Input label="HSN code" value={form.hsnCode} onChange={set('hsnCode')} error={errors.hsnCode} />

          <Input
            className="span-2"
            label="Image URL"
            placeholder="https://..."
            value={form.imageUrl}
            onChange={set('imageUrl')}
            error={errors.imageUrl}
          />

          <Textarea
            className="span-2"
            label="Description"
            placeholder="Specification, packaging details, lead time..."
            value={form.description}
            onChange={set('description')}
            error={errors.description}
          />
        </div>
      </form>
    </Modal>
  );
}
