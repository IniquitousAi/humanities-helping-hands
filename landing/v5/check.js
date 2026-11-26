import { check, render, shareText } from './real-check.js';
import { toast } from './site.js';
const q = document.getElementById('q'), form = document.getElementById('ask');
const out = { summary: document.getElementById('summary'), list: document.getElementById('list'), inline: document.getElementById('inline'), left: document.getElementById('left'), right: document.getElementById('right'), sorter: document.getElementById('sorter') };
let last = [], turn = 0;
const KEEP = 'hhh-last-check';
const kept = { get: () => { try { return localStorage.getItem(KEEP); } catch { return null; } }, set: v => { try { v ? localStorage.setItem(KEEP, v.slice(0, 4000)) : localStorage.removeItem(KEEP); } catch { /* storage off: nothing is kept */ } } };
async function run(show) {
  const mine = ++turn;
  if (show) kept.set(q.value.trim());
  out.summary.textContent = 'Checking...';
  try {
    const rs = await check(q.value); if (mine !== turn) return; last = rs; render(last, out);
    if (show) fetch('/hit?event=check', { method: 'POST' }).then(r => r.text()).catch(() => {});
    if (show) { out.summary.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); out.summary.focus({ preventScroll: true }); }
  } catch { if (mine === turn) out.summary.innerHTML = 'The checker did not load. <button type="button" id="again" class="btn btn-line">Try again</button>'; }
}
document.addEventListener('click', e => { if (e.target.id === 'again') run(true); });
q.addEventListener('focus', () => { if (q.value === q.defaultValue) q.select(); }, { once: true });
document.getElementById('clear')?.addEventListener('click', () => { q.value = ''; kept.set(''); q.focus(); });
const pasteKey = document.getElementById('paste');
if (pasteKey && navigator.clipboard?.readText) {
  pasteKey.hidden = false;
  pasteKey.addEventListener('click', async () => {
    try { const t = (await navigator.clipboard.readText()).trim(); if (!t) { toast('Nothing to paste yet. Copy some text first.'); return; } q.value = t.slice(0, 4000); run(true); }
    catch { toast('Your browser did not allow pasting. Click the box and paste there.'); q.focus(); }
  });
}
document.getElementById('link')?.addEventListener('click', async e => {
  const text = q.value.trim(); if (!text) { toast('Type or paste something first.'); q.focus(); return; }
  const url = location.origin + location.pathname + '#q=' + encodeURIComponent(text.slice(0, 4000));
  if (navigator.share && matchMedia('(pointer: coarse)').matches) { try { await navigator.share({ title: 'Checked by Humanities Helping Hands', url }); return; } catch (err) { if (err.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(url); toast('Link copied. It opens this same check.'); e.target.textContent = 'Link copied'; setTimeout(() => { e.target.textContent = 'Copy a link to this check'; }, 2000); }
  catch { toast('Your browser blocked copying.'); }
});
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
let typing = 0;
q.addEventListener('input', () => { clearTimeout(typing); typing = setTimeout(() => { if (q.value.trim()) run(false); }, 400); });
document.addEventListener('click', async e => {
  const b = e.target.closest?.('[data-receipt]'); if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.receipt); toast('Receipt code copied, all 64 characters.'); } catch { toast('Your browser blocked copying.'); }
});
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
else if (kept.get()) q.value = kept.get();
run(asked !== null);
addEventListener('hashchange', () => { const a = fromHash(); if (a === null) return; q.value = a.slice(0, 4000); history.replaceState(null, '', location.pathname); run(true); });
