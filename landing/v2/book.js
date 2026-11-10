const level = new URLSearchParams(location.search).get('level') || 'everyone';
const spread = document.getElementById('spread'), where = document.getElementById('where'), jump = document.getElementById('jump');
const prev = document.getElementById('prev'), next = document.getElementById('next');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chip = f => level === 'kids' ? (f.label === 'PROVEN' ? '<span class="chip proven">Yes, true!</span>' : '<span class="chip measured">We measured it</span>')
  : f.label === 'PROVEN' ? '<span class="chip proven">Proven</span>' : '<span class="chip measured">Math checked</span>';
let facts = [], at = 0;
const two = () => matchMedia('(min-width:621px)').matches ? 2 : 1;
function page(f, n) {
  if (!f) return `<div><h4>The end, for now</h4><p>The next page is written the day the checker proves something new.</p><span class="pn">${n}</span></div>`;
  const how = level === 'kids' ? (f.label === 'PROVEN' ? 'A computer checked every step. It found no mistake.' : 'A computer checked the math. The numbers that go in come from people who measured them.')
    : level === 'technical' ? `<code class="book-code">${esc(f.checked_as)}</code>${f.theorem ? `<br><span class="card-note">theorem ${esc(f.theorem)}</span>` : ''}`
    : `Checked by ${esc(f.checked_by)}.${f.not_proven ? ' ' + esc(f.not_proven) : ''}`;
  const receipt = level === 'kids' ? '' : `<a class="count" href="${level === 'technical' ? 'tech-atlas' : 'atlas'}.html#${encodeURIComponent(f.id)}">See the receipt &rarr;</a>`;
  return `<div>${chip(f)}<h4>${esc(f.claim)}</h4><p>${how}</p>${receipt}<span class="pn">Page ${n}</span></div>`;
}
function draw() {
  const k = two();
  at = Math.max(0, Math.min(at, facts.length - 1)); at -= at % k;
  spread.innerHTML = page(facts[at], at + 1) + (k === 2 ? page(facts[at + 1], at + 2) : '');
  where.textContent = `Pages ${at + 1}${k === 2 ? `-${Math.min(at + 2, facts.length + 1)}` : ''} of ${facts.length}`;
  prev.disabled = at === 0; next.disabled = at + k >= facts.length; jump.value = String(at);
}
prev.addEventListener('click', () => { at -= two(); draw(); });
next.addEventListener('click', () => { at += two(); draw(); });
jump.addEventListener('change', () => { at = Number(jump.value); draw(); });
addEventListener('keydown', e => { if (e.target.closest('input,select,textarea')) return; if (e.key === 'ArrowRight' && !next.disabled) next.click(); if (e.key === 'ArrowLeft' && !prev.disabled) prev.click(); });
addEventListener('resize', draw);
if (level === 'kids') document.body.classList.add('kids');
try { facts = (await (await fetch('/facts.json')).json()).facts; } catch { where.textContent = 'The book did not load.'; }
jump.innerHTML = facts.map((f, i) => `<option value="${i}">Page ${i + 1}</option>`).join('');
draw();
