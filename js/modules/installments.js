/** Compras parceladas: geração automática de parcelas mensais. */
import { byId, setHTML, toast } from '../utils/dom.js';
import { money, escapeHtml } from '../utils/format.js';
import { plusMonths, todayStr } from '../utils/date.js';
import * as repo from '../db/repository.js';
import { refreshAll } from '../app.js';

export async function renderInstallments(entries) {
  const grouped = new Map();
  entries.filter((e) => e.installmentGroup).forEach((e) => {
    if (!grouped.has(e.installmentGroup)) grouped.set(e.installmentGroup, []);
    grouped.get(e.installmentGroup).push(e);
  });
  const groups = [...grouped.values()];
  setHTML('installmentSummary', groups.length ? groups.map((group) => {
    const first = group[0];
    const paid = group.filter((g) => g.status === 'pago').length;
    const total = group.reduce((s, g) => s + Number(g.amount || 0), 0);
    return `<div class="list-item">
      <div class="split"><strong>${escapeHtml(first.title.replace(/\s\d+\/\d+$/, ''))}</strong><span class="pill ${paid === group.length ? 'ok' : 'open'}">${paid}/${group.length} pagas</span></div>
      <div class="muted">Total: ${money(total)}</div>
      <div class="action-row"><button class="btn btn-danger" data-action="delete-group" data-id="${first.installmentGroup}">Excluir parcelamento</button></div>
    </div>`;
  }).join('') : '<div class="empty">Nenhum parcelamento registrado.</div>');
}

export function initInstallmentEvents() {
  byId('installmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const total = Number(data.total);
    const count = Number(data.count);
    const value = total / count;
    const groupId = crypto.randomUUID ? crypto.randomUUID() : `grp-${Date.now()}`;
    const entries = [];
    for (let i = 0; i < count; i++) {
      entries.push({
        title: `${data.title} ${i + 1}/${count}`,
        amount: Number(value.toFixed(2)),
        type: 'despesa',
        status: 'pendente',
        category: data.category,
        account: data.account,
        costCenter: data.costCenter,
        dueDate: plusMonths(data.firstDate, i),
        receipt: 'Parcela automática',
        createdAt: todayStr(),
        installmentGroup: groupId
      });
    }
    await repo.saveEntriesBulk(entries);
    toast('Parcelas geradas com sucesso.');
    e.target.reset();
    await refreshAll();
  });

  byId('installmentSummary').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action="delete-group"]');
    if (!btn) return;
    if (!confirm('Excluir todas as parcelas deste grupo?')) return;
    await repo.deleteEntriesByGroup(btn.dataset.id);
    toast('Parcelamento excluído.');
    await refreshAll();
  });
}
