import { chainOf } from './chains.js';
import { run, PROVEN } from './checker.js';
import { search, related } from './search.js';
import { factsOnce } from '/facts-once.js';

const $ = id => document.getElementById(id);
const TAG = { PROVEN: 'proven', GUESS: 'guess', OPEN: 'open', ROOT: 'root' };
let facts = [];


function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

function show(f) {
  const c = chainOf(f), out = $('trace-chain');
  out.replaceChildren();
  out.append(el('p', 'trace-start', c.claim));
  const ol = el('ol', 'trace-steps');
  let rerunMs = null;
  for (const s of c.steps) {
    const li = el('li', 'trace-step'), body = el('div');
    let label = s.label;
    if (s.rerun) {
      const t0 = performance.now(), [verdict] = run(s.rerun); rerunMs = performance.now() - t0;
      if (verdict !== PROVEN) label = 'OPEN';
    }
    li.append(el('span', 'tag ' + TAG[label], label));
    body.append(el('b', null, s.what));
    body.append(el(s.code ? 'code' : 'small', null, s.detail));
    li.append(body); ol.append(li);
  }
  out.append(ol);
  const saved = el('p', 'trace-saved');
  saved.append(el('span', null, `Saved you about ${c.handMinutes} minutes. `),
    el('span', 'tag guess', 'GUESS'), el('small', 'grade', 'quick '),
    el('small', null, ` About 10 minutes to check each step by hand, range ${c.handMinutes / 5} to ${c.handMinutes * 3} minutes in all; not yet timed with real people.`));
  out.append(saved);
  if (rerunMs != null) {
    const p = el('p', 'trace-saved');
    p.append(el('span', null, `Checked again in your browser just now: one run, ${rerunMs < 1 ? 'under 1' : Math.round(rerunMs)} ms on this device.`));
    out.append(p);
  }
  const more = el('p', 'trace-link'), a = el('a', null, 'See its page in The Human Autobiography');
  a.href = '/book/?fact=' + encodeURIComponent(f.id);
  more.append(a); out.append(more);
  out.hidden = false;
}

export async function traceFor(q) {
  await ready;
  const { hits, total } = search(q, facts), ul = $('trace-hits'), near = hits.length ? [] : related(q, facts);
  ul.replaceChildren(); $('trace-chain').hidden = true;
  $('trace-head').textContent = near.length ? 'Related facts in the library (not the same claim)' : 'In the library';
  for (const f of hits.length ? hits : near) {
    const li = el('li'), b = el('button', null, f.claim);
    b.type = 'button'; b.addEventListener('click', () => { ul.replaceChildren(); show(f); });
    li.append(b); ul.append(li);
  }
  if (total > hits.length) {
    const li = el('li', 'trace-more', `${hits.length} of ${total} facts shown. Add a word to narrow it, or see them all in the `);
    li.append(Object.assign(el('a', null, 'plain list'), { href: 'atlas/list/' }), '.'); ul.append(li);
  }
  $('trace-head').hidden = !hits.length && !near.length;
  $('trace-none').hidden = !q.trim() || hits.length > 0;
  return total;
}

const ready = factsOnce.then(j => { facts = j.facts; }).catch(() => {});
