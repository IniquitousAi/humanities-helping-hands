import { index, search } from './match.js';
const BARRIERS = [
  [/diagonal|simulat|relativ|oracle|halting|self.?refer/i, 'Relativization (Baker, Gill and Solovay, 1975): a proof that works unchanged with any oracle cannot settle P vs NP.'],
  [/circuit|lower bound|natural|combinator|random restrict|switching lemma/i, 'Natural proofs (Razborov and Rudich, 1997): the usual circuit arguments, if they worked, would also break strong cryptography.'],
  [/algebra|polynom|arithmeti|low.?degree|interpolat/i, 'Algebrization (Aaronson and Wigderson, 2009): turning logic into algebra alone runs into the same wall as relativization.'],
];
const $ = id => document.getElementById(id), el = (tag, cls, text) => Object.assign(document.createElement(tag), cls ? { className: cls } : {}, text ? { textContent: text } : {});
const byTitle = new Map();
for (const r of document.querySelectorAll('.founders .row')) { const b = r.querySelector('b'); if (b) byTitle.set(b.textContent, r); }
const rows = [...byTitle.values()], all = [...document.querySelectorAll('.founders .row')].filter(r => r.querySelector('b'));
const info = rows.map(r => ({ title: r.querySelector('b').textContent, text: r.textContent, tag: r.querySelector('.tag') }));
const ix = index(info);

const input = $('idea'), box = input.closest('.trace-box');
input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-controls', 'idea-list');
const list = el('ul', 'idea-list'); list.id = 'idea-list'; list.setAttribute('role', 'listbox'); list.hidden = true; box.after(list);
const tools = el('p', 'idea-tools'); tools.hidden = true;
const only = el('label', 'idea-only'), check = el('input'); check.type = 'checkbox'; only.append(check, ' Show only the matching rows');
const clear = el('button', '', 'Clear'); clear.type = 'button'; tools.append(only, clear); list.after(tools);
let hits = [], active = -1;

const pill = tag => tag ? el('span', tag.className, tag.textContent) : el('span', 'tag open', 'NOT TRACED');
function line(i) {
  const a = el('a', 'idea-hit'); a.href = '#'; a.append(pill(info[i].tag), ' ', info[i].title);
  a.addEventListener('click', e => { e.preventDefault(); jump(i); });
  return a;
}
function jump(i) {
  check.checked = false; show();
  for (const r of all) r.classList.remove('found');
  rows[i].classList.add('found'); rows[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
  list.hidden = true; input.setAttribute('aria-expanded', 'false');
}
function show() {
  const keep = new Set(hits.map(h => rows[h.i]));
  for (const r of all) r.hidden = check.checked && input.value.trim() !== '' && !keep.has(r);
}
function pick(n) {
  active = n;
  [...list.children].forEach((li, k) => li.setAttribute('aria-selected', String(k === n)));
  input.setAttribute('aria-activedescendant', n >= 0 ? `idea-opt-${n}` : '');
}
function run() {
  const q = input.value.trim();
  for (const r of all) r.classList.remove('found');
  hits = q ? search(ix, q) : [];
  list.replaceChildren(...hits.slice(0, 5).map((h, k) => {
    const li = el('li'); li.id = `idea-opt-${k}`; li.setAttribute('role', 'option');
    const t = info[h.i].title.match(/^(.*), (\d{4}): (.*)$/) || [, info[h.i].title, '', ''];
    li.append(pill(info[h.i].tag), el('b', '', `${t[1]}${t[2] ? ', ' + t[2] : ''}`), el('span', 'idea-claim', t[3]));
    li.addEventListener('mousedown', e => { e.preventDefault(); jump(h.i); });
    return li;
  }));
  list.hidden = !hits.length; input.setAttribute('aria-expanded', String(!!hits.length)); pick(-1);
  tools.hidden = !q; show();
  const walls = BARRIERS.filter(([re]) => re.test(q)).map(([, why]) => why);
  $('idea-wall').hidden = !walls.length;
  $('idea-wall').replaceChildren(...(walls.length ? [el('span', 'tag checked', 'CHECKED'), ' Watch out: ' + walls.join(' ')] : []));
  const count = $('idea-count'); count.hidden = !q;
  if (!q) return count.replaceChildren();
  if (!hits.length) return count.replaceChildren(el('span', 'tag open', 'NO MATCH LOGGED'),
    ' None of the logged attempts uses these words. Your idea may be new, or worded differently: try another word for the same step.');
  const n = hits.length, shown = hits.slice(0, 8).map(h => line(h.i));
  count.replaceChildren(`${n} past attempt${n === 1 ? '' : 's'} share${n === 1 ? 's' : ''} your words. Read where ${n === 1 ? 'it' : 'they'} broke before you start:`, ...shown);
  if (n > shown.length) {
    const more = el('button', '', `Show all ${n}`); more.type = 'button';
    more.addEventListener('click', () => { check.checked = true; show(); });
    count.append(more);
  }
}
input.addEventListener('input', run); input.addEventListener('search', run);
input.addEventListener('keydown', e => {
  const n = list.children.length;
  if (e.key === 'ArrowDown' && n) { e.preventDefault(); list.hidden = false; pick((active + 1) % n); }
  else if (e.key === 'ArrowUp' && n) { e.preventDefault(); pick((active - 1 + n) % n); }
  else if (e.key === 'Enter' && hits.length) { e.preventDefault(); jump(hits[Math.max(active, 0)].i); }
  else if (e.key === 'Escape' && !list.hidden) { e.preventDefault(); list.hidden = true; input.setAttribute('aria-expanded', 'false'); }
});
input.addEventListener('blur', () => { list.hidden = true; });
input.addEventListener('focus', () => { if (list.children.length) list.hidden = false; });
check.addEventListener('change', show);
clear.addEventListener('click', () => { input.value = ''; check.checked = false; run(); input.focus(); });
