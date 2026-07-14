/** Busca e filtros globais (mês, tipo, status, texto livre). */
import { byId } from '../utils/dom.js';
import { setFilters } from './state.js';
import { refreshAll } from '../app.js';

let debounceTimer = null;

export function initSearchAndFilters() {
  const monthInput = byId('filterMonth');
  const typeSelect = byId('filterType');
  const statusSelect = byId('filterStatus');
  const searchInput = byId('filterQuery');

  const applyFilters = async () => {
    await setFilters({
      month: monthInput.value,
      type: typeSelect.value,
      status: statusSelect.value,
      query: searchInput ? searchInput.value : ''
    });
    await refreshAll();
  };

  monthInput.addEventListener('input', applyFilters);
  typeSelect.addEventListener('input', applyFilters);
  statusSelect.addEventListener('input', applyFilters);

  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilters, 280);
  });
}
