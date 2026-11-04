/**
 * Currency metadata and formatting utilities for SmartSpend
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
];

export function getCurrencySymbol(currency: string = 'INR'): string {
  const clean = currency.toUpperCase().trim();
  const match = SUPPORTED_CURRENCIES.find((c) => c.code === clean);
  if (match) return match.symbol;
  return `${clean} `;
}

export function formatAmount(amount: number, currency: string = 'INR'): string {
  const clean = currency.toUpperCase().trim();
  const config = SUPPORTED_CURRENCIES.find((c) => c.code === clean) || {
    code: clean,
    symbol: `${clean} `,
    name: clean,
    locale: 'en-US',
  };

  // Zero-fraction currencies like JPY, KRW typically do not have decimals
  const isZeroDecimal = ['JPY', 'KRW'].includes(clean);

  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(amount);

  return `${config.symbol}${formatted}`;
}

export function formatDate(dateString: string, format: 'DD/MM/YYYY' | 'MM/DD/YYYY' = 'DD/MM/YYYY'): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (format === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  }
  return `${day}/${month}/${year}`;
}
