const MODE = document.body.dataset.mode || 'everyone';
const REAL = !!document.body.dataset.site && MODE !== 'kids';
const KID = { proven: 'Yes, true!', measured: 'We measured it', reasoned: 'We think so', guess: 'Just a guess' };
const WORD = { proven: 'Proven', measured: 'Measured', reasoned: 'Reasoned', guess: 'Guess' };

const CLAIMS = {
  kids: [
    ['2 + 2 = 4', 'proven'], ['This puppy weighs 9 pounds', 'measured'], ['It will rain tomorrow', 'reasoned'],
    ['Cats dream about fish', 'guess'], ['A square has 4 sides', 'proven'], ['The tree is 20 feet tall', 'measured'],
  ],
  everyone: [
    ['There are infinitely many prime numbers.', 'proven'], ['Water boils at 100 °C at sea level.', 'measured'],
    ['Sleeping more helps most students remember what they studied.', 'reasoned'], ['This stock will double next year.', 'guess'],
    ['The square root of 2 is not a fraction.', 'proven'], ['The Eiffel Tower is about 330 meters tall.', 'measured'],
  ],
  technical: [
    ['∀ n ∈ ℕ, ∃ p prime, p > n', 'proven', 'Math', 'Nat.exists_infinite_primes', 'kernel check, Lean 4'],
    ['R(3,3) = 6', 'proven', 'Combinatorics', 'SimpleGraph.ramsey_three_three', 'kernel check, Lean 4 + exhaustive search'],
    ['g₀ = 9.80665 m·s⁻² (standard gravity)', 'measured', 'Physics', 'CGPM 1901 definition', 'source match, unit check'],
    ['Human genome length ≈ 3.05 × 10⁹ bp', 'measured', 'Biology', 'T2T-CHM13 assembly', 'source match, figure recomputed'],
    ['Spaced practice beats massed practice for retention', 'reasoned', 'Psychology', 'Cepeda et al. 2006, meta-analysis', 'argument chain, 3 links'],
    ['R(5,5) = 43', 'guess', 'Combinatorics', 'open: 43 ≤ R(5,5) ≤ 46', 'no proof exists; bounds only'],
  ],
}[MODE] || [];

const STEPS = REAL ? {
  everyone: ['The claim in words', 'The exact statement', 'The proof checker accepts it', 'The receipt'],
  technical: ['claim', 'statement', 'kernel', 'receipt'],
}[MODE] : {
  kids: ['Reading it', 'Checking it', 'All done!'],
  everyone: ['Read the claim', 'Split it into parts', 'Run the checks', 'Write the receipt'],
  technical: ['parse', 'formalize', 'check', 'stamp'],
}[MODE];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const hex = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');
const clock = () => new Date().toLocaleTimeString('en-US', { hour12: false });
const wait = ms => new Promise(r => setTimeout(r, ms));
async function awake() { while (document.hidden) await wait(500); }
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chip = (label, kids) => `<span class="chip ${label}">${kids ? KID[label] : WORD[label]}</span>`;

const receipts = $$('[data-machine="receipt"]');
const feeds = $$('[data-machine="feed"]');
const logs = $$('[data-machine="log"]');
const kids = $$('[data-machine="kids"]');
const pipes = $$('[data-machine="pipe"]');
const counts = $$('[data-count]');
const fields = $$('[data-field-count]');

receipts.forEach(r => {
  r.innerHTML = `<div class="panel-head"><span class="live">${REAL ? 'Replaying the Atlas' : 'Checking now'}</span><span data-r="no">${REAL ? '' : 'HHH-—'}</span></div>
    <div class="claim" data-r="claim"></div>
    <ol class="steps">${STEPS.map(s => `<li><span class="ok"></span><span>${s}</span><span class="t"></span></li>`).join('')}</ol>
    <div class="meter"><i></i></div>
    <div class="receipt-foot"><span data-r="label"><span class="chip wait">Checking</span></span><span class="no" data-r="hash"></span></div>`;
});
function logLine(html) {
  for (const l of logs) { const s = document.createElement('span'); s.innerHTML = html; l.append(s); while (l.children.length > 40) l.firstElementChild.remove(); }
}

