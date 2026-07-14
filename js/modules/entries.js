/** Lançamentos: formulário, listagem, edição, exclusão, recorrência e parcelas. */
import { byId, setHTML, setText, toast } from '../utils/dom.js';
import { money, escapeHtml } from '../utils/format.js';
import { todayStr, plusMonths } from '../utils/date.js';
import * as repo from '../db/repository.js';
import { state } from './state.js';
import { refreshAll } from '../app.js';

let editingId = null;

export async function populateEntrySelects() {
  const [accounts, costCenters] = await Promise.all([repo.listAccounts(), repo.listCostCenters()]);
  const accOptions = accounts.map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');
  const ccOptions = costCenters.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  ['entryAccount', 'installmentAccount'].forEach((id) => { const el = byId(id); if (el) el.innerHTML = accOptions; });
  ['entryCostCenter', 'installmentCostCenter'].forEach((id) => { const el = byId(id); if (el) el.innerHTML = ccOptions; });
}

function getAccountName(accounts, id) { return accounts.find((a) => a.id === id)?.name || '-'; }
function getCostCenterName(costCenters, id) { return costCenters.find((c) => c.id === id)?.name || '-'; }

export function filterEntries(entries) {
  return entries.filter((entry) => {
    const monthOk = state.filters.month ? (entry.dueDate || entry.createdAt || '').slice(0, 7) === state.filters.month : true;
    const typeOk = state.filters.type === 'todos' ? true : entry.type === state.filters.type;
    const statusOk = state.filters.status === 'todos' ? true : entry.status === state.filters.status;
    const query = String(state.filters.query || '').trim().toLowerCase();
    const queryOk = !query || [entry.title, entry.category, entry.receipt].filter(Boolean).some((v) => String(v).toLowerCase().includes(query));
    return monthOk && typeOk && statusOk && queryOk;
  }).sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
}

export async function renderEntriesTable(entries, accounts, costCenters) {
  const items = filterEntries(entries);
  setText('entryCount', `${items.length} lançamento(s)`);
  setHTML('entriesTable', items.length ? items.map((e) => `
    <tr>
      <td>${e.dueDate || '-'}</td>
      <td><strong>${escapeHtml(e.title)}</strong><div class="muted">${escapeHtml(e.receipt || '')}</div></td>
      <td>${e.type === 'receita' ? 'Receita' : 'Despesa'}</td>
      <td>${escapeHtml(e.category || '-')}</td>
      <td>${escapeHtml(getAccountName(accounts, e.account))}</td>
      <td>${money(e.amount)}</td>
      <td><span class="pill ${e.status === 'pago' ? 'ok' : 'open'}">${e.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-icon" data-action="edit" data-id="${e.id}" aria-label="Editar lançamento">✎</button>
        <button class="btn btn-danger btn-icon" data-action="delete" data-id="${e.id}" aria-label="Excluir lançamento">✕</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="8"><div class="empty">Nenhum lançamento no filtro atual.</div></td></tr>');
}

function fillFormForEdit(entry) {
  const form = byId('entryForm');
  if (!form || !entry) return;
  form.title.value = entry.title;
  form.amount.value = entry.amount;
  form.type.value = entry.type;
  form.status.value = entry.status;
  form.category.value = entry.category || '';
  form.account.value = entry.account || '';
  form.costCenter.value = entry.costCenter || '';
  form.dueDate.value = entry.dueDate || '';
  form.receipt.value = entry.receipt || '';
  form.recurrence.value = entry.recurrence || 'none';
  editingId = entry.id;
  byId('entryFormSubmit').textContent = 'Atualizar lançamento';
}

function resetEntryForm() {
  editingId = null;
  byId('entryForm').reset();
  byId('entryFormSubmit').textContent = 'Salvar lançamento';
}

async function generateRecurrences(baseEntry, months = 6) {
  const clones = [];
  for (let i = 1; i <= months; i++) {
    clones.push({ ...baseEntry, id: undefined, dueDate: plusMonths(baseEntry.dueDate, i), status: 'pendente', createdAt: todayStr() });
  }
  await repo.saveEntriesBulk(clones);
}

export function initEntryEvents() {
  const form = byId('entryForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const saved = await repo.saveEntry({ ...data, id: editingId || undefined });
    if (saved.recurrence && saved.recurrence !== 'none') {
      const months = saved.recurrence === 'monthly' ? 11 : saved.recurrence === 'quarterly' ? 3 : 1;
      await generateRecurrences(saved, months);
    }
    toast(editingId ? 'Lançamento atualizado.' : 'Lançamento salvo.');
    resetEntryForm();
    await refreshAll();
  });

  byId('entryFormCancel')?.addEventListener('click', resetEntryForm);

  byId('entriesTable').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'delete') {
      if (!confirm('Excluir este lançamento?')) return;
      await repo.deleteEntry(id);
      toast('Lançamento excluído.');
      await refreshAll();
    }
    if (btn.dataset.action === 'edit') {
      const entries = await repo.listEntries();
      const entry = entries.find((x) => x.id === id);
      fillFormForEdit(entry);
      byId('lancamentos').scrollIntoView({ behavior: 'smooth' });
    }
  });
}
