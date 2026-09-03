import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { vendorApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Modal, Textarea } from '../ui';
import { fieldErrors } from '../../utils/format';

const EMPTY = {
  name: '',
  code: '',
  email: '',
  phone: '',
  contactPerson: '',
  gstNumber: '',
  notes: '',
  address: { line1: '', city: '', state: '', country: 'India', pincode: '' },
};

export default function VendorFormModal({ open, vendor, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(vendor);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      vendor
        ? {
            name: vendor.name || '',
            code: vendor.code || '',
            email: vendor.email || '',
            phone: vendor.phone || '',
            contactPerson: vendor.contactPerson || '',
            gstNumber: vendor.gstNumber || '',
            notes: vendor.notes || '',
            address: { ...EMPTY.address, ...(vendor.address || {}) },
          }
        : EMPTY
    );
  }, [open, vendor]);

  const set = (key) => (e) => {
    const { value } = e.target;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setAddress = (key) => (e) => {
    const { value } = e.target;
    setForm((current) => ({ ...current, address: { ...current.address, [key]: value } }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Vendor name is required';
    if (!form.code.trim()) next.code = 'Vendor code is required';
    else if (!/^[A-Za-z0-9_-]{2,20}$/.test(form.code.trim()))
      next.code = 'Use 2-20 letters, numbers, - or _';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = 'Enter a valid email';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = { ...form, code: form.code.trim().toUpperCase() };
      const response = isEdit
        ? await vendorApi.update(vendor._id, payload)
        : await vendorApi.create(payload);
      toast.success(response.message);
      onSaved?.(response.data.vendor);
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
      title={isEdit ? `Edit ${vendor?.name}` : 'Create a new vendor'}
      subtitle={
        isEdit
          ? 'Update the organisation details for this vendor.'
          : 'Add an organisation such as Adani, Reliance or Ambuja.'
      }
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button icon={Save} onClick={submit} loading={saving}>
            {isEdit ? 'Save changes' : 'Create vendor'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Input
            label="Vendor name"
            placeholder="Adani Enterprises"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
            required
          />
          <Input
            label="Vendor code"
            placeholder="ADANI"
            value={form.code}
            onChange={set('code')}
            error={errors.code}
            hint="Short unique identifier, uppercase"
            required
          />
          <Input
            label="Contact person"
            placeholder="Procurement head"
            value={form.contactPerson}
            onChange={set('contactPerson')}
            error={errors.contactPerson}
          />
          <Input
            label="Company email"
            type="email"
            placeholder="procurement@company.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
          />
          <Input label="Phone" value={form.phone} onChange={set('phone')} error={errors.phone} />
          <Input
            label="GST number"
            value={form.gstNumber}
            onChange={set('gstNumber')}
            error={errors.gstNumber}
          />

          <Input
            className="span-2"
            label="Address line"
            value={form.address.line1}
            onChange={setAddress('line1')}
          />
          <Input label="City" value={form.address.city} onChange={setAddress('city')} />
          <Input label="State" value={form.address.state} onChange={setAddress('state')} />
          <Input label="Country" value={form.address.country} onChange={setAddress('country')} />
          <Input label="Pincode" value={form.address.pincode} onChange={setAddress('pincode')} />

          <Textarea
            className="span-2"
            label="Internal notes"
            placeholder="Anything the team should know about this vendor"
            value={form.notes}
            onChange={set('notes')}
            error={errors.notes}
          />
        </div>
      </form>
    </Modal>
  );
}
