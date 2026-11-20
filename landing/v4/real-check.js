import { checkPublic } from '/public_check.js';
import { findClaims, whole, sentences as split } from '/finder.js';
import { run as settle } from '/checker.js';
import { receipt } from '/receipt.js';
import { getJSON } from './site.js';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let facts = null;
const loadFacts = () => facts ??= getJSON('/facts.json').then(d => d.facts).catch(e => { facts = null; throw e; });

const DEBRIS = /[­​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;
const every = text => split(String(text).replace(DEBRIS, '')).map(s => s.trim()).filter(s => /[\p{L}\p{N}]/u.test(s));
export const sentences = text => every(text).slice(0, 40);

export function everyday(s) {
  return s.replace(/^(?:a|an|one)\s+(?=[a-z°]+\s+(?:is|=|equals)\b)/i, '1 ')
    .replace(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s+off\s+[$€£]?\s?(\d[\d,]*(?:\.\d+)?)/gi, '$2 - $1/100 * $2')
    .replace(/\b(?:a|one)\s+(third|quarter|fifth|tenth)\s+of\s+[$€£]?\s?(\d[\d,]*(?:\.\d+)?)/gi, (m, f, n) => `${n} / ${{ third: 3, quarter: 4, fifth: 5, tenth: 10 }[f.toLowerCase()]}`)
    .replace(/\b(double|twice|triple)\s+[$€£]?\s?(\d[\d,]*(?:\.\d+)?)/gi, (m, w, n) => `${/triple/i.test(w) ? 3 : 2} * ${n}`)
    .replace(/(\d[\d,]*(?:\.\d+)?)\s+(squared|cubed)\b/gi, (m, n, w) => `${n}^${/cubed/i.test(w) ? 3 : 2}`)
    .replace(/(\d+)\s+dozen\b/gi, '$1 * 12')
    .replace(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s+(discount|reduction|decrease|cut|drop|markup|mark-up|raise|increase|rise|hike)\s+on\s+[$€£]?\s?(\d[\d,]*(?:\.\d+)?)(?=\s+(?:is|=|equals|comes\s+to)\s+[$€£]?\s?(\d[\d,]*(?:\.\d+)?))/gi,
      (m, p, w, x, y) => { const n = +x.replace(/,/g, ''), down = /^(?:dis|red|dec|cut|dro)/i.test(w), total = n + (down ? -1 : 1) * n * p / 100;
        return Math.abs(total - +y.replace(/,/g, '')) < 1e-9 * Math.max(1, n) ? `${x} ${down ? '-' : '+'} ${p}/100 * ${x}` : `${p}/100 * ${x}`; })
    .replace(/(\d+(?:\.\d+)?)\s*(?:%|percent)(?:\s+[a-z]+){0,2}?\s+(?:of|on)\s+[$€£]?\s?(\d[\d,]*(?:\.\d+)?)(?![\d,.]|\s+(?:for|over|per|a|an|each|every|daily|weekly|monthly|quarterly|yearly|annually|compounded)\b)/gi, '$1/100 * $2')
    .replace(/\bhalf of\s+(\d[\d,]*(?:\.\d+)?)/gi, '$1 / 2')
    .replace(/[$€£](?=\s?\d)\s?/g, '');
}

export const KIND = { PROVEN: ['proven', 'Proven'], 'ARITHMETIC-CHECKED': ['proven', 'Proven'], FALSIFIED: ['guess', 'False'], 'NOT CHECKED': ['plain', 'Not checked'] };
export const chip = label => { const [c, w] = KIND[label] || KIND['NOT CHECKED']; return `<span class="chip ${c}">${w}</span>`; };
const shown = f => String(f).replace(/\s\*\s/g, ' × ').replace(/~=/g, '≈');

function plain(label, check, why, form) {
  const lr = why.match(/left is (.+?), right is (.+)$/), rd = why.match(/exact value (.+?); the answer said (.+?), which allows/);
  if (lr && label === 'FALSIFIED') return /[<>]/.test(form) ? `Worked out exactly: the left side is ${lr[1]} and the right side is ${lr[2]}, so ${shown(form)} does not hold.` : `Worked out exactly: it comes to ${lr[1]}, not ${lr[2]}.`;
  if (lr) return `Worked out exactly with fractions: both sides come to ${lr[1]}.`;
  if (rd) return label === 'PROVEN' ? `The exact value is ${rd[1]}. You wrote ${rd[2]}, which matches to the digits you gave.` : `The exact value is ${rd[1]}. You wrote ${rd[2]}, which is off by more than the digits you gave allow.`;
  if (check === 'prime') return label === 'PROVEN' ? `Checked by trying every possible divisor: ${why}.` : `Checked: ${why}.`;
  return why;
}
const reason = why => /^the math in it could not be read: /.test(why) ? why.replace(/^t/, 'T').replace(/([^.])$/, '$1.') : why.replace(/;?\s*look it up below/g, '').replace(/^(.+?): settled by sources, not by math$/, 'it reads like $1, which sources settle, not math')
  .replace(/^([a-z][a-z ]+): (?!.*: )(.+)$/, 'it reads like $1 ($2)').replace(/^(.)/, c => c.toUpperCase()).replace(/([^.])$/, '$1.');
function suggest(s) {
  const n = (s.match(/\d[\d,]*(?:\.\d+)?/g) || []).map(x => x.replace(/,/g, ''));
  if (n.length < 3 || n.length > 5) return [];
  if (/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?\b/i.test(s)) return [];
  const last = n.at(-1), head = n.slice(0, -1);
  return [head.join(' + ') + ' = ' + last, head.join(' * ') + ' = ' + last];
}

const STOP = new Set('the a an of to in is are was be it its and or for on with by at as that this than from when what which who how not no yes'.split(' '));
const words = s => new Set((String(s).toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(w => w.length > 2 && !STOP.has(w)).map(w => w.replace(/(ing|es|s)$/, '')));
export function nearest(s, all) {
  const q = words(s); if (q.size < 2) return null;
  let best = null;
  for (const f of all || []) {
    const fw = words(f.claim); let shared = 0; for (const w of q) if (fw.has(w)) shared++;
    const score = shared / q.size;
    if (shared >= 2 && score >= 0.4 && (!best || score > best.score)) best = { id: f.id, claim: f.claim, score };
  }
  return best;
}

async function one(said, read, all, runId) {
  const lib = await checkPublic(said, all, runId);
  if (lib.kind === 'library') return { s: said, ...lib, why: `Fact ${lib.id} in the Atlas, checked by ${lib.checked_by}. The words around the math are ${String(lib.words_label).toLowerCase()}.` };
  const out = [];
  for (const c of findClaims(read)) {
    const said1 = out.length ? c.said : said;
    if (!c.form) {
      const unread = !c.maybe && (/^[\s\d+\-*/^().,%<>=!≤≥≠−×÷·√]+$/.test(c.said) || /^[\s\d+\-*/^().,%<>=!≤≥≠−×÷·√]+$/.test(said)) && /[=<>≤≥≠]/.test(c.said);
      const [, , why] = settle(null, c.said), sg = c.maybe || unread ? [] : suggest(c.said), near = sg.length || unread ? null : nearest(c.said, all);
      out.push({ s: said1, label: 'NOT CHECKED', kind: 'none', suggest: sg, near,
        why: c.maybe ? `"${c.maybe.word}" may be a typo for a number word, so it was not checked.`
          : unread ? 'Not checked: this is math the checker does not read yet. It reads + - * / ^ and one comparison between two sides, so work this one out by hand.'
          : sg.length ? 'Not checked: it has numbers but no math sign, and the machine never guesses whether they add or multiply. Pick the one you meant.'
          : near ? 'Not checked: it is not word for word a fact in the Atlas, and it has no math to work out. A close fact is below.'
          : 'Not checked: ' + reason(why).replace(/^./, x => x.toLowerCase()) });
      continue;
    }
    let [label, check, why] = whole(c, settle(c.form, c.said));
    if (label === 'GUESS' && c.rest && /^only the part/.test(why)) { out.push({ s: said1, label: 'NOT CHECKED', kind: 'part', form: c.form, why: `Only the math, ${shown(c.form)}, was checked, and it holds. The other words ("${c.rest.slice(0, 60)}") are not something math can check.` }); continue; }
    if (label === 'GUESS' || label === 'OPEN') { out.push({ s: said1, label: 'NOT CHECKED', kind: label === 'OPEN' ? 'open' : 'none', form: c.form, why: reason(why) }); continue; }
    const rec = await receipt(c.form, label, 'engine:' + check, runId, why);
    out.push({ s: said1, label, kind: 'engine', form: c.form, why: plain(label, check, why, c.form) + (read !== said && out.length === 0 ? ` Read as "${shown(read.replace(/[.!?]+$/, ''))}".` : ''), receipt: rec });
  }
  return out.length ? out : [{ s: said, label: 'NOT CHECKED', kind: 'none', why: 'Not checked: there is no math or Atlas fact in it to check.' }];
}

export async function check(text) {
  const all = await loadFacts(), runId = 'v3-' + Date.now().toString(36), rs = [];
  for (const s of sentences(text)) { const r = await one(s, everyday(s), all, runId); rs.push(...[r].flat()); }
  const kept = rs.slice(0, 40);
  if (rs.length > 40 || every(text).length > 40) kept.more = true;
  return kept;
}

export const ORDER = ['Proven', 'Measured', 'Reasoned', 'Guess', 'Not checked', 'False'];
const word = r => (KIND[r.label] || KIND['NOT CHECKED'])[1];
const CLS = { Proven: 'proven', Measured: 'measured', Reasoned: 'reasoned', Guess: 'guess', 'Not checked': 'plain', False: 'false' };
export function sorted(rs) { return ORDER.flatMap(w => rs.filter(r => word(r) === w)); }

export function filter(out) {
  const show = out.show ??= new Set();
  for (const box of [out.list, out.inline, out.left, out.right]) for (const el of box?.querySelectorAll('[data-k]') || []) el.hidden = show.size > 0 && !show.has(el.dataset.k);
  for (const b of out.sorter?.querySelectorAll('button') || []) b.setAttribute('aria-pressed', String(b.dataset.show === 'All' ? show.size === 0 : show.has(b.dataset.show)));
  const all = out.list?.querySelectorAll('li[data-k]:not(.grp-head)').length || 0, seen = out.list?.querySelectorAll('li[data-k]:not(.grp-head):not([hidden])').length || 0;
  if (out.note) out.note.textContent = show.size ? `Showing ${seen} of ${all}.` : '';
}

function drawSorter(rs, out) {
  if (!out.sorter) return;
  const have = ORDER.filter(w => rs.some(r => word(r) === w));
  out.show = new Set([...(out.show || [])].filter(w => have.includes(w)));
  if (out.show.size === have.length) out.show.clear();
  out.sorter.hidden = rs.length < 2;
  out.sorter.innerHTML = `<span class="sorter-name">Show</span><button type="button" data-show="All">All <b>${rs.length}</b></button>`
    + have.map(w => `<button type="button" class="s-${CLS[w]}" data-show="${w}">${w} <b>${rs.filter(r => word(r) === w).length}</b></button>`).join('')
    + '<span class="sorter-note" aria-live="polite"></span>';
  out.note = out.sorter.querySelector('.sorter-note');
  out.sorter.onclick = e => {
    const b = e.target.closest('button[data-show]'); if (!b) return;
    const w = b.dataset.show;
    if (w === 'All') out.show.clear(); else if (!out.show.delete(w)) out.show.add(w);
    if (out.show.size === have.length) out.show.clear();
    filter(out);
  };
}

export function render(rs, out) {
  const n = l => rs.filter(r => r.label === l).length, yes = n('PROVEN') + n('ARITHMETIC-CHECKED'), no = n('FALSIFIED'), not = rs.length - yes - no;
  out.summary.innerHTML = rs.length
    ? `<b>${rs.length}</b> claim${rs.length > 1 ? 's' : ''}: <b>${yes}</b> proven, <b>${no}</b> false, <b>${not}</b> not checked.${not ? ' Not checked never means false.' : ''}${rs.more ? ` Only the first ${rs.length} claims were checked. Paste the rest to check them too.` : ''}`
    : 'Type or paste something to check.';
  drawSorter(rs, out);
  const atlas = r => r.kind === 'library' ? ` &middot; <a href="atlas#${esc(r.id)}">open it in the Atlas</a>` : '';
  const rec = r => r.receipt ? `<span class="rc-sep"> &middot; </span><button type="button" class="rcpt" data-receipt="${esc(r.receipt.sha256)}" title="Copy the whole receipt code">receipt <code>${esc(r.receipt.sha256.slice(0, 12))}</code></button>` : '';
  const sug = r => r.suggest?.length ? `<span class="suggest">Did you mean one of these? ${r.suggest.map(f => `<button type="button" data-try="${esc(f)}">${esc(shown(f))}</button>`).join(' ')}</span>` : '';
  const near = r => r.near ? `<span class="suggest">The closest fact in the Atlas: <a href="atlas#${esc(r.near.id)}">${esc(r.near.claim.length > 110 ? r.near.claim.slice(0, 108) + '…' : r.near.claim)}</a></span>` : '';
  const groups = ORDER.map(w => [w, rs.filter(r => word(r) === w)]).filter(([, g]) => g.length);
  out.list.innerHTML = groups.map(([w, g]) => (groups.length > 1 ? `<li class="grp-head" data-k="${w}"><h4>${w} <span>${g.length}</span></h4></li>` : '')
    + g.map(r => `<li data-k="${w}">${chip(r.label)}<div><p dir="auto">${esc(r.s)}</p><small>${esc(r.why)}${rec(r)}${atlas(r)}</small>${sug(r)}${near(r)}</div></li>`).join('')).join('');
  out.inline.innerHTML = rs.map(r => `<span data-k="${word(r)}"><mark class="${(KIND[r.label] || KIND['NOT CHECKED'])[0]}" dir="auto">${esc(r.s)}</mark><sup>${chip(r.label)}</sup></span>`).join(' ');
  out.left.innerHTML = rs.map(r => `<p dir="auto" data-k="${word(r)}">${esc(r.s)}</p>`).join('');
  out.right.innerHTML = rs.map(r => `<div data-k="${word(r)}"><p>${chip(r.label)} ${r.form ? `<code>${esc(r.form)}</code> ` : ''}${esc(r.why)}${rec(r)}</p>${sug(r)}${near(r)}</div>`).join('');
  filter(out);
}

export const shareText = rs => rs.map(r => `${(KIND[r.label] || KIND['NOT CHECKED'])[1]}: ${r.s}${r.receipt ? ` (receipt ${r.receipt.sha256.slice(0, 12)})` : ''}`).join('\n')
  + '\nChecked on Humanities Helping Hands, humanitieshelpinghands.com';
