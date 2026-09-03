export const initials = (value = '') =>
  String(value)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase() || '?';

export const currency = (amount, code = 'INR') => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '-';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: code || 'INR',
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${code} ${Number(amount).toFixed(2)}`;
  }
};

export const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Turns a server validation payload into { field: message }. */
export const fieldErrors = (error) => {
  if (!error?.errors?.length) return {};
  return error.errors.reduce((acc, item) => {
    if (item.field && !acc[item.field]) acc[item.field] = item.message;
    return acc;
  }, {});
};
