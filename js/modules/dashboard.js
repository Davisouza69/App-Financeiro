/** Dashboard: KPIs, visão do mês, pendências e diagnósticos. */
import { setText, setHTML } from '../utils/dom.js';
import { money } from '../utils/format.js';
import { daysBetween, todayStr, monthKeyOf, formatMonthLabel } from '../utils/date.js';
import { renderCharts } from './charts.js';
import { state } from './state.js';

export function computeDashboard(entries, accounts = [], goals = [], budgets = []) {
  const monthKey = state.filters.month || monthKeyOf(todayStr());
  const filtered = entries.filter((entry) => {
    const monthOk = state.filters.month ? (entry.dueDate || entry.createdAt || '').slice(0, 7) === state.filters.month : true;
    const typeOk = state.filters.type === 'todos' ? true : entry.type === state.filters.type;
    const statusOk = state.filters.status === 'todos' ? true : entry.status === state.filters.status;
    const query = String(state.filters.query || '').trim().toLowerCase();
    const queryOk = !query || [entry.title, entry.category, entry.receipt].filter(Boolean).some((v) => String(v).toLowerCase().includes(query));
    return monthOk && typeOk && statusOk && queryOk;
  });

  const receitas = filtered.filter((e) => e.type === 'receita' && e.status === 'pago').reduce((s, e) => s + Number(e.amount || 0), 0);
  const despesas = filtered.filter((e) => e.type === 'despesa' && e.status === 'pago').reduce((s, e) => s + Number(e.amount || 0), 0);
  const saldo = receitas - despesas;
  const contasSaldo = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
  const patrimonioLiquido = contasSaldo + entries.filter((e) => e.type === 'receita' && e.status === 'pago').reduce((s, e) => s + Number(e.amount || 0), 0) - entries.filter((e) => e.type === 'despesa' && e.status === 'pago').reduce((s, e) => s + Number(e.amount || 0), 0);
  const upcoming = entries.filter((e) => e.type === 'despesa' && e.status === 'pendente' && e.dueDate && daysBetween(todayStr(), e.dueDate) >= 0 && daysBetween(todayStr(), e.dueDate) <= 7).reduce((s, e) => s + Number(e.amount || 0), 0);

  return { filtered, receitas, despesas, saldo, upcoming, monthKey, patrimonioLiquido, contasSaldo, goals, budgets };
}

export function renderDashboard(payload) {
  const { filtered, receitas, despesas, saldo, upcoming, monthKey, patrimonioLiquido, contasSaldo, goals, budgets } = payload;
  setText('saldoAtual', money(saldo));
  setText('receitasPeriodo', money(receitas));
  setText('despesasPeriodo', money(despesas));
  setText('aVencer', money(upcoming));
  setText('mesReferencia', formatMonthLabel(monthKey));
  setText('saldoResumo', contasSaldo > 0 ? `Patrimônio líquido estimado: ${money(patrimonioLiquido)}` : 'Sem saldo acumulado nas contas.');

  const upcomingItems = filtered.filter((e) => e.status === 'pendente' && e.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);
  setHTML('upcomingList', upcomingItems.length ? upcomingItems.map((e) => {
    const diff = daysBetween(todayStr(), e.dueDate);
    const cls = diff < 0 ? 'late' : diff <= 7 ? 'open' : 'ok';
    const txt = diff < 0 ? `${Math.abs(diff)} dia(s) em atraso` : diff === 0 ? 'vence hoje' : `vence em ${diff} dia(s)`;
    return `<div class="list-item"><div class="split"><strong>${e.title}</strong><span class="pill ${cls}">${txt}</span></div><div class="muted">${money(e.amount)} · ${e.category || 'Sem categoria'}</div></div>`;
  }).join('') : '<div class="empty">Nenhuma conta pendente encontrada.</div>');

  const savingsRate = receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0;
  const goalDone = goals.filter((g) => Number(g.currentAmount || 0) >= Number(g.targetAmount || 0)).length;
  const budgetOver = budgets.filter((b) => {
    const spent = filtered.filter((e) => e.type === 'despesa' && e.category === b.category).reduce((s, e) => s + Number(e.amount || 0), 0);
    return spent > Number(b.limit || 0);
  }).length;

  setHTML('diagnostics', [
    { title: 'Taxa de saldo do período', text: `${savingsRate.toFixed(1)}% do que entrou no mês permaneceu disponível.` },
    { title: 'Metas concluídas', text: `${goalDone} meta(s) já atingidas.` },
    { title: 'Orçamentos estourados', text: budgetOver > 0 ? `${budgetOver} orçamento(s) foram ultrapassados.` : 'Nenhum orçamento excedido no período.' },
    { title: 'Pendências futuras', text: upcoming > 0 ? `Existem ${money(upcoming)} ainda não pagos após hoje.` : 'Não há despesas futuras pendentes registradas.' }
  ].map((d) => `<div class="list-item"><strong>${d.title}</strong><div class="muted">${d.text}</div></div>`).join(''));

  renderCharts({ entries: filtered, month: monthKey });
}
