/** Helpers de DOM: atalhos de seleção, render, eventos e toasts. */
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
export const byId = (id) => document.getElementById(id);

export function setText(id, value) {
  const el = byId(id);
  if (el) el.textContent = value;
}

export function setHTML(id, value) {
  const el = byId(id);
  if (el) el.innerHTML = value;
}

export function bind(id, event, handler, options) {
  const el = typeof id === 'string' ? byId(id) : id;
  if (el) el.addEventListener(event, handler, options);
  return el;
}

export function create(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v !== false && v !== null && v !== undefined) el.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((child) => {
    if (child === null || child === undefined) return;
    el.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
  });
  return el;
}

export function toast(message, duration = 2600) {
  let region = byId('toastRegion');
  if (!region) {
    region = create('div', { id: 'toastRegion', className: 'toast-region', 'aria-live': 'polite', 'aria-atomic': 'true' });
    document.body.appendChild(region);
  }
  const item = create('div', { className: 'toast', role: 'status' }, message);
  region.appendChild(item);
  window.setTimeout(() => item.remove(), duration);
}

export function clearNode(node) {
  const el = typeof node === 'string' ? byId(node) : node;
  if (el) el.innerHTML = '';
}
