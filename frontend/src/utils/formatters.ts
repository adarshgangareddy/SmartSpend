/**
 * Utility functions for currency and date formatting
 */

export function getCurrencySymbol(currency: string = 'INR'): string {
  switch (currency.toUpperCase().trim()) {
    case 'INR':
      return '₹';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return `${currency.toUpperCase().trim()} `;
  }
}

export function formatAmount(amount: number, currency: string = 'INR'): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${getCurrencySymbol(currency)}${formatted}`;
}