let total = Number(counts[0]?.dataset.count || 0);
async function check([text, label, field, ref, method]) {
  const no = 'HHH-' + hex(3).toUpperCase(), hash = hex(8);
  for (const r of receipts) {
    $('[data-r="no"]', r).textContent = no; $('[data-r="claim"]', r).textContent = text;
    $('[data-r="label"]', r).innerHTML = '<span class="chip wait">Checking</span>'; $('[data-r="hash"]', r).textContent = '';
    $$('.steps li', r).forEach(li => { li.className = ''; $('.t', li).textContent = ''; }); $('.meter i', r).style.width = '0';
  }
  for (const k of kids) { $('[data-k="claim"]', k).textContent = text; const a = $('[data-k="answer"]', k); a.className = 'k-answer wait'; a.textContent = 'Checking…'; }
  if (field) logLine(`<span class="w">[${clock()}]</span> <span class="k">recv</span> ${no} field=${field} “${esc(text)}”`);
  for (let i = 0; i < STEPS.length; i++) {
    await awake();
    for (const p of pipes) $$('.stage', p).forEach((s, j) => s.classList.toggle('on', j === i));
    for (const r of receipts) { const li = $$('.steps li', r)[i]; li.className = 'run'; }
    const ms = 650 + Math.round(Math.random() * 500);
    if (field) {
      const say = [
        `parse → ${2 + (text.length % 4)} atoms, 0 ambiguities`,
        `formalize → ref ${esc(ref)}`,
        `check → ${esc(method)}`,
        `stamp → sha256:${hash}…`,
      ][i];
      logLine(`<span class="w">[${clock()}]</span> ${say}`);
    }
    await wait(ms);
    for (const r of receipts) { const li = $$('.steps li', r)[i]; li.className = 'done'; $('.t', li).textContent = (ms / 1000).toFixed(2) + 's'; $('.meter i', r).style.width = `${(i + 1) / STEPS.length * 100}%`; }
  }
  for (const p of pipes) $$('.stage', p).forEach(s => s.classList.remove('on'));
  for (const r of receipts) { $('[data-r="label"]', r).innerHTML = chip(label); $('[data-r="hash"]', r).textContent = 'sha256 ' + hash.slice(0, 12); }
  for (const k of kids) { const a = $('[data-k="answer"]', k); a.className = 'k-answer ' + label; a.textContent = KID[label]; }
  if (field) logLine(`<span class="w">[${clock()}]</span> <span class="${label === 'guess' ? 'r' : 'g'}">label ${WORD[label].toUpperCase()}</span> ${no}`);
  for (const f of feeds) {
    const li = document.createElement('li'); li.className = 'new';
    li.innerHTML = `<span class="t">${clock()}</span><span class="c">${esc(text)}</span>${chip(label, MODE === 'kids')}`;
    f.prepend(li); while (f.children.length > Number(f.dataset.max || 6)) f.lastElementChild.remove();
  }
  total++; counts.forEach(c => { c.textContent = total.toLocaleString('en-US'); });
  if (field) fields.forEach(f => { if (f.dataset.fieldCount === field) f.textContent = (Number(f.textContent.replace(/,/g, '')) + 1).toLocaleString('en-US'); });
}

