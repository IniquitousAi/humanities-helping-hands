import { toast, openDialog } from './site.js';
const TECH = document.body.dataset.mode === 'technical';
const grid = document.getElementById('grid'), find = document.getElementById('find'), shown = document.getElementById('shown'), more = document.getElementById('more');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chip = l => l === 'PROVEN' ? '<span class="chip proven">Proven</span>' : '<span class="chip measured">Math checked</span>';
const STEP = TECH ? 40 : 24;
let facts = [], filter = '', limit = STEP;

function draw() {
  const q = find.value.trim().toLowerCase();
  const hit = facts.filter(f => (!filter || f.label === filter) && (!q || `${f.claim} ${f.checked_by} ${f.checked_as} ${f.theorem || ''} ${f.credit || ''}`.toLowerCase().includes(q)));
  const some = hit.slice(0, limit);
  if (TECH) grid.innerHTML = some.length ? `<table class="data"><thead><tr><th>Label</th><th>Claim</th><th>Checked as</th><th>Theorem</th><th>By</th><th>Added</th></tr></thead><tbody>${some.map(f =>
    `<tr class="click" tabindex="0" id="${esc(f.id)}" data-id="${esc(f.id)}"><td>${chip(f.label)}</td><td>${esc(f.claim)}</td><td><code>${esc(f.checked_as)}</code></td><td><code>${esc(f.theorem || '')}</code></td><td class="nw">${esc(f.checked_by)}</td><td class="nw"><code>${esc(f.added || '')}</code></td></tr>`).join('')}</tbody></table>` : '';
  else grid.innerHTML = some.map(f => `<button class="card-btn" type="button" id="${esc(f.id)}" data-id="${esc(f.id)}">${chip(f.label)}<span>${esc(f.claim)}</span><span class="card-note">Checked by ${esc(f.checked_by)}</span></button>`).join('');
  if (!some.length) grid.innerHTML = '<p class="lede">No fact matches that yet. Try a shorter word.</p>';
  shown.textContent = `${some.length} of ${hit.length} shown`;
  more.hidden = hit.length <= limit; more.textContent = `Show ${STEP} more`;
}
function open(id) {
  const f = facts.find(x => x.id === id); if (!f) return;
  openDialog(f.label === 'PROVEN' ? 'Proven' : 'Math checked', `<p><b class="dlg-claim">${esc(f.claim)}</b></p><p>What the machine checked:<br><code>${esc(f.checked_as)}</code></p>${f.theorem ? `<p>Theorem: <code>${esc(f.theorem)}</code></p>` : ''}<p>Checked by ${esc(f.checked_by)}${f.credit ? `. Credit: ${esc(f.credit)}` : ''}.</p>${f.not_proven ? `<p>Not proven here: ${esc(f.not_proven)}</p>` : ''}`);
}
grid.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) open(b.dataset.id); });
grid.addEventListener('keydown', e => { const b = e.target.closest('tr[data-id]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(b.dataset.id); } });
find.addEventListener('input', () => { limit = STEP; draw(); });
more.addEventListener('click', () => { limit += STEP; draw(); });
document.getElementById('filter').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  filter = b.dataset.f; limit = STEP;
  b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
  draw();
});
try { facts = (await (await fetch('/facts.json')).json()).facts; } catch { shown.textContent = 'The facts list did not load.'; toast('Could not read the facts list.'); }
const n = l => facts.filter(f => !l || f.label === l).length;
document.querySelectorAll('[data-n]').forEach(e => { e.textContent = n(e.dataset.n).toLocaleString('en-US'); });
draw();
const id = decodeURIComponent(location.hash.slice(1));
if (id && facts.some(f => f.id === id)) { limit = facts.length; draw(); document.getElementById(id)?.scrollIntoView({ block: 'center' }); open(id); }
