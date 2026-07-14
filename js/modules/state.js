/** Estado global reativo simples, persistido no IndexedDB via settings. */
import { todayStr } from '../utils/date.js';
import { getSetting, setSetting } from '../db/repository.js';

const defaultState = {
  theme: 'light',
  lastSavedAt: null,
  filters: { month: '', type: 'todos', status: 'todos', query: '' },
  activeSection: 'painel'
};

export const state = { ...defaultState };

export async function loadState() {
  state.theme = await getSetting('theme', 'light');
  state.activeSection = await getSetting('activeSection', 'painel');
  state.lastSavedAt = await getSetting('lastSavedAt', null);
  state.filters = await getSetting('filters', defaultState.filters) || { ...defaultState.filters };
  if (!state.filters.month) state.filters.month = todayStr().slice(0, 7);
  return state;
}

export async function persistState() {
  state.lastSavedAt = new Date().toLocaleString('pt-BR');
  await setSetting('theme', state.theme);
  await setSetting('activeSection', state.activeSection);
  await setSetting('lastSavedAt', state.lastSavedAt);
  await setSetting('filters', state.filters);
}

export function setTheme(theme) { state.theme = theme; return persistState(); }
export function setSection(section) { state.activeSection = section; return persistState(); }
export function setFilters(partial) { state.filters = { ...state.filters, ...partial }; return persistState(); }
