/**
 * repository.js
 * Camada de repositório: aplica regras de negócio sobre o database.js.
 * A UI nunca deve chamar database.js diretamente — sempre via repository.
 * Cada entidade (entries, accounts, costCenters, goals, budgets, transfers)
 * tem funções específicas de CRUD + consultas de domínio.
 */
import * as db from './database.js';
import { STORES } from './database.js';
import { todayStr, monthKeyOf } from '../utils/date.js';

function uuid() {
  return (crypto && crypto.randomUUID) ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/* ---------------- Entries (lançamentos) ---------------- */

export async function listEntries() {
  return db.getAll(STORES.ENTRIES);
}

export async function saveEntry(entry) {
  const record = {
    id: entry.id || uuid(),
    title: entry.title,
    amount: Number(entry.amount) || 0,
    type: entry.type,
    status: entry.status,
    category: entry.category || '',
    account: entry.account,
    costCenter: entry.costCenter,
    dueDate: entry.dueDate || todayStr(),
    receipt: entry.receipt || '',
    recurrence: entry.recurrence || 'none',
    installmentGroup: entry.installmentGroup || null,
    createdAt: entry.createdAt || todayStr(),
    updatedAt: todayStr(),
    monthKey: monthKeyOf(entry.dueDate || todayStr())
  };
  await db.put(STORES.ENTRIES, record);
  return record;
}

export async function saveEntriesBulk(entries) {
  const records = entries.map((e) => ({
    ...e,
    id: e.id || uuid(),
    monthKey: monthKeyOf(e.dueDate)
  }));
  await db.bulkPut(STORES.ENTRIES, records);
  return records;
}

export async function deleteEntry(id) {
  return db.remove(STORES.ENTRIES, id);
}

export async function deleteEntriesByGroup(groupId) {
  const all = await listEntries();
  const toDelete = all.filter((e) => e.installmentGroup === groupId);
  await Promise.all(toDelete.map((e) => db.remove(STORES.ENTRIES, e.id)));
  return toDelete.length;
}

/* ---------------- Accounts (contas) ---------------- */

export async function listAccounts() {
  return db.getAll(STORES.ACCOUNTS);
}

export async function saveAccount(account) {
  const record = {
    id: account.id || uuid(),
    name: account.name,
    balance: Number(account.balance) || 0,
    type: account.type || 'corrente',
    color: account.color || '#01696f',
    archived: !!account.archived
  };
  await db.put(STORES.ACCOUNTS, record);
  return record;
}

export async function deleteAccount(id) {
  return db.remove(STORES.ACCOUNTS, id);
}

/* ---------------- Cost centers (centros de custo) ---------------- */

export async function listCostCenters() {
  return db.getAll(STORES.COST_CENTERS);
}

export async function saveCostCenter(costCenter) {
  const record = { id: costCenter.id || uuid(), name: costCenter.name };
  await db.put(STORES.COST_CENTERS, record);
  return record;
}

export async function deleteCostCenter(id) {
  return db.remove(STORES.COST_CENTERS, id);
}

/* ---------------- Goals (metas financeiras) ---------------- */

export async function listGoals() {
  return db.getAll(STORES.GOALS);
}

export async function saveGoal(goal) {
  const record = {
    id: goal.id || uuid(),
    title: goal.title,
    targetAmount: Number(goal.targetAmount) || 0,
    currentAmount: Number(goal.currentAmount) || 0,
    deadline: goal.deadline || null,
    status: goal.status || 'ativo',
    color: goal.color || '#01696f'
  };
  await db.put(STORES.GOALS, record);
  return record;
}

export async function deleteGoal(id) {
  return db.remove(STORES.GOALS, id);
}

/* ---------------- Budgets (orçamento por categoria/mês) ---------------- */

export async function listBudgets() {
  return db.getAll(STORES.BUDGETS);
}

export async function saveBudget(budget) {
  const record = {
    id: budget.id || uuid(),
    month: budget.month,
    category: budget.category,
    limit: Number(budget.limit) || 0
  };
  await db.put(STORES.BUDGETS, record);
  return record;
}

export async function deleteBudget(id) {
  return db.remove(STORES.BUDGETS, id);
}

/* ---------------- Transfers (transferências entre contas) ---------------- */

export async function listTransfers() {
  return db.getAll(STORES.TRANSFERS);
}

export async function createTransfer({ fromAccount, toAccount, amount, date, note }) {
  const record = {
    id: uuid(),
    fromAccount,
    toAccount,
    amount: Number(amount) || 0,
    date: date || todayStr(),
    note: note || ''
  };
  await db.put(STORES.TRANSFERS, record);

  const accounts = await listAccounts();
  const from = accounts.find((a) => a.id === fromAccount);
  const to = accounts.find((a) => a.id === toAccount);
  if (from) await saveAccount({ ...from, balance: from.balance - record.amount });
  if (to) await saveAccount({ ...to, balance: to.balance + record.amount });

  return record;
}

/* ---------------- Settings ---------------- */

export async function getSetting(key, fallback = null) {
  const record = await db.getOne(STORES.SETTINGS, key);
  return record ? record.value : fallback;
}

export async function setSetting(key, value) {
  return db.put(STORES.SETTINGS, { key, value });
}

/* ---------------- Backup / restauração ---------------- */

export async function exportAll() {
  return db.exportDatabase();
}

export async function importAll(data) {
  return db.importDatabase(data);
}

export async function wipeAll() {
  return db.clearDatabase();
}

/* ---------------- Seed de dados de exemplo ---------------- */

export async function seedExampleData() {
  await wipeAll();
  const acc1 = await saveAccount({ name: 'Conta principal', balance: 3500, type: 'corrente' });
  const acc2 = await saveAccount({ name: 'Carteira', balance: 400, type: 'dinheiro' });
  const cc1 = await saveCostCenter({ name: 'Casa' });
  const cc2 = await saveCostCenter({ name: 'Trabalho' });
  const cc3 = await saveCostCenter({ name: 'Estudos' });
  const month = monthKeyOf(todayStr());

  const entries = [
    { title: 'Salário', amount: 5200, type: 'receita', status: 'pago', category: 'Renda', account: acc1.id, costCenter: cc2.id, dueDate: `${month}-05`, receipt: 'Transferência' },
    { title: 'Aluguel', amount: 1300, type: 'despesa', status: 'pago', category: 'Moradia', account: acc1.id, costCenter: cc1.id, dueDate: `${month}-10`, receipt: 'Pix' },
    { title: 'Supermercado', amount: 680, type: 'despesa', status: 'pago', category: 'Alimentação', account: acc1.id, costCenter: cc1.id, dueDate: `${month}-08`, receipt: 'Compra mensal' },
    { title: 'Combustível moto', amount: 180, type: 'despesa', status: 'pago', category: 'Transporte', account: acc2.id, costCenter: cc2.id, dueDate: `${month}-11`, receipt: 'Posto' },
    { title: 'Curso', amount: 220, type: 'despesa', status: 'pendente', category: 'Estudos', account: acc1.id, costCenter: cc3.id, dueDate: `${month}-20`, receipt: 'Parcela curso' },
    { title: 'Internet', amount: 120, type: 'despesa', status: 'pendente', category: 'Casa', account: acc1.id, costCenter: cc1.id, dueDate: `${month}-18`, receipt: 'Boleto' }
  ];
  for (const e of entries) await saveEntry(e);

  await saveGoal({ title: 'Reserva de emergência', targetAmount: 10000, currentAmount: 2500, deadline: `${month}-31` });
  await saveBudget({ month, category: 'Alimentação', limit: 900 });
  await saveBudget({ month, category: 'Moradia', limit: 1400 });
}
