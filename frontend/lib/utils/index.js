/**
 * Shared Frontend Utility Functions
 */

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

export const formatCurrency = (amount, currency = 'USD') => {
  if (typeof amount !== 'number') return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};
