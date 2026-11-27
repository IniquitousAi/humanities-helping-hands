const level = new URLSearchParams(location.search).get('level') || 'everyone';
const spread = document.getElementById('spread'), where = document.getElementById('where'), jump = document.getElementById('jump');
where.textContent = 'Loading...'; // (v4, attacks_nojs: the page itself starts blank, so a reader without scripts never sees a loading line that never ends)
const prev = document.getElementById('prev'), next = document.getElementById('next');
import { factShown, factChip, notProven, KIDS } from '/labels.js';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chip = f => { const s = factShown(f); return level === 'kids' ? `<span class="chip ${s.cls}">${KIDS[s.label]}</span>` : factChip(f); };
let facts = [], at = 0, failed = false;
const two = () => matchMedia('(min-width:621px)').matches ? 2 : 1;
function page(f, n) {
  if (!f) return `<div><h4>The end, for now</h4><p>The next page is written the day the checker proves something new.</p><span class="pn">${n}</span></div>`;
  const not = notProven(f);
  const how = level === 'kids' ? (f.label === 'PROVEN' ? 'A computer checked every step of the exact math. It found no mistake. Whether the words fit real life is not proven.' : 'A computer checked the math. The facts that go in come from experts who measured them.')
    : level === 'technical' ? `<code class="book-code">${esc(f.checked_as)}</code>${f.theorem ? `<br><span class="card-note">theorem ${esc(f.theorem)}</span>` : ''}${not ? `<br><span class="card-note">Not proven: ${esc(not)}</span>` : ''}`
    : `${f.label === 'PROVEN' ? 'Checked' : 'Its arithmetic was checked'} by ${esc(f.checked_by)}.${not ? ' Not proven: ' + esc(not) : ''}`;
  const receipt = level === 'kids' ? '' : `<a class="count" href="${level === 'technical' ? 'tech-atlas' : 'atlas'}#${encodeURIComponent(f.id)}">See the receipt &rarr;</a>`;
  return `<div>${chip(f)}<h4>${esc(f.claim)}</h4><p>${how}</p>${receipt}<span class="pn">Page ${n}</span></div>`;
}
function draw() {
  if (failed) { spread.innerHTML = '<p class="lede">The book did not load. Reload the page to try again.</p>'; where.textContent = 'The book did not load.'; prev.disabled = next.disabled = true; return; }
  const k = two();
  at = Math.max(0, Math.min(at, facts.length - 1)); at -= at % k;
  spread.innerHTML = page(facts[at], at + 1) + (k === 2 ? page(facts[at + 1], at + 2) : '');
  where.textContent = `Pages ${at + 1}${k === 2 ? `-${Math.min(at + 2, facts.length + 1)}` : ''} of ${facts.length}`;
  prev.disabled = at === 0; next.disabled = at + k >= facts.length; jump.value = String(at);
  if (facts.length) { try { localStorage.setItem('hhh-book-page', String(at + 1)); } catch { /* storage off */ } history.replaceState(null, '', location.pathname + location.search + (at ? `#page=${at + 1}` : '')); }
}
prev.addEventListener('click', () => { at -= two(); draw(); });
next.addEventListener('click', () => { at += two(); draw(); });
jump.addEventListener('change', () => { at = Number(jump.value); draw(); });
addEventListener('keydown', e => { if (e.target.closest('input,select,textarea')) return; if (e.key === 'ArrowRight' && !next.disabled) next.click(); if (e.key === 'ArrowLeft' && !prev.disabled) prev.click(); });
addEventListener('resize', draw);
if (level === 'kids') document.body.classList.add('kids');
try { facts = (await (await import('./site.js')).getJSON('/facts.json')).facts; } catch { failed = true; }
jump.innerHTML = facts.map((f, i) => `<option value="${i}">Page ${i + 1}</option>`).join('');
{ const m = location.hash.match(/^#page=(\d{1,5})$/); let kept = null; try { kept = localStorage.getItem('hhh-book-page'); } catch { /* storage off */ }
  const q = new URLSearchParams(location.search), wi = q.get('fact') ? facts.findIndex(f => f.id === q.get('fact')) : -1;
  if (!failed && q.has('fact')) { q.delete('fact'); const s = q.toString(); history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); }
  const n = wi >= 0 ? wi + 1 : Number(m ? m[1] : kept); if (Number.isInteger(n) && n >= 1 && n <= facts.length) at = n - 1; }
draw();
