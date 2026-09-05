import client from './client';

/* ---------------- Auth ---------------- */
export const authApi = {
  login: (payload) => client.post('/auth/login', payload),
  me: () => client.get('/auth/me'),
  updateProfile: (payload) => client.patch('/auth/profile', payload),
  changePassword: (payload) => client.patch('/auth/change-password', payload),
};

/* ---------------- Dashboard ---------------- */
export const dashboardApi = {
  summary: () => client.get('/dashboard/summary'),
};

/* ---------------- Vendors (super admin) ---------------- */
export const vendorApi = {
  list: (params) => client.get('/vendors', { params }),
  get: (id) => client.get(`/vendors/${id}`),
  create: (payload) => client.post('/vendors', payload),
  update: (id, payload) => client.put(`/vendors/${id}`, payload),
  setStatus: (id, isActive) => client.patch(`/vendors/${id}/status`, { isActive }),
  remove: (id) => client.delete(`/vendors/${id}`),

  // Product assignment
  products: (vendorId, params) => client.get(`/vendors/${vendorId}/products`, { params }),
  assignableProducts: (vendorId, params) =>
    client.get(`/vendors/${vendorId}/assignable-products`, { params }),
  assignProducts: (vendorId, productIds) =>
    client.post(`/vendors/${vendorId}/products`, { productIds }),
  unassignProducts: (vendorId, productIds) =>
    client.delete(`/vendors/${vendorId}/products`, { data: { productIds } }),
  updateAssignment: (vendorId, productId, payload) =>
    client.patch(`/vendors/${vendorId}/products/${productId}`, payload),
};

/* ---------------- Products (super admin catalogue) ---------------- */
export const productApi = {
  list: (params) => client.get('/products', { params }),
  categories: () => client.get('/products/categories'),
  get: (id) => client.get(`/products/${id}`),
  create: (payload) => client.post('/products', payload),
  update: (id, payload) => client.put(`/products/${id}`, payload),
  setStatus: (id, isActive) => client.patch(`/products/${id}/status`, { isActive }),
  remove: (id) => client.delete(`/products/${id}`),

  // Assignment from the catalogue side
  setVendors: (id, vendorIds) => client.put(`/products/${id}/vendors`, { vendorIds }),
  bulkAssign: (productIds, vendorIds) =>
    client.post('/products/assign', { productIds, vendorIds }),
};

/* ---------------- Users (vendor admins + staff) ---------------- */
export const userApi = {
  list: (params) => client.get('/users', { params }),
  get: (id) => client.get(`/users/${id}`),
  create: (payload) => client.post('/users', payload),
  update: (id, payload) => client.put(`/users/${id}`, payload),
  setStatus: (id, isActive) => client.patch(`/users/${id}/status`, { isActive }),
  resetPassword: (id, password) => client.patch(`/users/${id}/password`, { password }),
  remove: (id) => client.delete(`/users/${id}`),
};

/* ---------------- Purchase requests & quotations ---------------- */
export const requestApi = {
  list: (params) => client.get('/requests', { params }),
  stats: () => client.get('/requests/stats'),
  get: (id) => client.get(`/requests/${id}`),
  create: (payload) => client.post('/requests', payload),
  quote: (id, payload) => client.patch(`/requests/${id}/quote`, payload),
  setStatus: (id, status, note) => client.patch(`/requests/${id}/status`, { status, note }),
};

/* ---------------- Image uploads (Cloudinary) ---------------- */
export const uploadApi = {
  status: () => client.get('/uploads/status'),
  signature: () => client.get('/uploads/signature'),
  destroy: (publicId) => client.delete('/uploads', { data: { publicId } }),
};

/* ---------------- Vendor scoped catalogue ---------------- */
export const myApi = {
  products: (params) => client.get('/my/products', { params }),
  get: (id) => client.get(`/my/products/${id}`),
  categories: () => client.get('/my/categories'),
};
