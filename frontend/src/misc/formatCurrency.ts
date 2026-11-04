export function formatCurrency(amount: number, locale = 'en-US', currency = 'LYD') {
  const targetLocale = locale.startsWith('ar') ? 'ar-LY' : 'en-US';
  return new Intl.NumberFormat(targetLocale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
}

