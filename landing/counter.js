const line = document.getElementById('visitors');
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; e.textContent = text; return e; };
if (line) fetch('/hit', { method: 'POST', cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => {
  if (!d || typeof d.visitors !== 'number') return;
  const at = new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' });
  line.replaceChildren(el('b', 'big', d.visitors.toLocaleString('en-US')), ' ', el('span', 'what', d.visitors === 1 ? 'visitor today' : 'visitors today'),
    ' ', el('span', 'tag measured', 'MEASURED'), document.createElement('br'),
    el('small', '', `Read live at ${at} Central time (source: our own counter, one count per device a day, no cookies, no address kept, bots skipped; resets at midnight Central time).`));
}).catch(() => {});
