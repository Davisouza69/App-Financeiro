/** Helpers de data usados em filtros, calendário, recorrência e gráficos. */
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function monthKeyOf(dateStr = todayStr()) {
  return String(dateStr).slice(0, 7);
}

export function plusMonths(dateStr, months = 1) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setMonth(d.getMonth() + Number(months || 0));
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  const d1 = new Date(`${a}T12:00:00`);
  const d2 = new Date(`${b}T12:00:00`);
  return Math.round((d2 - d1) / 86400000);
}

export function formatMonthLabel(monthKey) {
  if (!monthKey) return '';
  const [y, m] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
}

export function monthRange(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function daysInMonth(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}
