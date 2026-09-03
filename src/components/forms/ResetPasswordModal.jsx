import { useEffect, useState } from 'react';
import { KeyRound, RefreshCw, Copy } from 'lucide-react';
import { userApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Modal } from '../ui';
import { fieldErrors } from '../../utils/format';

function suggestPassword() {
  const words = ['Vendor', 'Portal', 'Access', 'Secure', 'Supply', 'Orbit'];
  const word = words[Math.floor(Math.random() * words.length)];
  return `${word}@${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Lets a manager issue a new password for a user they own. */
export default function ResetPasswordModal({ open, user, onClose, onSaved }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword(suggestPassword());
      setError('');
    }
  }, [open]);

  const submit = async () => {
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Minimum 8 characters with at least one letter and one number');
      return;
    }

    setSaving(true);
    try {
      const response = await userApi.resetPassword(user._id, password);
      toast.success(response.message);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(fieldErrors(err).password || err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Email: ${user?.email}\nPassword: ${password}`);
      toast.success('Credentials copied');
    } catch {
      toast.error('Could not copy - please copy manually');
    }
  };

  return (
    <Modal
      open={open}
      title="Reset password"
      subtitle={user ? `New sign-in password for ${user.name}` : ''}
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button icon={KeyRound} onClick={submit} loading={saving}>
            Set password
          </Button>
        </>
      }
    >
      <div className="col gap-12">
        <div className="text-sm text-muted">
          Login email: <span className="text-strong">{user?.email}</span>
        </div>

        <div className="row gap-8" style={{ alignItems: 'flex-end' }}>
          <Input
            className="grow"
            label="New password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            error={error}
          />
          <Button variant="secondary" icon={RefreshCw} onClick={() => setPassword(suggestPassword())}>
            Generate
          </Button>
          <Button variant="secondary" icon={Copy} onClick={copy}>
            Copy
          </Button>
        </div>

        <div className="alert alert-warning">
          The user is not notified automatically - share the new password with them securely.
        </div>
      </div>
    </Modal>
  );
}
