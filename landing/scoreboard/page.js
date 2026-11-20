const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const COUNTS = ['checks', 'days', 'proven', 'falsified', 'arithmetic', 'library', 'rejected'];
const count = v => v === undefined || (Number.isSafeInteger(v) && v >= 0);
export function render(s) {
  if (s && !s.error && !COUNTS.every(k => count(s[k]))) s = { error: 'The check log sent a count that is not a whole number.' };
  if (!s || s.error || s.label !== 'MEASURED') return `<p><span class="tag guess">NOT MEASURED</span> ${esc((s && s.error) || 'Could not read the check log right now.')} No number is shown rather than an old or made-up one.</p>`;
  if (!s.checks) return `<p><span class="tag measured">MEASURED</span> No outside checks yet. Be the first: <a href="/check/yours/">check a claim</a>.</p>` + (s.rejected ? `<p>${s.rejected} log row(s) failed the re-check and were not counted.</p>` : '');
  return `<p><span class="tag measured">MEASURED</span> ${s.checks} machine-checked claim(s) from visitors, on ${s.days} day(s).</p>`
    + `<ul><li>True as written (PROVEN): ${s.proven}</li><li>False as written (FALSIFIED): ${s.falsified}</li><li>Arithmetic: ${s.arithmetic}</li><li>Library facts: ${s.library}</li></ul>`
    + (s.rejected ? `<p>${s.rejected} log row(s) failed the re-check and were not counted.</p>` : '');
}

const MIX = [['PROVEN', 'p', 'proven'], ['MEASURED', 'm', 'measured'], ['REASONED', 'r', 'reasoned'], ['GUESS', 'g', 'guess']];
const num = v => (Number.isFinite(v) ? (Math.round(v * 10) / 10).toLocaleString('en-US') : '0');
function mixBar(mix = {}) {
  const n = MIX.reduce((t, [k]) => t + (Number.isSafeInteger(mix[k]) && mix[k] > 0 ? mix[k] : 0), 0);
  if (!n) return '';
  const bar = MIX.map(([k, c]) => (mix[k] > 0 ? `<i class="${c}" data-w="${(100 * mix[k] / n).toFixed(2)}"></i>` : '')).join('');
  const words = MIX.filter(([k]) => mix[k] > 0).map(([k, , w]) => `${mix[k]} ${w}`).join(', ');
  return `<div class="lb-mix" aria-hidden="true">${bar}</div><div class="lb-mixwords">${esc(words)}</div>`;
}
export function renderBoard(s, which = 'all') {
  if (!s || s.board_label !== 'MEASURED') return `<p><span class="tag guess">NOT MEASURED</span> The board could not be read right now. No rank is shown rather than an old one.</p>`;
  const b = (s.boards || {})[which] || { rows: [] }, rows = Array.isArray(b.rows) ? b.rows : [];
  const rule = `<p class="lb-rule">${esc(s.board_rule || '')}. ${esc(s.board_limit || '')}</p>`;
  if (!rows.length) return `<div class="lb-open"><div class="lb-seat">#1</div><h3>The first seat is open.</h3>`
    + `<p>Prove one thing and your name goes here for good, with a certificate you can print. Proven work scores most; work others build on keeps paying you.</p>`
    + `<a class="go" href="/v4/check">Check a claim</a></div>` + rule;
  const imp = s.impact || {}, impact = who => {
    const m = imp[String(who).toLowerCase()];
    return m && Number.isFinite(m.estimate) && Number.isFinite(m.band) ? `<div class="lb-impact">Impact ${num(m.estimate)} &plusmn; ${num(m.band)}</div>` : '';
  };
  const list = rows.map(r => `<li class="lb-row${r.rank <= 3 ? ' top' : ''}${r.pruned ? ' pruned' : ''}"><div class="lb-rank">${esc(r.rank)}</div>`
    + `<div class="lb-who"><div class="lb-name">${esc(r.who)}${r.pruned ? ' <span class="lb-flag">has pruned work</span>' : ''}</div>${mixBar(r.mix)}${impact(r.who)}</div>`
    + `<div class="lb-score"><span class="lb-points">${num(r.score)}</span><span class="lb-unit">points</span>`
    + `<a class="lb-cert" href="/scoreboard/certificate/?board=${encodeURIComponent(which)}&amp;who=${encodeURIComponent(r.who)}">Print certificate</a></div></li>`).join('');
  return `<ol class="lb-list">${list}</ol>` + rule;
}

export async function load(fetchFn = fetch, ms = 8000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { return await (await fetchFn('/api/scoreboard', { signal: c.signal })).json(); } catch { return null; } finally { clearTimeout(t); }
}
if (typeof document !== 'undefined') {
  const o = document.getElementById('sb-out'), lb = document.getElementById('lb-out'), tabs = document.querySelectorAll('.lb-tabs button');
  if (o) load().then(s => {
    o.innerHTML = render(s);
    if (!lb) return;
    const show = which => { lb.innerHTML = renderBoard(s, which); lb.querySelectorAll('.lb-mix i[data-w]').forEach(i => { i.style.width = i.dataset.w + '%'; }); tabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.board === which))); };
    tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.board)));
    show('all');
  });
}
