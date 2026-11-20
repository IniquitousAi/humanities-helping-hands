import { bar, foot } from './chrome.js';
const B = document.body, PAGE = B.dataset.page, MODE = B.dataset.mode;
const LEVEL = new URLSearchParams(location.search).get('level');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const shownMode = PAGE === 'book' ? (LEVEL === 'kids' ? 'kids' : LEVEL === 'technical' ? 'technical' : 'everyone') : MODE;
if (!document.querySelector('header.bar') || shownMode !== MODE) {
  document.querySelectorAll('header.bar, footer.foot, body > .skip, body > .ambient').forEach(e => e.remove());
  B.insertAdjacentHTML('afterbegin', bar(PAGE, shownMode));
  B.insertAdjacentHTML('beforeend', foot(shownMode));
}
const header = document.querySelector('header.bar');
if (header) {
  const clear = () => document.documentElement.style.setProperty('--bar-h', `${Math.ceil(header.getBoundingClientRect().height)}px`);
  clear(); new ResizeObserver(clear).observe(header);
  const spot = /^#[\w-]+$/.test(location.hash) && document.getElementById(location.hash.slice(1));
  if (spot && PAGE !== 'atlas' && PAGE !== 'tech-atlas') spot.scrollIntoView();
}
const toastEl = document.createElement('div'); toastEl.id = 'toast'; toastEl.setAttribute('role', 'status');
B.append(toastEl);

export function toast(text) { toastEl.textContent = text; toastEl.classList.add('on'); clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('on'), 3200); }

const dlg = document.createElement('div'); dlg.className = 'dialog'; dlg.id = 'dialog'; dlg.hidden = true;
dlg.innerHTML = '<div class="dialog-box" role="dialog" aria-modal="true" aria-labelledby="dlg-h"><h3 id="dlg-h"></h3><div id="dlg-p"></div><button class="btn btn-line" type="button" data-close>Close</button></div>';
B.append(dlg);
let back = null;
export function openDialog(title, html) {
  back = document.activeElement; dlg.querySelector('#dlg-h').textContent = title; dlg.querySelector('#dlg-p').innerHTML = html;
  dlg.hidden = false; dlg.querySelector('[data-close]').focus();
}
function closeDialog() { if (dlg.hidden) return; dlg.hidden = true; back?.focus?.(); }
dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) closeDialog(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeDialog(); });

document.addEventListener('click', e => {
  const d = e.target.closest('[data-demo]'); if (d) { e.preventDefault(); toast(d.dataset.demo); return; }
  const g = e.target.closest('[data-dialog]'); if (g) { e.preventDefault(); const [t, ...p] = g.dataset.dialog.split('|'); openDialog(t, `<p>${esc(p.join('|'))}</p>`); }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-mock]'); if (!f) return;
  e.preventDefault(); const s = f.querySelector('.sent'); if (s) s.textContent = f.dataset.mock; else toast(f.dataset.mock);
});
document.querySelectorAll('[role="tablist"]').forEach(list => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const pick = t => tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; const p = document.getElementById(x.getAttribute('aria-controls')); if (p && x.getAttribute('aria-controls') !== t.getAttribute('aria-controls')) p.hidden = true; });
  tabs.forEach(t => {
    t.addEventListener('click', () => { pick(t); const p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = false; });
    t.addEventListener('keydown', e => { const i = tabs.indexOf(t); const n = e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length] : e.key === 'ArrowLeft' ? tabs[(i + tabs.length - 1) % tabs.length] : null; if (n) { n.click(); n.focus(); } });
  });
  const inside = /^#[\w-]+$/.test(location.hash) && document.getElementById(location.hash.slice(1))?.closest('[role="tabpanel"]');
  const owner = inside && tabs.find(t => t.getAttribute('aria-controls') === inside.id);
  if (owner) { owner.click(); document.getElementById(location.hash.slice(1)).scrollIntoView(); }
});

const loads = new Map();
export const getJSON = url => {
  if (!loads.has(url)) loads.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(`${url} ${r.status}`); return r.json(); }).catch(e => { loads.delete(url); throw e; }));
  return loads.get(url);
};
globalThis.hhhJSON = getJSON;

if (document.querySelector('[data-fact-n],[data-fact-by]')) getJSON('/facts.json').then(({ facts }) => {
  document.querySelectorAll('[data-fact-n]').forEach(b => { b.textContent = facts.filter(f => !b.dataset.factN || f.label === b.dataset.factN).length.toLocaleString('en-US'); });
  document.querySelectorAll('[data-fact-by]').forEach(b => { b.textContent = facts.filter(f => f.checked_by === b.dataset.factBy).length.toLocaleString('en-US'); });
}).catch(() => {});
if (document.querySelector('[data-attempts-n]')) getJSON('/attempts/attempts.json').then(d => {
  const n = (d.rows || []).length; if (n) document.querySelectorAll('[data-attempts-n]').forEach(b => { b.textContent = n.toLocaleString('en-US'); });
}).catch(() => {});

{
  const barEl = document.querySelector('header.bar'), small = matchMedia('(max-width:600px)');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY, down = y > lastY + 4, up = y < lastY - 4;
    if (!small.matches || y < 220 || barEl.contains(document.activeElement)) barEl.classList.remove('bar-off');
    else if (down) barEl.classList.add('bar-off');
    else if (up) barEl.classList.remove('bar-off');
    if (down || up) lastY = y;
  };
  if (barEl) { addEventListener('scroll', onScroll, { passive: true }); barEl.addEventListener('focusin', () => barEl.classList.remove('bar-off')); }
}

const homeQ = document.getElementById('home-q');
homeQ?.form.addEventListener('submit', e => {
  e.preventDefault();
  const v = homeQ.value.trim();
  location.href = homeQ.form.getAttribute('action') + (v ? '#q=' + encodeURIComponent(v) : '');
});

fetch('/hit', { method: 'POST', cache: 'no-store' }).then(r => r.text()).catch(() => {});

import('./sky.js').then(m => m.startSky());
if (document.querySelector('[data-machine]')) import('./machine.js');
