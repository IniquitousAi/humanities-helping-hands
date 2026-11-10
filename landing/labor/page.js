import { check } from '/verify/page.js';

const el = (tag, text, attrs = {}) => { const e = document.createElement(tag); if (text != null) e.textContent = text; for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const FILE_OK = /^[A-Za-z0-9._-]{1,80}$/;

async function recheck(item, pub, log) {
  if (!FILE_OK.test(item.file)) return 'FAKE';
  const bytes = await fetch('work/' + item.file, { cache: 'no-store' }).then(r => r.ok ? r.arrayBuffer() : null);
  if (!bytes || hex(await crypto.subtle.digest('SHA-256', bytes)) !== item.stamp.hash) return 'FAKE';
  return check(JSON.stringify(item.stamp), pub, log);
}

const out = typeof document !== 'undefined' && document.getElementById('lb-out');
if (out) (async () => {
  try {
    const [b, pub, log] = await Promise.all(['board.json', '/.well-known/hhh-stamp-key.json', '/stamps/log.json'].map(u => fetch(u, { cache: 'no-store' }).then(r => r.json())));
    out.textContent = '';
    if (!b.rows.length) { out.append(el('p', 'No points yet. The board fills as stamped, machine-checked work comes in from people who chose to be shown.')); return; }
    const box = el('div', null, { class: 'counters' }), t = el('table'), head = t.createTHead().insertRow();
    for (const h of ['Who', 'Points', 'Proven work']) head.append(el('th', h, { scope: 'col' }));
    const body = t.createTBody();
    for (const r of b.rows) {
      const tr = body.insertRow(); tr.insertCell().textContent = '@' + r.handle; tr.insertCell().textContent = String(r.points);
      const cell = tr.insertCell();
      for (const it of r.items) {
        const p = el('div'), note = el('small', `${it.kind === 'lean' ? 'Lean proof' : 'Checked claim'}, stamp #${it.n} in the log, re-checking in your browser...`);
        p.append(el('a', it.title, { href: 'work/' + encodeURIComponent(it.file) }), note); cell.append(p);
        const said = v => { note.textContent = note.textContent.replace(/re-checking.*$/, v); note.dataset.result = v; };
        recheck(it, pub, log).then(v => said(v === 'VALID' ? 'VALID in your browser' : v === 'CANNOT' ? 'this browser cannot check signatures' : 'FAKE in your browser'), () => said('could not re-check'));
      }
    }
    box.append(t); out.append(box);
  } catch { out.textContent = 'Could not load the board. Try again.'; }
})();
