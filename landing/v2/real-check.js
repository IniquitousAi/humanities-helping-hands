import { checkPublic } from '/public_check.js';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let facts = null;
const loadFacts = () => facts ??= fetch('/facts.json').then(r => r.json()).then(d => d.facts).catch(e => { facts = null; throw e; });

const DEBRIS = /[­​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;
export const sentences = text => String(text).replace(DEBRIS, '').split(/(?<=[.!?;])\s+|\n+/).map(s => s.trim()).filter(s => /[\p{L}\p{N}]/u.test(s)).slice(0, 40);

const KIND = {
  PROVEN: ['proven', 'Proven'], 'ARITHMETIC-CHECKED': ['measured', 'Math checked'],
  FALSIFIED: ['guess', 'False'], 'NOT CHECKED': ['plain', 'Not checked'],
};
export const chip = label => { const [c, w] = KIND[label] || KIND['NOT CHECKED']; return `<span class="chip ${c}">${w}</span>`; };
const how = r => r.kind === 'arith' ? `Exact whole-number arithmetic, worked out as ${r.form}.`
  : r.kind === 'library' ? `Fact ${r.id} in the Atlas, checked by ${r.checked_by}. The words around the math are ${String(r.words_label).toLowerCase()}.`
  : r.error ? r.error : r.plain;

export async function check(text) {
  const all = await loadFacts(), run = 'v2-' + Date.now().toString(36);
  const out = [];
  for (const s of sentences(text)) out.push({ s, ...(await checkPublic(s, all, run)) });
  return out;
}

export function render(rs, out) {
  const n = l => rs.filter(r => r.label === l).length;
  const proven = n('PROVEN') + n('ARITHMETIC-CHECKED');
  out.summary.innerHTML = rs.length
    ? `<b>${rs.length}</b> claim${rs.length > 1 ? 's' : ''}: <b>${proven}</b> checked true, <b>${n('FALSIFIED')}</b> false, <b>${n('NOT CHECKED') + rs.filter(r => r.error).length}</b> not checked.`
    : 'Type or paste something to check.';
  const atlas = r => r.kind === 'library' ? ` &middot; <a href="atlas.html#${esc(r.id)}">open it in the Atlas</a>` : '';
  const rec = r => r.receipt ? ` &middot; receipt <code>${esc(r.receipt.sha256.slice(0, 12))}</code>` : '';
  out.list.innerHTML = rs.map(r => `<li>${chip(r.label)}<div><p>${esc(r.s)}</p><small>${esc(how(r))}${rec(r)}${atlas(r)}</small></div></li>`).join('');
  out.inline.innerHTML = rs.map(r => `<mark class="${(KIND[r.label] || KIND['NOT CHECKED'])[0]}">${esc(r.s)}</mark><sup>${chip(r.label)}</sup>`).join(' ');
  out.left.innerHTML = rs.map(r => `<p>${esc(r.s)}</p>`).join('');
  out.right.innerHTML = rs.map(r => `<p>${chip(r.label)} ${esc(how(r))}</p>`).join('');
}

export const shareText = rs => rs.map(r => `${(KIND[r.label] || KIND['NOT CHECKED'])[1]}: ${r.s}${r.receipt ? ` (receipt ${r.receipt.sha256.slice(0, 12)})` : ''}`).join('\n')
  + '\nChecked on Humanities Helping Hands, humanitieshelpinghands.com';
