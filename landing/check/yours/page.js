const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tag = l => `<span class="tag ${l === 'PROVEN' ? 'proven' : l === 'FALSIFIED' ? 'falsified' : 'guess'}">${esc(l)}</span>`;
export async function ask(claim, website, fetchFn = fetch, ms = 8000) {
  for (let i = 0; i < 2; i++) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
    try {
      const r = await fetchFn('/api/check', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ claim, website }), signal: c.signal });
      const text = await r.text();
      try { return JSON.parse(text); } catch {
        return { error: r.status === 413 ? 'That claim is too long for the checker. Send a shorter one.'
          : `The checker answered with an error on our side (${r.status}). Nothing was checked. Try again in a minute.` };
      }
    } catch { /* dropped or slow: try once more */ } finally { clearTimeout(t); }
  }
  return { error: 'Could not reach the checker. Nothing was checked. Check your connection and try again.' };
}
export function render(a) {
  if (!a || typeof a !== 'object' || (!a.error && (typeof a.label !== 'string' || typeof a.plain !== 'string')))
    a = { error: 'The checker sent back an answer this page cannot read. Nothing was checked. Try again in a minute.' };
  if (a.error) return `<p>${tag('NOT CHECKED')} ${esc(a.error)}</p>`;
  let h = `<p>${tag(a.label)} ${esc(a.plain)}</p>`;
  const l = String(a.link || ''), own = (l[0] === '/' && l[1] !== '/') || l.startsWith('https://humanitieshelpinghands.com/');
  if (a.kind === 'library') h += `<p>Words: ${tag(a.words_label)}${own ? ` <a href="${esc(a.link)}">See the fact</a>` : ''}</p>`;
  if (a.receipt) h += `<details class="layer"><summary>Receipt</summary><pre>${esc(JSON.stringify(a.receipt, null, 1))}</pre></details>`;
  return h;
}
if (typeof document !== 'undefined') {
  const f = $('pc-form');
  if (f) f.addEventListener('submit', async e => {
    e.preventDefault(); $('pc-out').textContent = 'Checking...';
    $('pc-out').innerHTML = render(await ask($('pc-claim').value, $('pc-website').value));
  });
}
