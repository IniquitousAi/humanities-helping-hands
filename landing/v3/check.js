import { check, render, shareText } from './real-check.js';
import { toast } from './site.js';
const q = document.getElementById('q'), form = document.getElementById('ask');
const out = { summary: document.getElementById('summary'), list: document.getElementById('list'), inline: document.getElementById('inline'), left: document.getElementById('left'), right: document.getElementById('right') };
let last = [], turn = 0;
async function run(show) {
  const mine = ++turn;
  out.summary.textContent = 'Checking...';
  try {
    const rs = await check(q.value); if (mine !== turn) return; last = rs; render(last, out);
    if (show) { out.summary.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); out.summary.focus({ preventScroll: true }); }
  } catch { if (mine === turn) out.summary.textContent = 'The checker did not load. Reload the page to try again.'; }
}
form.addEventListener('submit', e => {
  e.preventDefault();
  if (!q.value.trim()) { toast('Type or paste something first.'); q.focus(); return; }
  run(true);
});
document.addEventListener('click', e => {
  const b = e.target.closest?.('[data-try]'); if (!b) return;
  q.value = b.dataset.try; run(true);
});
q.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) form.requestSubmit(); });
document.getElementById('copy')?.addEventListener('click', async e => {
  if (!last.length) { toast('Check something first.'); return; }
  try { await navigator.clipboard.writeText(shareText(last)); toast('Copied. Paste it anywhere.'); e.target.textContent = 'Copied'; setTimeout(() => { e.target.textContent = 'Copy the result'; }, 2000); }
  catch { toast('Your browser blocked copying. Select the results and copy them by hand.'); }
});
document.getElementById('json')?.addEventListener('click', async () => {
  if (!last.length) { toast('Check something first.'); return; }
  try { await navigator.clipboard.writeText(JSON.stringify(last, null, 2)); toast('Copied the results as JSON, receipts included.'); }
  catch { toast('Your browser blocked copying.'); }
});
const fromHash = () => location.hash.startsWith('#q=') ? decodeURIComponent(location.hash.slice(3).replace(/\+/g, ' ')) : null;
const asked = new URLSearchParams(location.search).get('q') ?? fromHash();
if (asked !== null) { q.value = asked.slice(0, 4000); history.replaceState(null, '', location.pathname); }
run(asked !== null);
addEventListener('hashchange', () => { const a = fromHash(); if (a === null) return; q.value = a.slice(0, 4000); history.replaceState(null, '', location.pathname); run(true); });
