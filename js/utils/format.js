/** Formatação consistente para moeda, números e texto em toda a UI. */
export function money(value, currency = 'BRL', locale = 'pt-BR') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value || 0));
}

export function percent(value, digits = 1, locale = 'pt-BR') {
  return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value || 0));
}

export function number(value, digits = 0, locale = 'pt-BR') {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value || 0));
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
