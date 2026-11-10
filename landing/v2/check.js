import { check, render, shareText } from './real-check.js';
import { toast } from './site.js';
const q = document.getElementById('q'), form = document.getElementById('ask');
const out = { summary: document.getElementById('summary'), list: document.getElementById('list'), inline: document.getElementById('inline'), left: document.getElementById('left'), right: document.getElementById('right') };
let last = [], turn = 0;
async function run() {
  const mine = ++turn;
  out.summary.textContent = 'Checking...';
  try { const rs = await check(q.value); if (mine !== turn) return; last = rs; render(last, out); }
  catch { if (mine === turn) out.summary.textContent = 'The checker did not load. Reload the page to try again.'; }
}
form.addEventListener('submit', e => {
  e.preventDefault();
  if (!q.value.trim()) { toast('Type or paste something first.'); q.focus(); return; }
  run();
});
document.querySelectorAll('[data-try]').forEach(b => b.addEventListener('click', () => { q.value = b.dataset.try; run(); q.focus(); }));
q.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) form.requestSubmit(); });
document.getElementById('copy')?.addEventListener('click', async () => {
  if (!last.length) { toast('Check something first.'); return; }
  try { await navigator.clipboard.writeText(shareText(last)); toast('Copied. Paste it anywhere.'); }
  catch { toast('Your browser blocked copying. Select the results and copy them by hand.'); }
});
document.getElementById('json')?.addEventListener('click', async () => {
  if (!last.length) { toast('Check something first.'); return; }
  try { await navigator.clipboard.writeText(JSON.stringify(last, null, 2)); toast('Copied the results as JSON, receipts included.'); }
  catch { toast('Your browser blocked copying.'); }
});
const asked = new URLSearchParams(location.search).get('q');
if (asked) q.value = asked.slice(0, 4000);
run();
