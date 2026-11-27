import { toast, openDialog, getJSON } from './site.js';
import { index, rank, mark, FIELDS } from './find.js';
import { factShown, factChip, notProven } from '/labels.js';
const TECH = document.body.dataset.mode === 'technical';
const grid = document.getElementById('grid'), find = document.getElementById('find'), shown = document.getElementById('shown'), more = document.getElementById('more');
shown.textContent = 'Loading the facts...'; // (v4, attacks_nojs: the page itself starts blank, so a reader without scripts never sees a loading line that never ends)
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chip = f => factChip(f);
const np = (f, m = esc) => { const t = notProven(f); return t ? `<span class="card-note">Not proven: ${m(t)}</span>` : ''; };
const by = f => factShown(f).label === 'PROVEN' ? 'Checked by' : 'Arithmetic checked by';
const STEP = TECH ? 40 : 24;
let facts = [], ix = [], filter = '', limit = STEP, first = null, ready = false, failed = false;

function draw() {
  if (failed) { grid.innerHTML = '<p class="lede">The facts list did not load. Reload the page to try again.</p>'; shown.textContent = 'The facts list did not load.'; more.hidden = true; first = null; return; }
  const q = find.value.trim();
  const got = rank(ix, q), hit = got.rows.filter(r => !filter || r.fact.label === filter);
  const some = hit.slice(0, limit), m = s => mark(s, q, got.close);
  first = q && hit.length ? hit[0].fact.id : null;
  const where = r => q && r.field > 0 && FIELDS[r.field][0] !== 'checked_by' ? `<span class="card-note">Found in ${FIELDS[r.field][1]}: ${m(r.fact[FIELDS[r.field][0]])}</span>` : '';
  if (TECH) grid.innerHTML = some.length ? `<table class="data"><thead><tr><th>Label</th><th>Claim</th><th>Checked as</th><th>Theorem</th><th>By</th><th>Added</th></tr></thead><tbody>${some.map(({ fact: f }) =>
    `<tr class="click" id="${esc(f.id)}" data-id="${esc(f.id)}"><td>${chip(f)}</td><td><button type="button" class="row-btn">${m(f.claim)}</button>${f.credit && q ? `<span class="card-note">Credit: ${m(f.credit)}</span>` : ''}${np(f)}</td><td><code>${m(f.checked_as)}</code></td><td><code>${m(f.theorem || '')}</code></td><td class="nw">${m(f.checked_by)}</td><td class="nw"><code>${esc(f.added || '')}</code></td></tr>`).join('')}</tbody></table>` : '';
  else grid.innerHTML = some.map(r => `<button class="card-btn" type="button" id="${esc(r.fact.id)}" data-id="${esc(r.fact.id)}">${chip(r.fact)}<span>${m(r.fact.claim)}</span>${where(r)}<span class="card-note">${by(r.fact)} ${m(r.fact.checked_by)}</span>${np(r.fact)}</button>`).join('');
  if (!some.length) grid.innerHTML = '<p class="lede">No fact matches that yet. Try a shorter word.</p>';
  shown.textContent = (got.close && some.length ? 'Nothing spelled that way. Closest: ' : '') + `${some.length} of ${hit.length} shown`;
  if (ready) { const p = new URLSearchParams(); if (q) p.set('find', q); if (filter) p.set('show', filter); const s = p.toString(); history.replaceState(null, '', location.pathname + location.search + (s ? '#' + s : '')); }
  more.hidden = hit.length <= limit; more.textContent = `Show ${STEP} more`;
}
function open(id) {
  const f = facts.find(x => x.id === id); if (!f) return;
  const s = factShown(f), not = notProven(f);
  openDialog(s.word, `<p>${chip(f)}</p><p><b class="dlg-claim">${esc(f.claim)}</b></p>${s.note ? `<p>${esc(s.note)}</p>` : ''}<p>What the machine checked:<br><code>${esc(f.checked_as)}</code></p>${f.theorem ? `<p>Theorem: <code>${esc(f.theorem)}</code></p>` : ''}<p>${by(f)} ${esc(f.checked_by)}${f.credit ? `. Credit: ${esc(f.credit)}` : ''}.</p>${not ? `<p>Not proven here: ${esc(not)}</p>` : ''}<p><button type="button" class="btn btn-line" data-copy="${esc(location.origin + location.pathname + '#' + encodeURIComponent(f.id))}">Copy a link to this fact</button></p>`);
  history.replaceState(null, '', location.pathname + location.search + '#' + encodeURIComponent(f.id));
}
document.addEventListener('click', async e => {
  const b = e.target.closest?.('[data-copy]'); if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.copy); toast('Link copied. It opens this fact.'); b.textContent = 'Link copied'; } catch { toast('Your browser blocked copying.'); }
});
grid.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) open(b.dataset.id); });
find.addEventListener('input', () => { limit = STEP; draw(); });
find.addEventListener('keydown', e => { if (e.key === 'Enter' && first) { e.preventDefault(); open(first); } });
more.addEventListener('click', () => { limit += STEP; draw(); });
document.getElementById('filter').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  filter = b.dataset.f; limit = STEP;
  b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
  draw();
});
try { facts = (await getJSON('/facts.json')).facts; ix = index(facts); } catch { failed = true; toast('Could not read the facts list.'); }
const n = l => facts.filter(f => !l || f.label === l).length;
if (!failed) document.querySelectorAll('[data-n]').forEach(e => { e.textContent = n(e.dataset.n).toLocaleString('en-US'); });
const id = decodeURIComponent(location.hash.slice(1)), fromLink = id.includes('=') ? new URLSearchParams(id) : null;
if (fromLink) {
  find.value = (fromLink.get('find') || '').slice(0, 200);
  const b = [...document.querySelectorAll('#filter button')].find(x => x.dataset.f === (fromLink.get('show') || ''));
  if (b && b.dataset.f) { filter = b.dataset.f; b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); }
}
draw();
if (!fromLink && id && facts.some(f => f.id === id)) { limit = facts.length; draw(); document.getElementById(id)?.scrollIntoView({ block: 'center' }); open(id); }
ready = true;
