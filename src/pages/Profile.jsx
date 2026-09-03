import { useState } from 'react';
import { Save, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/services';
import { Button, Card, CardBody, CardHeader, Input, PageHeader, RoleBadge } from '../components/ui';
import { fieldErrors, formatDateTime, initials } from '../utils/format';

export default function Profile() {
  const { user, vendor, refresh } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    designation: user?.designation || '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileErrors({});
    try {
      await authApi.updateProfile(profile);
      await refresh();
      toast.success('Profile updated');
    } catch (err) {
      setProfileErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setSavingPassword(true);
    setPasswordErrors({});
    try {
      await authApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (err) {
      setPasswordErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <PageHeader title="My profile" description="Update your details and sign-in password." />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 20 }}>
        <Card>
          <CardBody>
            <div className="row gap-16 wrap">
              <div className="avatar" style={{ width: 56, height: 56, fontSize: 18, borderRadius: 16 }}>
                {initials(user?.name)}
              </div>
              <div className="grow" style={{ minWidth: 200 }}>
                <h2 style={{ fontSize: 17 }}>{user?.name}</h2>
                <div className="text-sm text-muted">{user?.email}</div>
                <div className="row gap-8 mt-8 wrap">
                  <RoleBadge role={user?.role} />
                  {vendor && <span className="badge badge-info">{vendor.name}</span>}
                </div>
              </div>
              <div className="text-sm text-muted">
                Last sign-in
                <div className="text-strong">{formatDateTime(user?.lastLoginAt)}</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Personal details" subtitle="Shown to your administrators." />
          <CardBody>
            <form onSubmit={saveProfile}>
              <div className="form-grid">
                <Input
                  label="Full name"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  error={profileErrors.name}
                  required
                />
                <Input label="Email address" value={user?.email || ''} disabled hint="Email is managed by your administrator" />
                <Input
                  label="Phone"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  error={profileErrors.phone}
                />
                <Input
                  label="Designation"
                  value={profile.designation}
                  onChange={(e) => setProfile((p) => ({ ...p, designation: e.target.value }))}
                  error={profileErrors.designation}
                />
              </div>
              <div className="mt-24">
                <Button type="submit" icon={Save} loading={savingProfile}>
                  Save changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Change password" subtitle="Minimum 8 characters, with at least one letter and one number." />
          <CardBody>
            <form onSubmit={savePassword}>
              <div className="form-grid">
                <Input
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                  error={passwordErrors.currentPassword}
                  required
                />
                <div />
                <Input
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                  error={passwordErrors.newPassword}
                  required
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                  error={passwordErrors.confirmPassword}
                  required
                />
              </div>
              <div className="mt-24">
                <Button type="submit" icon={KeyRound} loading={savingPassword}>
                  Update password
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
