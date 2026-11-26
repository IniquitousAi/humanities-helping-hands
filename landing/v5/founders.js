export const MAX_URL = 7500;
export const HEAD = '\n\n### My answer\n\n';
export const KEEP_MS = 24 * 3600 * 1000;
export const ISSUE = 'https://github.com/IniquitousAi/lean-proofs/issues/new?';
const DRAFT = 'hhh-fc-answer';

export function withAnswer(href, answer) {
  const base = new URL(href), body = base.searchParams.get('body') || '';
  const make = chars => {
    const u = new URL(base);
    u.searchParams.set('body', chars.length ? body + HEAD + chars.join('') : body);
    return u.toString();
  };
  const all = Array.from(String(answer || '').replace(/\r\n?/g, '\n').trim());
  if (make(all).length <= MAX_URL) return { href: make(all), cut: 0 };
  let lo = 0, hi = all.length;
  while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (make(all.slice(0, mid)).length <= MAX_URL) lo = mid; else hi = mid - 1; }
  return { href: make(all.slice(0, lo)), cut: all.length - lo };
}

export const same = (a, b) => !!a && !!b && a.kind === b.kind && a.title === b.title;

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const task = $('fc-task'), issue = $('fc-issue'), box = $('fc-answer'), cutNote = $('fc-answer-cut');
  const kind = $('fc-kind'), title = $('fc-title'), body = $('fc-body'), tab = $('t-join');
  const send = document.querySelector('#fc-form [type=submit]');
  if (send && typeof $('fc-form')?.onsubmit === 'function') send.disabled = false;
  const store = {
    get() { try { const d = JSON.parse(localStorage.getItem(DRAFT) || 'null'); return d && Date.now() - d.at < KEEP_MS ? d : null; } catch { return null; } },
    set(v) { try { localStorage.setItem(DRAFT, JSON.stringify({ ...v, at: Date.now() })); } catch {} },
    clear() { try { localStorage.removeItem(DRAFT); } catch {} },
  };
  let task0 = '', wrote = '';
  const now = () => ({ kind: kind.textContent, title: title.textContent, body: body.textContent, href: task0, answer: box.value });
  const update = () => {
    if (!task0) return;
    const w = withAnswer(task0, box.value);
    wrote = w.href;
    issue.setAttribute('href', wrote);
    if (cutNote) cutNote.hidden = w.cut === 0;
  };
  const oneMain = () => send && send.classList.replace('btn-main', 'btn-line');
  if (task && issue && box && kind && title && body) {
    new MutationObserver(() => {
      const h = issue.getAttribute('href') || '';
      if (!h || h === wrote) return;
      if (task0 && h !== task0) box.value = '';
      const d = store.get();
      if (!box.value && same(d, { kind: kind.textContent, title: title.textContent })) box.value = d.answer || '';
      task0 = h; update(); store.set(now());
    }).observe(issue, { attributes: true, attributeFilter: ['href'] });
    new MutationObserver(() => { if (!task.hidden) oneMain(); }).observe(task, { attributes: true, attributeFilter: ['hidden'] });
    box.addEventListener('input', () => { update(); store.set(now()); });
    const d = store.get();
    if (d && typeof d.href === 'string' && d.href.startsWith(ISSUE) && task.hidden) {
      kind.textContent = d.kind || ''; title.textContent = d.title || ''; body.textContent = d.body || '';
      box.value = d.answer || ''; task0 = d.href; update(); task.hidden = false; oneMain();
      const spot = /^#[\w-]+$/.test(location.hash) && document.getElementById(location.hash.slice(1))?.closest('[role="tabpanel"]');
      if (tab && tab.getAttribute('aria-selected') !== 'true' && !(spot && spot.id !== tab.getAttribute('aria-controls'))) tab.click();
    } else if (!d) store.clear();
  }
}
