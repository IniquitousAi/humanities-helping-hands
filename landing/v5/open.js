import { index, rank, mark } from './find.js';
import { shown as four } from '/labels.js';
const TECH = document.body.dataset.mode === 'technical';
const log = document.getElementById('log'), find = document.getElementById('find'), shown = document.getElementById('shown'), more = document.getElementById('more');
shown.textContent = 'Loading...'; // (v4, attacks_nojs: the page itself starts blank, so a reader without scripts never sees a loading line that never ends)
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chip = l => { const s = four(l); return `<span class="chip ${s.cls}">${s.word}</span>`; };
const safe = u => String(u || '').startsWith('https://') ? esc(u) : '';
const STEP = 20;
const SEARCH = [['author', 'the author'], ['claim', 'the claim'], ['barrier', 'the barrier'], ['where_it_broke', 'where it broke'], ['year', 'the year']];
let rows = [], ix = [], limit = STEP, failed = false;
function draw() {
  if (failed) { log.innerHTML = '<p class="lede">The attempts log did not load. Reload the page to try again.</p>'; shown.textContent = 'The attempts log did not load.'; more.hidden = true; return; }
  const q = find.value.trim();
  const got = rank(ix, q), hit = got.rows.map(x => ({ ...x.fact, _field: x.field })), esc = s => mark(s, q, got.close);
  const some = hit.slice(0, limit);
  if (TECH) log.innerHTML = some.length ? `<table class="data"><thead><tr><th>Id</th><th>Year</th><th>Author</th><th>Claim</th><th>Listed in</th><th>Where it broke</th><th>Status</th></tr></thead><tbody>${some.map(r =>
    `<tr><td class="nw"><code>${esc(r.id)}</code></td><td class="nw"><code>${esc(r.year)}</code></td><td>${esc(r.author)}</td><td>${esc(r.claim)}</td><td>${esc(r.listed_in || '')}</td><td>${r.where_it_broke ? esc(r.where_it_broke) : 'Not traced yet.'}${safe(r.break_source_url) ? ` <a href="${safe(r.break_source_url)}" rel="noopener" target="_blank">source</a>` : ''}</td><td>${chip(r.label)}</td></tr>`).join('')}</tbody></table>` : '';
  else log.innerHTML = some.map(r => `<div class="row"><span class="yr">${esc(r.year)}</span><div><p><b>${esc(r.author)}</b> claimed ${esc(r.claim)}</p><span class="card-note">${r.where_it_broke ? esc(r.where_it_broke) : 'Where it broke is not traced yet. This one is open for you.'}</span></div>${chip(r.label)}</div>`).join('');
  if (!some.length) log.innerHTML = '<p class="lede">No attempt matches that.</p>';
  shown.textContent = (got.close && some.length ? 'Nothing spelled that way. Closest: ' : '') + `${some.length} of ${hit.length} shown`;
  more.hidden = hit.length <= limit;
}
find.addEventListener('input', () => { limit = STEP; draw(); });
more.addEventListener('click', () => { limit += STEP; draw(); });
try { rows = (await (await import('./site.js')).getJSON('/attempts/attempts.json')).rows; ix = index(rows, SEARCH); } catch { failed = true; }
const n = l => rows.filter(r => !l || r.label === l).length;
if (!failed) document.querySelectorAll('[data-n]').forEach(e => { e.textContent = n(e.dataset.n).toLocaleString('en-US'); });
draw();

const { openDialog } = await import('./site.js');
document.getElementById('trace')?.addEventListener('click', () => {
  if (failed) { openDialog('The attempts log did not load', '<p>Reload the page to try again.</p>'); return; }
  const open = rows.filter(r => r.label === 'NOT TRACED'); if (!open.length) return;
  const r = open[Math.floor(Math.random() * open.length)];
  const subject = encodeURIComponent(`Traced break: ${r.id}`);
  openDialog(`${r.author}, ${r.year}`, `<p>Claimed ${esc(r.claim)}.</p><p class="card-note">Attempt ${esc(r.id)}${r.listed_in ? `, listed in ${esc(r.listed_in)}` : ''}. Nobody has traced where it breaks yet.</p>
    <p>Find a published paper or critique that shows the step that fails, then send its link to <a href="mailto:hello@humanitieshelpinghands.com?subject=${subject}">hello@humanitieshelpinghands.com</a>. A traced break goes in the log with your name.</p>`);
});
