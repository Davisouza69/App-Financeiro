/** Memória/backup: importação de JSON, limpeza total e status de armazenamento. */
import { byId, setText, toast } from '../utils/dom.js';
import * as repo from '../db/repository.js';
import { refreshAll } from '../app.js';
import { state } from './state.js';

export async function renderMemoryStatus(counts) {
  setText('storageKeyLabel', 'IndexedDB · ffpro_db');
  setText('lastSavedLabel', state.lastSavedAt || 'Ainda não salvo');
  setText('savedCounts', `${counts.entries} lançamentos, ${counts.accounts} contas, ${counts.costCenters} centros de custo, ${counts.goals} metas`);
}

export function initBackupEvents() {
  byId('importBackupInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      await repo.importAll(imported);
      toast('Backup importado com sucesso.');
      await refreshAll();
    } catch (err) {
      alert('Não foi possível importar esse arquivo.');
    }
    e.target.value = '';
  });

  byId('clearAllBtn')?.addEventListener('click', async () => {
    if (!confirm('Deseja apagar toda a memória salva do app neste dispositivo?')) return;
    await repo.wipeAll();
    toast('Memória apagada.');
    await refreshAll();
  });

  byId('loadExampleBtn')?.addEventListener('click', async () => {
    await repo.seedExampleData();
    toast('Exemplo completo carregado.');
    await refreshAll();
  });
}
