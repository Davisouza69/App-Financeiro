/**
 * app.js
 * Ponto de entrada da aplicação. Orquestra inicialização do banco de dados,
 * carregamento de estado, bind de eventos de todos os módulos e o ciclo
 * central de atualização de tela (refreshAll). É o único arquivo que
 * conhece todos os módulos — os módulos entre si não se conhecem,
 * exceto para importar refreshAll (ponto único de re-render).
 */
import { openDatabase } from './db/database.js';
import * as repo from './db/repository.js';
import { state, loadState, setTheme } from './modules/state.js';
import { initRouter, switchSection } from './modules/router.js';
import { computeDashboard, renderDashboard } from './modules/dashboard.js';
import { populateEntrySelects, renderEntriesTable, initEntryEvents } from './modules/entries.js';
import { renderAccounts, initAccountEvents } from './modules/accounts.js';
import { renderInstallments, initInstallmentEvents } from './modules/installments.js';
import { renderClosing } from './modules/closing.js';
import { renderGoals, renderBudgets, initBudgetGoalEvents } from './modules/budgetGoals.js';
import { renderCalendar } from './modules/calendar.js';
import { checkDueSoonAndNotify, requestNotificationPermission } from './modules/notifications.js';
import { initSearchAndFilters } from './modules/search.js';
import { initExportEvents } from './modules/export.js';
import { renderMemoryStatus, initBackupEvents } from './modules/backup.js';
import { byId } from './utils/dom.js';

/** Recarrega todos os dados do IndexedDB e redesenha cada seção da UI. */
export async function refreshAll() {
  const [entries, accounts, costCenters, goals, budgets] = await Promise.all([
    repo.listEntries(),
    repo.listAccounts(),
    repo.listCostCenters(),
    repo.listGoals(),
    repo.listBudgets()
  ]);

  await populateEntrySelects();

  const dashboardPayload = computeDashboard(entries, accounts, goals, budgets);
  renderDashboard(dashboardPayload);

  await renderEntriesTable(entries, accounts, costCenters);
  await renderAccounts(accounts, costCenters);
  await renderInstallments(entries);
  renderClosing(entries, costCenters);
  await renderGoals(goals);
  await renderBudgets(budgets, entries);
  renderCalendar(entries, state.filters.month);

  await renderMemoryStatus({
    entries: entries.length,
    accounts: accounts.length,
    costCenters: costCenters.length,
    goals: goals.length
  });

  checkDueSoonAndNotify(entries);
}

function initThemeToggle() {
  document.documentElement.setAttribute('data-theme', state.theme || 'light');
  byId('themeToggle').addEventListener('click', async () => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    await setTheme(next);
  });
}

function initQuickActions() {
  byId('quickExpenseBtn').addEventListener('click', () => switchSection('lancamentos'));
  byId('enableNotificationsBtn')?.addEventListener('click', async () => {
    const granted = await requestNotificationPermission();
    alert(granted ? 'Notificações ativadas.' : 'Permissão de notificação não concedida.');
  });
}

function initFilterFormDefaults() {
  byId('filterMonth').value = state.filters.month;
  byId('filterType').value = state.filters.type;
  byId('filterStatus').value = state.filters.status;
  if (byId('filterQuery')) byId('filterQuery').value = state.filters.query || '';
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (err) {
      console.warn('Falha ao registrar Service Worker:', err);
    }
  }
}

async function bootstrap() {
  await openDatabase();
  await loadState();

  const existingAccounts = await repo.listAccounts();
  if (!existingAccounts.length) {
    await repo.saveAccount({ name: 'Conta principal', balance: 0 });
    await repo.saveAccount({ name: 'Carteira', balance: 0 });
  }
  const existingCostCenters = await repo.listCostCenters();
  if (!existingCostCenters.length) {
    await repo.saveCostCenter({ name: 'Pessoal' });
    await repo.saveCostCenter({ name: 'Casa' });
  }

  initThemeToggle();
  initFilterFormDefaults();
  initRouter();
  initQuickActions();
  initEntryEvents();
  initAccountEvents();
  initInstallmentEvents();
  initBudgetGoalEvents();
  initSearchAndFilters();
  initExportEvents();
  initBackupEvents();

  await refreshAll();
  await registerServiceWorker();
}

document.addEventListener('DOMContentLoaded', bootstrap);
