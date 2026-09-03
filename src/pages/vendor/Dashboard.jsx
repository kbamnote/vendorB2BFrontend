import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, ShoppingBag, ShieldCheck, ArrowRight, Layers } from 'lucide-react';
import { dashboardApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  LoadingBlock,
  PageHeader,
  StatCard,
} from '../../components/ui';
import { currency, formatDate } from '../../utils/format';
import { ROLES } from '../../utils/constants';

export default function VendorDashboard() {
  const { user, vendor, isVendorAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const productsPath = user?.role === ROLES.VENDOR_STAFF ? '/staff/products' : '/vendor/products';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await dashboardApi.summary();
        if (!cancelled) setData(response.data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingBlock label="Loading dashboard" />;
  if (error) return <div className="alert alert-error">{error.message}</div>;

  const { stats, categories = [], recentAssignments = [] } = data || {};
  const maxCategory = categories.reduce((max, item) => Math.max(max, item.count), 0) || 1;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        description={
          isVendorAdmin
            ? `Your workspace for ${vendor?.name}. Manage staff access and review the products assigned to you.`
            : `Products available to ${vendor?.name}. You can browse everything assigned to your organisation.`
        }
      />

      <div className="stat-grid">
        <StatCard
          label="Available products"
          value={stats.activeAssigned}
          meta={`${stats.assignedProducts} assigned in total`}
          icon={ShoppingBag}
        />
        <StatCard
          label="Product categories"
          value={categories.length}
          meta="Across your assigned catalogue"
          icon={Layers}
          tone="blue"
        />
        {isVendorAdmin ? (
          <StatCard
            label="Staff accounts"
            value={stats.staffCount}
            meta="Logins you have issued"
            icon={Users}
            tone="amber"
          />
        ) : (
          <StatCard
            label="Your access"
            value="Staff"
            meta="Read-only product access"
            icon={ShieldCheck}
            tone="amber"
          />
        )}
        <StatCard
          label="Organisation"
          value={vendor?.code || '-'}
          meta={vendor?.name}
          icon={ShieldCheck}
          tone="green"
        />
      </div>

      <div
        className="mt-24"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}
      >
        <Card>
          <CardHeader
            title="Recently assigned to you"
            actions={
              <Link to={productsPath} className="btn btn-secondary btn-sm">
                View all <ArrowRight size={14} />
              </Link>
            }
          />
          <CardBody>
            {recentAssignments.length ? (
              <div>
                {recentAssignments.map((row) => (
                  <div className="list-row" key={row._id}>
                    <div className="avatar sq">
                      <Package size={16} />
                    </div>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="text-strong truncate">{row.product.name}</div>
                      <div className="text-xs text-muted mono">
                        {row.product.sku} - {formatDate(row.assignedAt)}
                      </div>
                    </div>
                    <span className="text-sm text-strong nowrap">
                      {currency(row.effectivePrice, row.product.currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="No products assigned yet"
                description="Your super admin has not assigned any product to your organisation."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Your catalogue by category" subtitle="Where your assigned products sit" />
          <CardBody>
            {categories.length ? (
              <div className="col gap-16">
                {categories.map((item) => (
                  <div key={item.category || 'uncategorised'}>
                    <div className="row-between text-sm">
                      <span className="text-strong">{item.category || 'Uncategorised'}</span>
                      <span className="text-muted">{item.count}</span>
                    </div>
                    <div className="bar-track mt-8">
                      <div className="bar-fill" style={{ width: `${(item.count / maxCategory) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Layers}
                title="Nothing to show yet"
                description="Categories appear once products are assigned to you."
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
