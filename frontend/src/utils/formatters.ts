/**
 * Centralized Currency, Formatting, and Date Utilities for SmartSpend
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  zeroDecimal?: boolean;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', zeroDecimal: true },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR', zeroDecimal: true },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
];

export function getCurrencyConfig(currency: string = 'INR'): CurrencyConfig {
  const clean = (currency || 'INR').toUpperCase().trim();
  const match = SUPPORTED_CURRENCIES.find((c) => c.code === clean);
  if (match) return match;
  return {
    code: clean,
    symbol: `${clean} `,
    name: clean,
    locale: 'en-US',
  };
}

export function getCurrencySymbol(currency: string = 'INR'): string {
  return getCurrencyConfig(currency).symbol;
}

/**
 * Format a monetary amount using the currency's standard locale and symbol
 */
export function formatAmount(
  amount: number,
  currency: string = 'INR',
  options?: { hideSymbol?: boolean; forceDecimals?: boolean }
): string {
  const config = getCurrencyConfig(currency);
  const isZeroDecimal = config.zeroDecimal && !options?.forceDecimals;

  const numVal = typeof amount === 'number' && !isNaN(amount) ? amount : 0;

  const formattedNum = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(numVal);

  if (options?.hideSymbol) {
    return formattedNum;
  }
  return `${config.symbol}${formattedNum}`;
}

/**
 * Clean date formatting adhering to user preference
 */
export function formatDate(
  dateInput: string | Date,
  format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | string = 'DD/MM/YYYY'
): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (format === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  }
  return `${day}/${month}/${year}`;
}

/**
 * Dynamic greeting based on user's local device time
 * 5:00 AM – 11:59 AM → Good morning
 * 12:00 PM – 4:59 PM → Good afternoon
 * 5:00 PM – 8:59 PM → Good evening
 * 9:00 PM – 4:59 AM → Good night
 */
export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface DynamicGreeting {
  greeting: string;
  period: TimePeriod;
  iconName: 'Sun' | 'SunMedium' | 'Sunset' | 'Moon';
}

export function getDynamicGreeting(date: Date = new Date()): DynamicGreeting {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return {
      greeting: 'Good morning',
      period: 'morning',
      iconName: 'Sun',
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: 'Good afternoon',
      period: 'afternoon',
      iconName: 'SunMedium',
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      greeting: 'Good evening',
      period: 'evening',
      iconName: 'Sunset',
    };
  } else {
    return {
      greeting: 'Good night',
      period: 'night',
      iconName: 'Moon',
    };
  }
}
