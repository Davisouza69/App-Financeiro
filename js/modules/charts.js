/** Gráficos com atualização controlada e destruição segura das instâncias. */
import { byId } from '../utils/dom.js';
import { monthKeyOf } from '../utils/date.js';

let categoryChart = null;
let trendChart = null;

function chartColors() {
  return ['#01696f', '#006494', '#437a22', '#b06a00', '#a13544', '#7a39bb', '#0e7490', '#2f7a22'];
}

export function destroyCharts() {
  if (categoryChart) categoryChart.destroy();
  if (trendChart) trendChart.destroy();
  categoryChart = null;
  trendChart = null;
}

export function renderCharts({ entries, month }) {
  const monthKey = month || monthKeyOf(new Date().toISOString().slice(0, 10));
  const monthEntries = entries.filter((e) => (e.dueDate || e.createdAt || '').slice(0, 7) === monthKey);

  const categoryMap = new Map();
  monthEntries.filter((e) => e.type === 'despesa').forEach((e) => {
    const key = e.category || 'Sem categoria';
    categoryMap.set(key, (categoryMap.get(key) || 0) + Number(e.amount || 0));
  });

  const trendMap = new Map();
  entries.forEach((e) => {
    const k = (e.dueDate || e.createdAt || '').slice(0, 7);
    if (!k) return;
    if (!trendMap.has(k)) trendMap.set(k, { receita: 0, despesa: 0 });
    trendMap.get(k)[e.type] += Number(e.amount || 0);
  });

  destroyCharts();
  const ctxA = byId('categoryChart');
  const ctxB = byId('trendChart');
  if (!ctxA || !ctxB) return;

  categoryChart = new Chart(ctxA, {
    type: 'doughnut',
    data: {
      labels: categoryMap.size ? [...categoryMap.keys()] : ['Sem dados'],
      datasets: [{ data: categoryMap.size ? [...categoryMap.values()] : [1], backgroundColor: chartColors() }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  const trendLabels = [...trendMap.keys()].sort();
  trendChart = new Chart(ctxB, {
    type: 'line',
    data: {
      labels: trendLabels.length ? trendLabels : [monthKey],
      datasets: [
        { label: 'Receitas', data: trendLabels.length ? trendLabels.map((k) => trendMap.get(k).receita) : [0], borderColor: '#2f7a22', backgroundColor: 'rgba(47,122,34,.12)', tension: .3, fill: true },
        { label: 'Despesas', data: trendLabels.length ? trendLabels.map((k) => trendMap.get(k).despesa) : [0], borderColor: '#c1293c', backgroundColor: 'rgba(193,41,60,.12)', tension: .3, fill: true }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}
