/** Exportação de dados: CSV filtrado e backup JSON completo. */
import { byId, toast } from '../utils/dom.js';
import { todayStr } from '../utils/date.js';
import * as repo from '../db/repository.js';
import { filterEntries } from './entries.js';
import { state } from './state.js';

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function exportCsv() {
  const [entries, accounts, costCenters] = await Promise.all([repo.listEntries(), repo.listAccounts(), repo.listCostCenters()]);
  const rows = filterEntries(entries);
  const header = ['data', 'titulo', 'tipo', 'categoria', 'conta', 'centro_custo', 'valor', 'status', 'observacao'];
  const lines = rows.map((r) => [
    r.dueDate, r.title, r.type, r.category,
    accounts.find((a) => a.id === r.account)?.name || '-',
    costCenters.find((c) => c.id === r.costCenter)?.name || '-',
    r.amount, r.status, (r.receipt || '').replace(/\n/g, ' ')
  ]);
  const csv = [header, ...lines].map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  downloadFile(`lancamentos-${state.filters.month || 'todos'}.csv`, csv, 'text/csv;charset=utf-8');
  toast('CSV exportado.');
}

export async function exportBackup() {
  const data = await repo.exportAll();
  downloadFile(`backup-financeiro-${todayStr()}.json`, JSON.stringify(data, null, 2), 'application/json');
  toast('Backup exportado.');
}

export function initExportEvents() {
  byId('exportCsvBtn')?.addEventListener('click', exportCsv);
  byId('exportBackupBtn')?.addEventListener('click', exportBackup);
  byId('downloadBackupBtn')?.addEventListener('click', exportBackup);
}
