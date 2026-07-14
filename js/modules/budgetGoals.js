/** Metas financeiras e orçamento por categoria/mês — barras de progresso visuais. */
import { byId, setHTML, toast } from '../utils/dom.js';
import { money, percent, escapeHtml } from '../utils/format.js';
import { monthKeyOf, todayStr, formatMonthLabel } from '../utils/date.js';
import * as repo from '../db/repository.js';
import { refreshAll } from '../app.js';

export async function renderGoals(goals) {
  setHTML('goalsList', goals.length ? goals.map((g) => {
    const progress = g.targetAmount > 0 ? Math.min(1, g.currentAmount / g.targetAmount) : 0;
    const done = progress >= 1;
    return `<div class="list-item">
      <div class="split"><strong>${escapeHtml(g.title)}</strong><span class="pill ${done ? 'ok' : 'open'}">${done ? 'concluída' : 'em progresso'}</span></div>
      <div class="muted">${money(g.currentAmount)} de ${money(g.targetAmount)} · ${percent(progress)}</div>
      <div class="progress-track"><div class="progress-fill" style="width:${(progress * 100).toFixed(1)}%"></div></div>
      <div class="action-row">
        <button class="btn btn-secondary" data-action="add-goal-amount" data-id="${g.id}">+ Aportar</button>
        <button class="btn btn-danger" data-action="delete-goal" data-id="${g.id}">Excluir</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty">Nenhuma meta cadastrada ainda.</div>');
}

export async function renderBudgets(budgets, entries) {
  const monthKey = byId('filterMonth')?.value || monthKeyOf(todayStr());
  const monthBudgets = budgets.filter((b) => b.month === monthKey);
  setHTML('budgetsList', monthBudgets.length ? monthBudgets.map((b) => {
    const spent = entries.filter((e) => e.type === 'despesa' && e.category === b.category && (e.dueDate || '').slice(0, 7) === monthKey).reduce((s, e) => s + Number(e.amount || 0), 0);
    const ratio = b.limit > 0 ? spent / b.limit : 0;
    const over = ratio > 1;
    return `<div class="list-item">
      <div class="split"><strong>${escapeHtml(b.category)}</strong><span class="${over ? 'bad' : 'muted'}">${money(spent)} / ${money(b.limit)}</span></div>
      <div class="progress-track"><div class="progress-fill ${over ? 'over' : ''}" style="width:${Math.min(100, ratio * 100).toFixed(1)}%"></div></div>
      <div class="action-row"><button class="btn btn-danger" data-action="delete-budget" data-id="${b.id}">Excluir</button></div>
    </div>`;
  }).join('') : `<div class="empty">Nenhum orçamento definido para ${formatMonthLabel(monthKey)}.</div>`);
}

export function initBudgetGoalEvents() {
  byId('goalForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await repo.saveGoal(data);
    toast('Meta criada.');
    e.target.reset();
    await refreshAll();
  });

  byId('goalsList')?.addEventListener('click', async (e) => {
    const addBtn = e.target.closest('button[data-action="add-goal-amount"]');
    const delBtn = e.target.closest('button[data-action="delete-goal"]');
    if (addBtn) {
      const amount = prompt('Valor do aporte (R$):', '100');
      if (!amount) return;
      const goals = await repo.listGoals();
      const goal = goals.find((g) => g.id === addBtn.dataset.id);
      if (goal) {
        await repo.saveGoal({ ...goal, currentAmount: Number(goal.currentAmount || 0) + Number(amount) });
        toast('Aporte registrado.');
        await refreshAll();
      }
    }
    if (delBtn) {
      if (!confirm('Excluir esta meta?')) return;
      await repo.deleteGoal(delBtn.dataset.id);
      toast('Meta excluída.');
      await refreshAll();
    }
  });

  byId('budgetForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await repo.saveBudget(data);
    toast('Orçamento definido.');
    e.target.reset();
    await refreshAll();
  });

  byId('budgetsList')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action="delete-budget"]');
    if (!btn) return;
    if (!confirm('Excluir este orçamento?')) return;
    await repo.deleteBudget(btn.dataset.id);
    toast('Orçamento excluído.');
    await refreshAll();
  });
}
