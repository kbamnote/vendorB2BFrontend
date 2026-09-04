import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireRole, RedirectIfAuthenticated } from './routes/ProtectedRoute';
import RoleLayout from './components/layout/RoleLayout';
import { ROLES } from './utils/constants';

import Login from './pages/Login';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import RootRedirect from './pages/RootRedirect';

import AdminDashboard from './pages/superadmin/Dashboard';
import Vendors from './pages/superadmin/Vendors';
import VendorDetail from './pages/superadmin/VendorDetail';
import Products from './pages/superadmin/Products';
import VendorAdmins from './pages/superadmin/VendorAdmins';

import VendorDashboard from './pages/vendor/Dashboard';
import VendorProducts from './pages/vendor/Products';
import VendorStaff from './pages/vendor/Staff';

import Shop from './pages/shop/Shop';
import ShopProductDetail from './pages/shop/ProductDetail';
import ShopCart from './pages/shop/Cart';
import RequestList from './pages/requests/RequestList';
import RequestDetail from './pages/requests/RequestDetail';

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        }
      />

      <Route element={<RequireAuth />}>
        <Route element={<RoleLayout />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/profile" element={<Profile />} />

          {/* ---------- Super admin ---------- */}
          <Route element={<RequireRole roles={[ROLES.SUPER_ADMIN]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/vendors" element={<Vendors />} />
            <Route path="/admin/vendors/:id" element={<VendorDetail />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/users" element={<VendorAdmins />} />
            <Route path="/admin/requests" element={<RequestList />} />
            <Route path="/admin/requests/:id" element={<RequestDetail />} />
          </Route>

          {/* ---------- Vendor admin ---------- */}
          <Route element={<RequireRole roles={[ROLES.VENDOR_ADMIN]} />}>
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/vendor/products" element={<VendorProducts />} />
            <Route path="/vendor/staff" element={<VendorStaff />} />
            <Route path="/vendor/shop" element={<Shop />} />
            <Route path="/vendor/shop/cart" element={<ShopCart />} />
            <Route path="/vendor/shop/:id" element={<ShopProductDetail />} />
            <Route path="/vendor/requests" element={<RequestList />} />
            <Route path="/vendor/requests/:id" element={<RequestDetail />} />
          </Route>

          {/* ---------- Vendor staff ---------- */}
          <Route element={<RequireRole roles={[ROLES.VENDOR_STAFF]} />}>
            <Route path="/staff/dashboard" element={<VendorDashboard />} />
            <Route path="/staff/products" element={<VendorProducts />} />
            <Route path="/staff/shop" element={<Shop />} />
            <Route path="/staff/shop/cart" element={<ShopCart />} />
            <Route path="/staff/shop/:id" element={<ShopProductDetail />} />
            <Route path="/staff/requests" element={<RequestList />} />
            <Route path="/staff/requests/:id" element={<RequestDetail />} />
          </Route>

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
