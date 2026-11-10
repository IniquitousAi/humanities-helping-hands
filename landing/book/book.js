import { build } from './book_pages.js';
import { getJSON, failed } from '../getjson.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = n => n.toLocaleString('en-US', { maximumFractionDigits: n < 10 ? 3 : 1 });
const pick = new URLSearchParams(location.search).get('cover');
if (pick === 'a' || pick === 'b') document.documentElement.dataset.cover = pick;

let book = null, at = 0;
const ready = getJSON('/atlas/facts.json', { shape: d => Array.isArray(d?.facts) }).then(d => {
  book = build(d);
  document.querySelectorAll('.count').forEach(el => { el.textContent = book.pages.length; });
}).catch(() => { document.querySelectorAll('.stage .open-hint').forEach(h => { h.hidden = false; failed(h, "The book's pages", '/atlas/facts.json', () => location.reload()); }); return new Promise(() => {}); });

function picture(v) {
  if (v.kind === 'odds') {
    const all = v.v < 0.01 ? 1000 : 100, on = Math.round(v.v * all);
    const each = v.v < 0.1 ? `about 1 in ${fmt(Math.round(1 / v.v))}` : `about ${on} in 100`;
    const dots = Array.from({ length: all }, (_, k) => `<i${k < on ? ` class="on" style="--k:${k}"` : ''}></i>`).join('');
    return `<div class="odds${all > 100 ? ' fine' : ''}" role="img" aria-label="${each}">${dots}</div><p class="cap">Each dot is 1 chance in ${fmt(all)}: ${each}${on ? '' : ', less than one dot'}.</p>`;
  }
  if (v.kind === 'scale') {
    const p = Math.log10(v.n), lo = Math.min(0, Math.floor(p)), hi = Math.max(lo + 2, Math.ceil(p + 0.0001));
    const step = Math.ceil((hi - lo) / 6), pos = e => `${((e - lo) / (hi - lo)) * 100}%`;
    let ticks = '';
    for (let e = lo; e <= hi; e += step) ticks += `<i class="tick" style="left:${pos(e)}"><span>${e < 4 && e > -3 ? fmt(10 ** e) : `10<sup>${e}</sup>`}</span></i>`;
    return `<div class="big-num">${fmt(v.n)}</div>
      <div class="scale" role="img" aria-label="${fmt(v.n)} on a scale of powers of ten"><i class="line"></i>${ticks}<i class="mark" data-to="${pos(p)}" style="left:0"></i></div>
      <p class="cap">${v.left ? `From ${esc(v.left)}. ` : ''}The blue mark is where it sits; each tick is ten times the last.</p>`;
  }
  if (v.kind === 'digits') {
    const blocks = Array.from({ length: Math.min(v.digits, 160) }, (_, k) => `<i style="--k:${k}"></i>`).join('');
    return `<div class="digits" role="img" aria-label="${v.digits} digits">${blocks}</div><p class="cap">One block per digit: a ${v.digits}-digit number, starting ${esc(v.head)}.</p>`;
  }
  if (v.kind === 'lean') return `<p class="cap">As Lean states it:</p><pre class="lean">${esc(v.text)}</pre>`;
  return `<div class="plate">${esc(v.text)}</div>`;
}

function contents() {
  return `<div class="head"><span>The Human Autobiography</span><span>Contents</span></div>
    <div class="toc"><h2>Contents</h2><p>${book.pages.length} proven facts, one a page, from the floor of math to the observable universe.</p>
    <ol>${book.chapters.map(c => `<li><a href="#p${c.first}"><span>${esc(c.name)} (${c.count})</span><b>${c.first}</b></a></li>`).join('')}</ol></div>`;
}

