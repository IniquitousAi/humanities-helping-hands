import { getJSON } from './getjson.js';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; e.textContent = text; return e; };
const when = iso => new Date(iso).toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const rows = document.getElementById('proof5-rows'), count = document.getElementById('mistakes-count');

if (rows) fetch('/proof5.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => {
  if (!d || !Array.isArray(d.checks)) return;
  rows.replaceChildren(...d.checks.map(c => {
    const li = el('li', '', '');
    li.append(el('span', c.pass ? 'tag proven' : 'tag falsified', c.pass ? 'PASS' : 'FAIL'), ' ', el('b', '', c.name),
      ' ', el('span', '', c.says), el('small', '', c.receipt));
    return li;
  }));
  rows.after(el('p', 'meta', `${d.passed} of ${d.checks.length} pass, checked ${when(d.built)} Central time.`));
}).catch(() => {});

const stopped = d => Number.isInteger(d?.stopped) ? d.stopped
  : d.mistakes.filter(m => !String(m.then).startsWith('found after')).reduce((n, m) => n + (m.times || 1), 0);
if (count) getJSON('/mistakes.json', { shape: d => Array.isArray(d?.mistakes) }).then(d => { count.textContent = stopped(d); }).catch(() => {});
