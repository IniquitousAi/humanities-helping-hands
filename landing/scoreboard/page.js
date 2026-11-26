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
export function renderBoard(s, which = 'all', shown = FIRST) {
  if (!s || s.board_label !== 'MEASURED') return `<p><span class="tag guess">NOT MEASURED</span> The board could not be read right now. No rank is shown rather than an old one.</p>`;
  const b = (s.boards || {})[which] || { rows: [] }, rows = Array.isArray(b.rows) ? b.rows : [];
  const rule = `<p class="lb-rule">${esc(s.board_rule || '')}. ${esc(s.board_limit || '')}</p>`;
  if (!rows.length) return `<div class="lb-open"><div class="lb-seat">#1</div><h3>The first seat is open.</h3>`
    + `<p>Prove one thing and your name goes here for good, with a certificate you can print. Proven work scores most; work others build on keeps paying you.</p>`
    + `<a class="go" href="/v5/check">Check a claim</a></div>` + rule;
  const imp = s.impact || {}, impact = who => {
    const m = imp[String(who).toLowerCase()];
    return m && Number.isFinite(m.estimate) && Number.isFinite(m.band) ? `<div class="lb-impact">Impact ${num(m.estimate)} &plusmn; ${num(m.band)}</div>` : '';
  };
  const list = rows.slice(0, shown).map(r => row(r, which, impact)).join('');
  const more = rows.length > shown ? `<button type="button" class="lb-more" data-more="${Math.min(rows.length, shown + PAGE)}">Show more (${rows.length - shown} more)</button>` : '';
  return `<ol class="lb-list">${list}</ol>${more}` + rule;
}

export const FIRST = 10, PAGE = 50;
const CHIP = { PROVEN: 'proven', MEASURED: 'measured', REASONED: 'reasoned', GUESS: 'guess', PENDING: 'pending' };
const chip = l => `<span class="lb-chip ${CHIP[l] || 'pending'}">${esc(l === 'PENDING' ? 'Waiting for stamp' : l)}</span>`;
const initials = n => String(n || '?').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
function detail(i) {
  const src = i.source ? `<a href="${esc(i.source)}" rel="noopener">Source</a>` : (i.source_text ? `<span>${esc(i.source_text)}</span>` : '');
  const pts = i.label === 'PENDING' ? (i.seeks ? `would score ${esc(num(POINTS_OF[i.seeks] || 0))} as ${esc(i.seeks)} once stamped` : 'no stamp yet')
    : `${esc(num(i.points))} points, ${esc(num(i.kept))} kept, ${esc(num(i.passed))} passed to what it built on`;
  return `<li>${chip(i.label)} <b>${esc(i.title)}</b><span class="lb-pts">${pts}</span>${src}${i.date ? `<span class="lb-when">Stamped ${esc(i.date)}</span>` : ''}</li>`;
}
const POINTS_OF = { PROVEN: 8, MEASURED: 4, REASONED: 2, GUESS: 1 };
function row(r, which, impact) {
  const name = r.name || r.who, x = r.x || '', t = r.top || null;
  const pic = /^\/scoreboard\/avatars\/[a-z0-9_]{1,15}\.jpg$/.test(r.pic || '') ? `<img class="lb-pic" src="${r.pic}" alt="" width="48" height="48" loading="lazy" decoding="async" data-i="${esc(initials(name))}">` : `<span class="lb-pic lb-ini">${esc(initials(name))}</span>`;
  const handle = x ? `<a class="lb-handle" href="https://x.com/${encodeURIComponent(x)}" rel="noopener">@${esc(x)}</a>` : '';
  const cert = r.score > 0 ? `<a class="lb-cert" href="/scoreboard/certificate/?board=${encodeURIComponent(which)}&amp;who=${encodeURIComponent(r.who)}">Print certificate</a>` : '';
  return `<li class="lb-row${r.rank === 1 && r.score > 0 ? ' first' : ''}${r.pending ? ' zero' : ''}${r.pruned ? ' pruned' : ''}"><details><summary>`
    + `<span class="lb-rank">${esc(r.rank)}</span>${pic}`
    + `<span class="lb-who"><span class="lb-name">${esc(name)}</span> ${handle}${r.role ? ` <span class="lb-role">${esc(r.role)}</span>` : ''}`
    + `${r.pruned ? ' <span class="lb-flag">has pruned work</span>' : ''}`
    + `<span class="lb-top">${t ? chip(t.label) + ' ' + esc(t.title) : ''}</span></span>`
    + `<span class="lb-score"><span class="lb-points">${num(r.score)}</span><span class="lb-unit">points</span></span></summary>`
    + `<div class="lb-open-row">${r.about ? `<p class="lb-about">${esc(r.about)}</p>` : ''}${mixBar(r.mix)}${impact(r.who)}<ul class="lb-items">${(r.items || []).map(detail).join('')}</ul>${cert}</div></details></li>`;
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
    const show = (which, n = FIRST) => {
      lb.innerHTML = renderBoard(s, which, n);
      lb.querySelectorAll('.lb-mix i[data-w]').forEach(i => { i.style.width = i.dataset.w + '%'; });
      lb.querySelectorAll('img.lb-pic').forEach(img => img.addEventListener('error', () => { const b = document.createElement('span'); b.className = 'lb-pic lb-ini'; b.textContent = img.dataset.i; img.replaceWith(b); }, { once: true }));
      const m = lb.querySelector('.lb-more'); if (m) m.addEventListener('click', () => show(which, Number(m.dataset.more)));
      tabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.board === which)));
    };
    tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.board)));
    show('all');
  });
}
