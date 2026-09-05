import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Tag } from 'lucide-react';
import { productApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Modal, ProductImages, Select, Textarea } from '../ui';
import { fieldErrors } from '../../utils/format';

const EMPTY = {
  name: '',
  sku: '',
  category: 'General',
  shortDescription: '',
  description: '',
  unit: 'pcs',
  basePrice: '',
  currency: 'INR',
  hsnCode: '',
  taxPercent: '',
  images: [],
  attributes: [],
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

    if (!product) {
      setForm(EMPTY);
      return;
    }

    // Older products predate the gallery, so fall back to the single image.
    const images = product.images?.length
      ? product.images
      : product.imageUrl
        ? [{ url: product.imageUrl, publicId: product.imagePublicId || '', alt: '' }]
        : [];

    setForm({
      name: product.name || '',
      sku: product.sku || '',
      category: product.category || 'General',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      unit: product.unit || 'pcs',
      basePrice: product.basePrice ?? '',
      currency: product.currency || 'INR',
      hsnCode: product.hsnCode || '',
      taxPercent: product.taxPercent ?? '',
      images,
      attributes: (product.attributes || []).map((attribute) => ({
        name: attribute.name,
        options: (attribute.options || []).join(', '),
      })),
    });
  }, [open, product]);

  const set = (key) => (e) => {
    const { value } = e.target;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  /* ---------------- option groups ---------------- */

  const addAttribute = () =>
    setForm((current) => ({
      ...current,
      attributes: [...current.attributes, { name: '', options: '' }],
    }));

  const setAttribute = (index, key, value) =>
    setForm((current) => ({
      ...current,
      attributes: current.attributes.map((entry, i) =>
        i === index ? { ...entry, [key]: value } : entry
      ),
    }));

  const removeAttribute = (index) =>
    setForm((current) => ({
      ...current,
      attributes: current.attributes.filter((_, i) => i !== index),
    }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Product name is required';
    if (!form.sku.trim()) next.sku = 'SKU is required';
    else if (!/^[A-Za-z0-9_-]{2,40}$/.test(form.sku.trim()))
      next.sku = 'Use 2-40 letters, numbers, - or _';
    if (form.basePrice === '' || Number.isNaN(Number(form.basePrice)))
      next.basePrice = 'Base price is required';
    else if (Number(form.basePrice) < 0) next.basePrice = 'Base price cannot be negative';

    if (form.attributes.some((entry) => entry.name.trim() && !entry.options.trim())) {
      next.attributes = 'Give every option group at least one value';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const attributes = form.attributes
        .map((entry) => ({
          name: entry.name.trim(),
          options: entry.options
            .split(',')
            .map((option) => option.trim())
            .filter(Boolean),
        }))
        .filter((entry) => entry.name && entry.options.length);

      const payload = {
        ...form,
        sku: form.sku.trim().toUpperCase(),
        basePrice: Number(form.basePrice),
        taxPercent: form.taxPercent === '' ? 0 : Number(form.taxPercent),
        category: form.category?.trim() || 'General',
        attributes,
        images: form.images,
        // The first image is the primary one used in every listing.
        imageUrl: form.images[0]?.url || '',
        imagePublicId: form.images[0]?.publicId || '',
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
          <Input
            label="HSN code"
            value={form.hsnCode}
            onChange={set('hsnCode')}
            error={errors.hsnCode}
          />

          <Textarea
            className="span-2"
            label="Short description"
            placeholder="One or two lines shown under the product name in the shop"
            value={form.shortDescription}
            onChange={set('shortDescription')}
            error={errors.shortDescription}
            hint="Kept brief - the full description goes below"
            style={{ minHeight: 64 }}
          />

          <Textarea
            className="span-2"
            label="Full description"
            placeholder="Specification, material, packaging details, lead time..."
            value={form.description}
            onChange={set('description')}
            error={errors.description}
          />

          <div className="span-2">
            <ProductImages
              images={form.images}
              disabled={saving}
              onChange={(images) => setForm((current) => ({ ...current, images }))}
            />
          </div>
        </div>

        <div
          className="row gap-8 mt-24"
          style={{ paddingTop: 20, borderTop: '1px solid var(--border)' }}
        >
          <div className="stat-icon" style={{ position: 'static', width: 34, height: 34 }}>
            <Tag size={16} />
          </div>
          <div className="grow">
            <div className="card-title">Options</div>
            <div className="card-subtitle">
              Choices a vendor picks from, such as Size or Finish. Shown as buttons on the product
              page.
            </div>
          </div>
          <Button variant="secondary" icon={Plus} onClick={addAttribute}>
            Add group
          </Button>
        </div>

        {errors.attributes && <div className="field-error mt-8">{errors.attributes}</div>}

        {form.attributes.length > 0 && (
          <div className="col gap-12 mt-16">
            {form.attributes.map((attribute, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div className="row gap-8" key={index} style={{ alignItems: 'flex-end' }}>
                <Input
                  label={index === 0 ? 'Option name' : undefined}
                  placeholder="Size"
                  value={attribute.name}
                  onChange={(e) => setAttribute(index, 'name', e.target.value)}
                  style={{ maxWidth: 180 }}
                />
                <Input
                  className="grow"
                  label={index === 0 ? 'Values (comma separated)' : undefined}
                  placeholder="A4, A5, Letter"
                  value={attribute.options}
                  onChange={(e) => setAttribute(index, 'options', e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  title="Remove this option group"
                  onClick={() => removeAttribute(index)}
                >
                  <Trash2 size={15} color="var(--danger-600)" />
                </button>
              </div>
            ))}
          </div>
        )}
      </form>
    </Modal>
  );
}
