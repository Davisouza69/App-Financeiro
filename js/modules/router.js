/** Controle de navegação por seções + hash deep-link. */
import { $$, byId } from '../utils/dom.js';
import { state, setSection } from './state.js';

export function switchSection(sectionId) {
  $$('.section').forEach((s) => s.classList.toggle('active', s.id === sectionId));
  $$('.nav button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.sectionTarget === sectionId)));
  const target = byId(sectionId);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setSection(sectionId);
}

export function initRouter() {
  $$('.nav button').forEach((btn) => btn.addEventListener('click', () => switchSection(btn.dataset.sectionTarget)));
  window.addEventListener('hashchange', () => {
    const id = location.hash.replace('#', '');
    if (id && byId(id)) switchSection(id);
  });
  if (location.hash && byId(location.hash.replace('#', ''))) switchSection(location.hash.replace('#', ''));
  else switchSection(state.activeSection || 'painel');
}
