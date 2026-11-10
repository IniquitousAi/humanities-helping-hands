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
export async function load(fetchFn = fetch, ms = 8000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { return await (await fetchFn('/api/scoreboard', { signal: c.signal })).json(); } catch { return null; } finally { clearTimeout(t); }
}
if (typeof document !== 'undefined') { const o = document.getElementById('sb-out'); if (o) load().then(s => { o.innerHTML = render(s); }); }
