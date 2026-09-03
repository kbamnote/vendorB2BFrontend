import { useState } from 'react';
import { Boxes, Mail, Lock, Eye, EyeOff, ShieldCheck, Layers, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input } from '../components/ui';
import { APP_NAME } from '../utils/constants';
import { fieldErrors } from '../utils/format';

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: 'Role based access',
    text: 'Super admin, vendor admin and staff each see only what belongs to them.',
  },
  {
    icon: Layers,
    title: 'Controlled catalogue',
    text: 'Assign specific products to specific vendors - nothing else is visible.',
  },
  {
    icon: Users,
    title: 'Vendor owned teams',
    text: 'Vendor admins issue staff logins that stay locked to their organisation.',
  },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => {
    setForm((current) => ({ ...current, [key]: e.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError('');
    try {
      const profile = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${profile.name.split(' ')[0]}`);
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(err.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="row gap-12" style={{ position: 'relative', zIndex: 1 }}>
          <div className="sidebar-logo">
            <Boxes size={19} />
          </div>
          <div className="sidebar-brand-name">{APP_NAME}</div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="auth-aside-title">One portal for every vendor relationship.</h2>
          <p className="auth-aside-text">
            Onboard vendors, publish a controlled product catalogue and hand each organisation
            its own admin and staff logins - with strict data isolation end to end.
          </p>

          <div className="auth-points">
            {HIGHLIGHTS.map((item) => (
              <div className="auth-point" key={item.title}>
                <span className="auth-point-icon">
                  <item.icon size={16} />
                </span>
                <span>
                  <strong style={{ color: '#fff', display: 'block' }}>{item.title}</strong>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs" style={{ color: '#7c8bb5', position: 'relative', zIndex: 1 }}>
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-logo">
            <Boxes size={22} />
          </div>

          <h1 className="auth-title">Sign in to your workspace</h1>
          <p className="auth-sub">Use the credentials issued to you by your administrator.</p>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            {formError && <div className="alert alert-error">{formError}</div>}

            <Input
              label="Email address"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              icon={Mail}
              value={form.email}
              onChange={update('email')}
              error={errors.email}
              required
            />

            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                icon={Lock}
                value={form.password}
                onChange={update('password')}
                error={errors.password}
                required
              />
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                style={{ position: 'absolute', right: 4, top: 24 }}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button type="submit" className="btn-block" loading={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="auth-hint">
            <strong style={{ color: 'var(--ink-700)' }}>Demo logins</strong> (after running{' '}
            <code>npm run seed:demo</code>)
            <div className="mt-8 col gap-4">
              <span>
                Super admin: <code>superadmin@portal.com</code> / <code>SuperAdmin@123</code>
              </span>
              <span>
                Vendor admin: <code>admin@adani.com</code> / <code>Vendor@123</code>
              </span>
              <span>
                Vendor staff: <code>staff@adani.com</code> / <code>Staff@123</code>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
