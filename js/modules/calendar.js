/** Calendário mensal com marcações de vencimento (receita/despesa/pago/pendente). */
import { setHTML } from '../utils/dom.js';
import { daysInMonth, monthKeyOf, todayStr } from '../utils/date.js';
import { money } from '../utils/format.js';

export function renderCalendar(entries, monthKey) {
  const mk = monthKey || monthKeyOf(todayStr());
  const total = daysInMonth(mk);
  const [y, m] = mk.split('-').map(Number);
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const today = todayStr();

  const byDay = new Map();
  entries.filter((e) => (e.dueDate || '').slice(0, 7) === mk).forEach((e) => {
    const day = Number(e.dueDate.slice(8, 10));
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(e);
  });

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push('<div></div>');
  for (let day = 1; day <= total; day++) {
    const dateStr = `${mk}-${String(day).padStart(2, '0')}`;
    const items = byDay.get(day) || [];
    const dots = items.slice(0, 4).map((e) => {
      const color = e.type === 'receita' ? 'var(--color-success)' : (e.status === 'pago' ? 'var(--color-text-faint)' : 'var(--color-error)');
      return `<span class="calendar-dot" style="background:${color}" title="${e.title}: ${money(e.amount)}"></span>`;
    }).join('');
    cells.push(`<div class="calendar-day ${dateStr === today ? 'today' : ''}"><span class="day-num">${day}</span><div>${dots}</div></div>`);
  }

  setHTML('calendarGrid', cells.join(''));
}
