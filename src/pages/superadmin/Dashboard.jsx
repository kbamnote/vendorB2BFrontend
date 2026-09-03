import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Package, Users, Link2, ArrowRight, UserCog, FileText } from 'lucide-react';
import { dashboardApi } from '../../api/services';
import {
  Card,
  CardBody,
  CardHeader,
  LoadingBlock,
  PageHeader,
  StatCard,
  StatusBadge,
  EmptyState,
} from '../../components/ui';
import { currency, formatDate } from '../../utils/format';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const { stats, recentVendors = [], recentProducts = [], topVendors = [] } = data || {};
  const maxTop = topVendors.reduce((max, item) => Math.max(max, item.count), 0) || 1;

  return (
    <div>
      <PageHeader
        title="Super admin dashboard"
        description="A live view of vendors, the product catalogue and how they are connected."
      />

      <div className="stat-grid">
        <StatCard
          label="Vendors"
          value={stats.totalVendors}
          meta={`${stats.activeVendors} active - ${stats.inactiveVendors} deactivated`}
          icon={Building2}
        />
        <StatCard
          label="Catalogue products"
          value={stats.totalProducts}
          meta={`${stats.activeProducts} active - ${stats.inactiveProducts} inactive`}
          icon={Package}
          tone="blue"
        />
        <StatCard
          label="Product assignments"
          value={stats.totalAssignments}
          meta="Active vendor-product links"
          icon={Link2}
          tone="green"
        />
        <StatCard
          label="Portal users"
          value={stats.vendorAdmins + stats.vendorStaff}
          meta={`${stats.vendorAdmins} admins - ${stats.vendorStaff} staff`}
          icon={Users}
          tone="amber"
        />
        <StatCard
          label="Awaiting quotation"
          value={stats.awaitingQuotation ?? 0}
          meta={`${stats.totalRequests ?? 0} requests in total`}
          icon={FileText}
          tone={stats.awaitingQuotation ? 'red' : 'green'}
        />
      </div>

      <div
        className="mt-24"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}
      >
        <Card>
          <CardHeader
            title="Vendors by assigned products"
            subtitle="Who has the widest catalogue access"
          />
          <CardBody>
            {topVendors.length ? (
              <div className="col gap-16">
                {topVendors.map((vendor) => (
                  <div key={vendor.code}>
                    <div className="row-between text-sm">
                      <span className="text-strong">{vendor.name}</span>
                      <span className="text-muted">{vendor.count} products</span>
                    </div>
                    <div className="bar-track mt-8">
                      <div className="bar-fill" style={{ width: `${(vendor.count / maxTop) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Link2}
                title="No assignments yet"
                description="Assign products to a vendor to see the split here."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recently added vendors"
            actions={
              <Link to="/admin/vendors" className="btn btn-secondary btn-sm">
                View all <ArrowRight size={14} />
              </Link>
            }
          />
          <CardBody>
            {recentVendors.length ? (
              <div>
                {recentVendors.map((vendor) => (
                  <Link to={`/admin/vendors/${vendor._id}`} className="list-row" key={vendor._id}>
                    <div className="avatar">{vendor.code.slice(0, 2)}</div>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="text-strong truncate">{vendor.name}</div>
                      <div className="text-xs text-muted mono">{vendor.code}</div>
                    </div>
                    <StatusBadge active={vendor.isActive} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Building2}
                title="No vendors yet"
                description="Create your first vendor to get started."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recently added products"
            actions={
              <Link to="/admin/products" className="btn btn-secondary btn-sm">
                View all <ArrowRight size={14} />
              </Link>
            }
          />
          <CardBody>
            {recentProducts.length ? (
              <div>
                {recentProducts.map((product) => (
                  <div className="list-row" key={product._id}>
                    <div className="avatar sq">
                      <Package size={16} />
                    </div>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="text-strong truncate">{product.name}</div>
                      <div className="text-xs text-muted mono">
                        {product.sku} - {formatDate(product.createdAt)}
                      </div>
                    </div>
                    <span className="text-sm text-strong nowrap">
                      {currency(product.basePrice, product.currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="No products yet"
                description="Add products to the catalogue before assigning them."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick actions" subtitle="Common super admin tasks" />
          <CardBody>
            <div className="col gap-12">
              <Link to="/admin/vendors" className="btn btn-secondary btn-block">
                <Building2 size={16} /> Create or manage vendors
              </Link>
              <Link to="/admin/products" className="btn btn-secondary btn-block">
                <Package size={16} /> Manage the product catalogue
              </Link>
              <Link to="/admin/users" className="btn btn-secondary btn-block">
                <UserCog size={16} /> Issue vendor admin logins
              </Link>
              <Link to="/admin/requests" className="btn btn-secondary btn-block">
                <FileText size={16} /> Review quotation requests
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
