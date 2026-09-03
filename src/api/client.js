import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const TOKEN_KEY = 'vbp_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Listeners registered by AuthContext so a rejected token logs the user out.
const unauthorizedHandlers = new Set();
export const onUnauthorized = (handler) => {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
};

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;

    const normalised = {
      status: status || 0,
      message:
        payload?.message ||
        (error.code === 'ECONNABORTED'
          ? 'The request timed out. Please try again.'
          : 'Unable to reach the server. Check that the API is running.'),
      errors: payload?.errors || null,
    };

    // 401 means the token is gone or invalid; 403 can be a legitimate
    // permission error on a valid session, so only 401 forces a sign-out.
    if (status === 401 && !error.config?.skipAuthRedirect) {
      unauthorizedHandlers.forEach((handler) => handler(normalised));
    }

    return Promise.reject(normalised);
  }
);

export default client;
