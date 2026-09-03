import { useEffect, useState } from 'react';
import { KeyRound, RefreshCw, Copy } from 'lucide-react';
import { userApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Modal } from '../ui';
import { fieldErrors } from '../../utils/format';
import { copyCredentials, suggestPassword, validatePassword } from '../../utils/password';

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
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
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
    const done = await copyCredentials(user?.email, password);
    if (done) toast.success('Credentials copied');
    else toast.error('Could not copy - please copy manually');
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