const realChip = (l, kids) => l === 'PROVEN' ? chip('proven', kids) : `<span class="chip measured">Math checked</span>`;
async function replay(f) {
  for (const r of receipts) {
    $('[data-r="no"]', r).textContent = f.id; $('[data-r="claim"]', r).textContent = f.claim;
    $('[data-r="label"]', r).innerHTML = '<span class="chip wait">Replaying</span>'; $('[data-r="hash"]', r).textContent = '';
    $$('.steps li', r).forEach(li => { li.className = ''; $('.t', li).textContent = ''; }); $('.meter i', r).style.width = '0';
  }
  const say = [`${esc(f.id)} “${esc(f.claim)}”`, `statement: ${esc(f.checked_as || '')}`, `kernel: ${esc(f.checked_by)} accepts <span class="k">${esc(f.theorem || '')}</span>`, `receipt: /atlas/#${esc(f.id)}`];
  for (let i = 0; i < STEPS.length; i++) {
    await awake();
    for (const p of pipes) $$('.stage', p).forEach((s, j) => s.classList.toggle('on', j === i));
    for (const r of receipts) $$('.steps li', r)[i].className = 'run';
    if (logs.length) logLine(`<span class="w">[${STEPS[i]}]</span> ${say[i]}`);
    await wait(i === 0 ? 1100 : 800);
    for (const r of receipts) { $$('.steps li', r)[i].className = 'done'; $('.meter i', r).style.width = `${(i + 1) / STEPS.length * 100}%`; }
  }
  for (const p of pipes) $$('.stage', p).forEach(s => s.classList.remove('on'));
  for (const r of receipts) { $('[data-r="label"]', r).innerHTML = realChip(f.label); $('[data-r="hash"]', r).textContent = f.theorem || ''; }
  if (logs.length) logLine(`<span class="g">label ${f.label === 'PROVEN' ? 'PROVEN' : 'MATH CHECKED'}</span> ${esc(f.id)}`);
  for (const fd of feeds) {
    const li = document.createElement('li'); li.className = 'new';
    li.innerHTML = `<span class="t">${esc(f.added || '')}</span><span class="c">${esc(f.claim)}</span>${realChip(f.label)}`;
    fd.prepend(li); while (fd.children.length > Number(fd.dataset.max || 6)) fd.lastElementChild.remove();
  }
}
if (REAL) {
  (async () => {
    let facts = [];
    try { facts = (await (await fetch('/facts.json')).json()).facts.filter(f => f.claim && f.claim.length <= 95); } catch { /* shown below */ }
    if (!facts.length) { for (const r of receipts) $('[data-r="claim"]', r).textContent = 'The facts did not load. The Atlas has every one.'; return; }
    for (let i = facts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [facts[i], facts[j]] = [facts[j], facts[i]]; }
    for (const fd of feeds) for (const f of facts.slice(-Number(fd.dataset.max || 6))) {
      const li = document.createElement('li'); li.innerHTML = `<span class="t">${esc(f.added || '')}</span><span class="c">${esc(f.claim)}</span>${realChip(f.label)}`; fd.append(li);
    }
    if (logs.length) logLine(`<span class="w">[replay]</span> ${facts.length} facts from /facts.json, each accepted by the Lean proof checker`);
    let i = 0; for (;;) { await replay(facts[i++ % facts.length]); await wait(2600); }
  })();
}

if (!REAL) for (const f of feeds) {
  const n = Number(f.dataset.max || 6);
  for (let i = 0; i < Math.min(n, CLAIMS.length); i++) {
    const [text, label] = CLAIMS[(CLAIMS.length - 1 - i) % CLAIMS.length];
    const li = document.createElement('li'); const d = new Date(Date.now() - (i + 1) * 47000);
    li.innerHTML = `<span class="t">${d.toLocaleTimeString('en-US', { hour12: false })}</span><span class="c">${esc(text)}</span>${chip(label, MODE === 'kids')}`;
    f.append(li);
  }
}
if (logs.length && !REAL) logLine('<span class="w">[boot]</span> checker mockup, pretend data, nothing is connected');

const toast = document.getElementById('toast');
document.addEventListener('click', e => {
  const d = e.target.closest('[data-demo]'); if (!d || document.body.dataset.site) return;
  e.preventDefault(); if (!toast) return;
  toast.textContent = d.dataset.demo; toast.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove('on'), 3200);
});
document.addEventListener('submit', e => { if (e.target.matches('form[data-demo]')) { e.preventDefault(); e.target.querySelector('[data-demo]')?.click(); } });

(async () => { let i = 0; if (!CLAIMS.length || document.body.dataset.site) return; for (;;) { await check(CLAIMS[i++ % CLAIMS.length]); await wait(2200); } })();