function leaf(p) {
  return `<div class="head"><span>${esc(p.chapter)}</span><span>Page ${p.n} of ${book.pages.length}</span></div>
    ${p.opens ? `<h2 class="chapter-open">${esc(p.chapter)}<small>Chapter ${book.chapters.findIndex(c => c.first === p.n) + 1}</small></h2>` : ''}
    ${p.levels ? `<div class="claim-levels">${['kids', 'everyone', 'technical'].map(l => `<p class="claim" data-level="${l}">${esc(p.levels[l])}</p>`).join('')}</div>`
      : `<p class="claim">${esc(p.claim)}</p>`}
    <div class="pic">${picture(p.visual)}
    ${p.visual.kind === 'plate' || p.visual.kind === 'lean' ? '' : `<p class="ans">Exact answer: <code>${esc(p.answer)}</code></p>`}</div>
    <div class="foot-notes">${p.notProven ? `<p class="not">Not proven: ${esc(p.notProven)}</p>` : ''}
    <div class="tagrow"><span class="tag proven">${p.label.tag}</span><span>${esc(p.label.by)}</span><a href="${p.receipt}">The receipt</a></div></div>`;
}

function fit(el) {
  const over = () => {
    if (el.scrollHeight > el.clientHeight + 1) return true;
    const pic = el.querySelector('.pic'); if (!pic) return false;
    const p = pic.getBoundingClientRect();
    return [...pic.children].some(c => c.getBoundingClientRect().bottom > p.bottom + 1);
  };
  for (const k of [1, 0.92, 0.85, 0.78, 0.72, 0.66]) { el.style.setProperty('--k', k); if (!over()) return; }
}

function show(n, way) {
  at = Math.max(0, Math.min(book.pages.length, n));
  const el = $('page'), p = book.pages[at - 1];
  el.className = `book page${p && p.star ? ' star' : ''}`;
  el.innerHTML = at ? leaf(p) : contents();
  fit(el);
  if (way) { void el.offsetWidth; el.classList.add(way > 0 ? 'turn-next' : 'turn-back'); }
  requestAnimationFrame(() => { el.classList.add('shown'); el.querySelectorAll('.mark').forEach(m => { m.style.left = m.dataset.to; }); });
  $('prev').disabled = at === 0; $('next').disabled = at === book.pages.length;
  const h = at ? `#p${at}` : '#contents';
  if (location.hash !== h) history.replaceState(null, '', h);
}
const turn = d => { if (book && !$('page').hidden) show(at + d, d); };

const hints = show => document.querySelectorAll('.stage .open-hint').forEach(h => { h.hidden = !show; });
async function open(n = 0) {
  await ready;
  $('cover').classList.add('opening'); hints(false);
  setTimeout(() => { $('cover').hidden = true; $('page').hidden = false; $('turns').hidden = false; $('shut').hidden = false; show(n); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 380);
}
function shut() {
  $('page').hidden = true; $('turns').hidden = true; $('shut').hidden = true;
  $('cover').hidden = false; hints(true); requestAnimationFrame(() => $('cover').classList.remove('opening'));
  history.replaceState(null, '', location.pathname + location.search);
}

$('cover').onclick = () => open();
$('prev').onclick = () => turn(-1); $('next').onclick = () => turn(1);
$('toc').onclick = () => { if (book) show(0, -1); };
$('shut').onclick = shut;
$('page').addEventListener('click', e => {
  const a = e.target.closest('a');
  if (a && a.hash.startsWith('#p')) { e.preventDefault(); show(Number(a.hash.slice(2)), 1); return; }
  if (a || swiped || window.getSelection().toString()) return;
  const r = $('page').getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
  if (x > 0.7) turn(1); else if (x < 0.3) turn(-1);
});
let sx = null, sy = 0, swiped = false;
$('page').addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; swiped = false; });
$('page').addEventListener('pointerup', e => {
  if (sx === null) return;
  const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped = true; turn(dx < 0 ? 1 : -1); }
});
addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') turn(1); else if (e.key === 'ArrowLeft') turn(-1);
  else if (e.key === 'Escape' && !$('page').hidden) shut();
});
function follow() {
  const m = /^#p(\d+)$|^#contents$/.exec(location.hash);
  if (!m) return;
  const n = m[1] ? Number(m[1]) : 0;
  if ($('page').hidden) open(n); else if (n !== at) show(n, n > at ? 1 : -1);
}
addEventListener('hashchange', follow);
const fact = new URLSearchParams(location.search).get('fact');
if (fact) ready.then(() => { const i = book.pages.findIndex(p => p.id === fact); open(i < 0 ? 0 : i + 1); });
else follow();
