import { useEffect, useState } from 'react';
import { Save, RefreshCw, Copy, KeyRound } from 'lucide-react';
import { vendorApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Modal, Textarea } from '../ui';
import { fieldErrors } from '../../utils/format';
import { copyCredentials, suggestPassword, validatePassword } from '../../utils/password';

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

const EMPTY_ADMIN = { name: '', email: '', password: '', phone: '', designation: '' };

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates or edits a vendor.
 *
 * On create the form also collects the first vendor admin login, and the API
 * writes both records in one transaction - a new organisation is never left
 * without a way to sign in.
 */
export default function VendorFormModal({ open, vendor, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(vendor);

  const [form, setForm] = useState(EMPTY);
  const [admin, setAdmin] = useState(EMPTY_ADMIN);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setAdmin({ ...EMPTY_ADMIN, password: suggestPassword() });
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

  const setAdminField = (key) => (e) => {
    const { value } = e.target;
    setAdmin((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [`admin.${key}`]: undefined }));
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
    if (form.email && !EMAIL_RX.test(form.email)) next.email = 'Enter a valid email';

    if (!isEdit) {
      if (!admin.name.trim()) next['admin.name'] = 'Admin name is required';
      if (!admin.email.trim()) next['admin.email'] = 'Login email is required';
      else if (!EMAIL_RX.test(admin.email)) next['admin.email'] = 'Enter a valid email';
      const passwordError = validatePassword(admin.password);
      if (passwordError) next['admin.password'] = passwordError;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = { ...form, code: form.code.trim().toUpperCase() };
      if (!isEdit) {
        payload.admin = { ...admin, email: admin.email.trim().toLowerCase() };
      }

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

  const copy = async () => {
    const done = await copyCredentials(admin.email, admin.password);
    if (done) toast.success('Credentials copied to clipboard');
    else toast.error('Could not copy - please copy the details manually');
  };

  return (
    <Modal
      open={open}
      size="md"
      title={isEdit ? `Edit ${vendor?.name}` : 'Create a new vendor'}
      subtitle={
        isEdit
          ? 'Update the organisation details for this vendor.'
          : 'Add an organisation such as Adani, Reliance or Ambuja, together with its admin login.'
      }
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button icon={Save} onClick={submit} loading={saving}>
            {isEdit ? 'Save changes' : 'Create vendor & login'}
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

        {!isEdit && (
          <>
            <div
              className="row gap-8 mt-24"
              style={{ paddingTop: 20, borderTop: '1px solid var(--border)' }}
            >
              <div className="stat-icon" style={{ position: 'static', width: 34, height: 34 }}>
                <KeyRound size={16} />
              </div>
              <div>
                <div className="card-title">Vendor admin login</div>
                <div className="card-subtitle">
                  The credentials this vendor will use to sign in. They can add their own staff
                  afterwards.
                </div>
              </div>
            </div>

            <div className="form-grid mt-16">
              <Input
                label="Admin name"
                placeholder="Ravi Mehta"
                value={admin.name}
                onChange={setAdminField('name')}
                error={errors['admin.name']}
                required
              />
              <Input
                label="Login ID (email)"
                type="email"
                placeholder="admin@adani.com"
                value={admin.email}
                onChange={setAdminField('email')}
                error={errors['admin.email']}
                required
              />

              <div className="span-2">
                <div className="row gap-8" style={{ alignItems: 'flex-end' }}>
                  <Input
                    className="grow"
                    label="Password"
                    value={admin.password}
                    onChange={setAdminField('password')}
                    error={errors['admin.password']}
                    hint="Minimum 8 characters with at least one letter and one number"
                    required
                  />
                  <Button
                    variant="secondary"
                    icon={RefreshCw}
                    onClick={() => setAdmin((c) => ({ ...c, password: suggestPassword() }))}
                    title="Generate a new password"
                  >
                    Generate
                  </Button>
                  <Button
                    variant="secondary"
                    icon={Copy}
                    onClick={copy}
                    title="Copy the login details"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <Input
                label="Admin phone"
                value={admin.phone}
                onChange={setAdminField('phone')}
                error={errors['admin.phone']}
              />
              <Input
                label="Designation"
                placeholder="Procurement Head"
                value={admin.designation}
                onChange={setAdminField('designation')}
                error={errors['admin.designation']}
              />
            </div>

            <div className="alert alert-info mt-16">
              Copy these credentials before saving - the password is hashed on the server and cannot
              be shown again. You can always issue a new one from the vendor page.
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
