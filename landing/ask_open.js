const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

export function askButton(q) {
  const box = el('div', 'ask-open'), b = el('button', 'ask-btn', 'Add this to open problems'), note = el('small', null, '(sends only these words; no name, no address)');
  b.type = 'button';
  b.addEventListener('click', async () => {
    b.disabled = true;
    let r = null, d = {};
    try { r = await fetch('/api/asked', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q }) }); d = await r.json(); } catch { /* shown below */ }
    const said = el('p', 'ask-done');
    if (r && r.ok) {
      said.append(d.added ? 'Added. ' : `Added again: ${d.n} searches asked this. `);
      const a = el('a', null, 'See the list'); a.href = '/open/#asked'; said.append(a, '.');
    } else said.textContent = (d && d.error) || 'Could not add it. Try again in a minute.';
    box.replaceChildren(said);
  });
  box.append(b, note);
  return box;
}
