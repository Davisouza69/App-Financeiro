/** Fechamento mensal e detalhamento por centro de custo. */
import { setHTML } from '../utils/dom.js';
import { money } from '../utils/format.js';
import { state } from './state.js';

export function renderClosing(entries, costCenters) {
  const month = state.filters.month;
  const monthItems = entries.filter((e) => (e.dueDate || '').slice(0, 7) === month);
  const receitas = monthItems.filter((e) => e.type === 'receita').reduce((s, e) => s + Number(e.amount || 0), 0);
  const despesas = monthItems.filter((e) => e.type === 'despesa').reduce((s, e) => s + Number(e.amount || 0), 0);
  const saldo = receitas - despesas;

  setHTML('monthlyClose', [
    ['Receitas do mês', money(receitas)],
    ['Despesas do mês', money(despesas)],
    ['Saldo do mês', money(saldo)],
    ['Lançamentos no mês', String(monthItems.length)]
  ].map(([a, b]) => `<div class="list-item split"><strong>${a}</strong><span>${b}</span></div>`).join(''));

  const ccMap = new Map();
  monthItems.forEach((e) => {
    const name = costCenters.find((c) => c.id === e.costCenter)?.name || 'Sem centro';
    const delta = e.type === 'despesa' ? Number(e.amount || 0) : -Number(e.amount || 0);
    ccMap.set(name, (ccMap.get(name) || 0) + delta);
  });
  const rows = [...ccMap.entries()];
  setHTML('costCenterBreakdown', rows.length ? rows.map(([name, total]) => `<div class="list-item split"><strong>${name}</strong><span class="${total > 0 ? 'bad' : 'good'}">${money(total)}</span></div>`).join('') : '<div class="empty">Sem dados para o mês selecionado.</div>');
}
