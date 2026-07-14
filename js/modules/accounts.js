/** Contas, centros de custo e transferências entre contas. */
import { byId, setHTML, toast } from '../utils/dom.js';
import { money, escapeHtml } from '../utils/format.js';
import { todayStr } from '../utils/date.js';
import * as repo from '../db/repository.js';
import { refreshAll } from '../app.js';

export async function renderAccounts(accounts, costCenters) {
  setHTML('accountsList', accounts.map((a) => `
    <div class="list-item split">
      <div><strong>${escapeHtml(a.name)}</strong><div class="muted">Saldo: ${money(a.balance)} · ${escapeHtml(a.type || 'corrente')}</div></div>
      <button class="btn btn-secondary" data-action="delete-account" data-id="${a.id}">Excluir</button>
    </div>`).join(''));

  setHTML('costCentersList', costCenters.map((c) => `
    <div class="list-item split">
      <div><strong>${escapeHtml(c.name)}</strong></div>
      <button class="btn btn-secondary" data-action="delete-cc" data-id="${c.id}">Excluir</button>
    </div>`).join(''));

  const options = accounts.map((a) => `<option value="${a.id}">${escapeHtml(a.name)} (${money(a.balance)})</option>`).join('');
  const fromSel = byId('transferFrom'); const toSel = byId('transferTo');
  if (fromSel) fromSel.innerHTML = options;
  if (toSel) toSel.innerHTML = options;
}

export function initAccountEvents() {
  byId('accountForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await repo.saveAccount(data);
    toast('Conta adicionada.');
    e.target.reset();
    await refreshAll();
  });

  byId('costCenterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await repo.saveCostCenter(data);
    toast('Centro de custo adicionado.');
    e.target.reset();
    await refreshAll();
  });

  byId('accountsList').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action="delete-account"]');
    if (!btn) return;
    const accounts = await repo.listAccounts();
    if (accounts.length <= 1) return alert('Mantenha ao menos uma conta cadastrada.');
    if (!confirm('Excluir esta conta?')) return;
    await repo.deleteAccount(btn.dataset.id);
    toast('Conta excluída.');
    await refreshAll();
  });

  byId('costCentersList').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action="delete-cc"]');
    if (!btn) return;
    const costCenters = await repo.listCostCenters();
    if (costCenters.length <= 1) return alert('Mantenha ao menos um centro de custo.');
    if (!confirm('Excluir este centro de custo?')) return;
    await repo.deleteCostCenter(btn.dataset.id);
    toast('Centro de custo excluído.');
    await refreshAll();
  });

  byId('transferForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if (data.fromAccount === data.toAccount) return alert('Escolha contas diferentes para a transferência.');
    await repo.createTransfer({ ...data, date: data.date || todayStr() });
    toast('Transferência realizada.');
    e.target.reset();
    await refreshAll();
  });
}
