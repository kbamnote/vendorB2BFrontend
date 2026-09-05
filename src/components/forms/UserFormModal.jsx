import { useEffect, useMemo, useState } from 'react';
import { Save, RefreshCw, Copy } from 'lucide-react';
import { userApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Modal, Select } from '../ui';
import {
  LEVEL_LABELS,
  ROLE_LABELS,
  ROLES,
  STAFF_LEVEL_MAX,
  STAFF_LEVEL_MIN,
} from '../../utils/constants';
import { fieldErrors } from '../../utils/format';
import { copyCredentials, suggestPassword, validatePassword } from '../../utils/password';

const EMPTY = {
  name: '',
  email: '',
  password: '',
  phone: '',
  designation: '',
  vendor: '',
  approvalLevel: STAFF_LEVEL_MIN,
};

const STAFF_LEVELS = Array.from(
  { length: STAFF_LEVEL_MAX - STAFF_LEVEL_MIN + 1 },
  (_, index) => STAFF_LEVEL_MIN + index
);

/**
 * Creates or edits a portal login.
 *
 * The email and password fields are only editable on create - an existing
 * password is reset through the dedicated reset action instead.
 */
export default function UserFormModal({
  open,
  user,
  role,
  vendors = null,
  lockedVendor = null,
  onClose,
  onSaved,
}) {
  const toast = useToast();
  const isEdit = Boolean(user);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const roleLabel = ROLE_LABELS[role] || 'user';

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      user
        ? {
            name: user.name || '',
            email: user.email || '',
            password: '',
            phone: user.phone || '',
            designation: user.designation || '',
            vendor: user.vendor?._id || user.vendor || '',
            approvalLevel: user.approvalLevel || STAFF_LEVEL_MIN,
          }
        : { ...EMPTY, password: suggestPassword(), vendor: lockedVendor?._id || '' }
    );
  }, [open, user, lockedVendor]);

  const set = (key) => (e) => {
    const { value } = e.target;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const needsVendorPicker = useMemo(
    () => !isEdit && !lockedVendor && Array.isArray(vendors),
    [isEdit, lockedVendor, vendors]
  );

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!isEdit) {
      if (!form.email.trim()) next.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email';
      const passwordError = validatePassword(form.password);
      if (passwordError) next.password = passwordError;
      if (needsVendorPicker && !form.vendor) next.vendor = 'Select a vendor';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      let response;
      if (isEdit) {
        response = await userApi.update(user._id, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          designation: form.designation,
          ...(role === ROLES.VENDOR_STAFF ? { approvalLevel: Number(form.approvalLevel) } : {}),
        });
      } else {
        response = await userApi.create({
          name: form.name,
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phone: form.phone,
          designation: form.designation,
          role,
          vendor: lockedVendor?._id || form.vendor || undefined,
          ...(role === ROLES.VENDOR_STAFF ? { approvalLevel: Number(form.approvalLevel) } : {}),
        });
      }
      toast.success(response.message);
      onSaved?.(response.data.user);
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    const done = await copyCredentials(form.email, form.password);
    if (done) toast.success('Credentials copied to clipboard');
    else toast.error('Could not copy - please copy the details manually');
  };

  return (
    <Modal
      open={open}
      size="md"
      title={isEdit ? `Edit ${user?.name}` : `Create a ${roleLabel.toLowerCase()} login`}
      subtitle={
        isEdit
          ? 'Update the account details. Use the reset action to change the password.'
          : `The account is permanently linked to ${
              lockedVendor ? lockedVendor.name : 'the selected vendor'
            }.`
      }
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button icon={Save} onClick={submit} loading={saving}>
            {isEdit ? 'Save changes' : 'Create account'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Input
            label="Full name"
            placeholder="Ravi Mehta"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
            required
          />
          <Input
            label="Login email"
            type="email"
            placeholder="admin@vendor.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            required
          />

          {needsVendorPicker && (
            <Select
              className="span-2"
              label="Vendor"
              value={form.vendor}
              onChange={set('vendor')}
              error={errors.vendor}
              required
            >
              <option value="">Select a vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id} disabled={!vendor.isActive}>
                  {vendor.name} ({vendor.code}){vendor.isActive ? '' : ' - deactivated'}
                </option>
              ))}
            </Select>
          )}

          {!isEdit && (
            <div className="span-2">
              <div className="row gap-8" style={{ alignItems: 'flex-end' }}>
                <Input
                  className="grow"
                  label="Temporary password"
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
                  hint="Minimum 8 characters with at least one letter and one number"
                  required
                />
                <Button
                  variant="secondary"
                  icon={RefreshCw}
                  onClick={() => setForm((c) => ({ ...c, password: suggestPassword() }))}
                  title="Generate a new password"
                >
                  Generate
                </Button>
                <Button variant="secondary" icon={Copy} onClick={copy} title="Copy credentials">
                  Copy
                </Button>
              </div>
            </div>
          )}

          <Input label="Phone" value={form.phone} onChange={set('phone')} error={errors.phone} />
          <Input
            label="Designation"
            placeholder={role === ROLES.VENDOR_ADMIN ? 'Procurement Head' : 'Purchase Executive'}
            value={form.designation}
            onChange={set('designation')}
            error={errors.designation}
          />

          {role === ROLES.VENDOR_STAFF && (
            <Select
              className="span-2"
              label="Approval level"
              value={form.approvalLevel}
              onChange={set('approvalLevel')}
              error={errors.approvalLevel}
              hint="Requests this person raises go to the next level above them. Higher levels approve what lower levels send up."
            >
              {STAFF_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {LEVEL_LABELS[level] || `Level ${level}`}
                </option>
              ))}
            </Select>
          )}
        </div>

        {!isEdit && (
          <div className="alert alert-info mt-16">
            Share these credentials with the user securely. They can change the password from their
            profile after signing in.
          </div>
        )}
      </form>
    </Modal>
  );
}
