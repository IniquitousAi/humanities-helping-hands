import { checkPublic } from '/public_check.js';
import { findClaims, whole, sentences as split } from '/finder.js';
import { run as settle } from '/checker.js';
import { receipt } from '/receipt.js';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let facts = null;
const loadFacts = () => facts ??= fetch('/facts.json').then(r => r.json()).then(d => d.facts).catch(e => { facts = null; throw e; });

const DEBRIS = /[­​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;
export const sentences = text => split(String(text).replace(DEBRIS, '')).map(s => s.trim()).filter(s => /[\p{L}\p{N}]/u.test(s)).slice(0, 40);

export function everyday(s) {
  return s.replace(/^(?:a|an|one)\s+(?=[a-z°]+\s+(?:is|=|equals)\b)/i, '1 ')
    .replace(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(\d[\d,]*(?:\.\d+)?)/gi, '$1/100 * $2')
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
const reason = why => why.replace(/;?\s*look it up below/g, '').replace(/^(.+?): settled by sources, not by math$/, 'it reads like $1, which sources settle, not math')
  .replace(/^([a-z][a-z ]+): (?!.*: )(.+)$/, 'it reads like $1 ($2)').replace(/^(.)/, c => c.toUpperCase()).replace(/([^.])$/, '$1.');
function suggest(s) {
  const n = (s.match(/\d[\d,]*(?:\.\d+)?/g) || []).map(x => x.replace(/,/g, ''));
  if (n.length < 3 || n.length > 5) return [];
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
      const [, , why] = settle(null, c.said), sg = c.maybe ? [] : suggest(c.said), near = sg.length ? null : nearest(c.said, all);
      out.push({ s: said1, label: 'NOT CHECKED', kind: 'none', suggest: sg, near,
        why: c.maybe ? `"${c.maybe.word}" may be a typo for a number word, so it was not checked.`
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
  return rs.slice(0, 40);
}

export function render(rs, out) {
  const n = l => rs.filter(r => r.label === l).length, yes = n('PROVEN') + n('ARITHMETIC-CHECKED'), no = n('FALSIFIED'), not = rs.length - yes - no;
  out.summary.innerHTML = rs.length
    ? `<b>${rs.length}</b> claim${rs.length > 1 ? 's' : ''}: <b>${yes}</b> proven, <b>${no}</b> false, <b>${not}</b> not checked.${not ? ' Not checked never means false.' : ''}`
    : 'Type or paste something to check.';
  const atlas = r => r.kind === 'library' ? ` &middot; <a href="atlas.html#${esc(r.id)}">open it in the Atlas</a>` : '';
  const rec = r => r.receipt ? ` &middot; receipt <code>${esc(r.receipt.sha256.slice(0, 12))}</code>` : '';
  const sug = r => r.suggest?.length ? `<span class="suggest">Did you mean one of these? ${r.suggest.map(f => `<button type="button" data-try="${esc(f)}">${esc(shown(f))}</button>`).join(' ')}</span>` : '';
  const near = r => r.near ? `<span class="suggest">The closest fact in the Atlas: <a href="atlas.html#${esc(r.near.id)}">${esc(r.near.claim.length > 110 ? r.near.claim.slice(0, 108) + '…' : r.near.claim)}</a></span>` : '';
  out.list.innerHTML = rs.map(r => `<li>${chip(r.label)}<div><p dir="auto">${esc(r.s)}</p><small>${esc(r.why)}${rec(r)}${atlas(r)}</small>${sug(r)}${near(r)}</div></li>`).join('');
  out.inline.innerHTML = rs.map(r => `<mark class="${(KIND[r.label] || KIND['NOT CHECKED'])[0]}" dir="auto">${esc(r.s)}</mark><sup>${chip(r.label)}</sup>`).join(' ');
  out.left.innerHTML = rs.map(r => `<p dir="auto">${esc(r.s)}</p>`).join('');
  out.right.innerHTML = rs.map(r => `<p>${chip(r.label)} ${r.form ? `<code>${esc(r.form)}</code> ` : ''}${esc(r.why)}${rec(r)}</p>${sug(r)}${near(r)}`).join('');
}

export const shareText = rs => rs.map(r => `${(KIND[r.label] || KIND['NOT CHECKED'])[1]}: ${r.s}${r.receipt ? ` (receipt ${r.receipt.sha256.slice(0, 12)})` : ''}`).join('\n')
  + '\nChecked on Humanities Helping Hands, humanitieshelpinghands.com';
