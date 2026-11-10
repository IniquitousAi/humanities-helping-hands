import { receipt } from './receipt.js';

export const MAX_CLAIM = 300, MAX_BODY = 2048, MAX_DIGITS = 60, MAX_POW = 512, MAX_RESULT_DIGITS = 4000, MAX_TOKENS = 80;
export const LABELS = { PROVEN: 'PROVEN', FALSIFIED: 'FALSIFIED', NOT: 'NOT CHECKED' };
const norm = s => String(s).normalize('NFKC').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').replace(/[.\s]+$/, '').replace(/(?<![\d)!])!+$/, '').replace(/[.\s]+$/, '').trim();

class Big extends Error {}
class Frac extends Error {}
function lex(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    if (/[0-9]/.test(c)) { let j = i; while (j < s.length && /[0-9,_]/.test(s[j])) j++; const raw = s.slice(i, j);
      if (raw.includes(',') && !/^\d{1,3}(,\d{3})+$/.test(raw)) return null;
      if (raw.includes('_') && !/^\d+(_\d+)+$/.test(raw)) return null;
      if (raw === '0' && /[xX]/.test(s[j] || '') && /[0-9a-fA-F]/.test(s[j + 1] || '')) return null;
      const d = raw.replace(/[,_]/g, ''); if (d.length > MAX_DIGITS) throw new Big(); out.push({ n: BigInt(d) }); i = j; continue; }
    const two = s.slice(i, i + 2);
    if (two === '!=' && (s[i - 1] !== ' ' || s[i + 2] !== ' ')) return null;
    if (['<=', '>=', '!=', '**', '=='].includes(two)) { out.push({ op: two === '**' ? '^' : two === '==' ? '=' : two }); i += 2; continue; }
    if ('+-*^()=<>'.includes(c)) { out.push({ op: c }); i++; continue; }
    if (c === '×' || c === 'x' || c === '·') { out.push({ op: '*' }); i++; continue; }
    if (c === '−' || c === '–') { out.push({ op: '-' }); i++; continue; }
    if (c === '≤') { out.push({ op: '<=' }); i++; continue; }
    if (c === '≥') { out.push({ op: '>=' }); i++; continue; }
    if (c === '≠') { out.push({ op: '!=' }); i++; continue; }
    return null;
  }
  return out.length > MAX_TOKENS ? (() => { throw new Big(); })() : out;
}
const cap = v => { if ((v < 0n ? -v : v).toString().length > MAX_RESULT_DIGITS) throw new Big(); return v; };
function parse(toks) {
  let p = 0;
  const peek = () => toks[p], eat = op => (toks[p] && toks[p].op === op ? (p++, true) : false);
  const atom = () => {
    if (eat('(')) { const v = sum(); if (!eat(')')) throw new SyntaxError(); return v; }
    const t = toks[p++]; if (!t || t.n === undefined) throw new SyntaxError(); return t.n;
  };
  const unary = () => (eat('-') ? cap(-unary()) : pow());
  const pow = () => { const b = atom(); if (eat('^')) { const e = unary(); if (e < 0n) throw new Frac(); if (e > BigInt(MAX_POW)) throw new Big();
    const bits = (b < 0n ? -b : b).toString(2).length; if (bits * Number(e) > MAX_RESULT_DIGITS * 3.33) throw new Big(); return cap(b ** e); } return b; };
  const prod = () => { let v = unary(); while (peek() && peek().op === '*') { p++; v = cap(v * unary()); } return v; };
  const sum = () => { let v = prod(); while (peek() && (peek().op === '+' || peek().op === '-')) { const o = toks[p++].op; v = cap(o === '+' ? v + prod() : v - prod()); } return v; };
  const left = sum(), rel = peek() && ['=', '<', '>', '<=', '>=', '!='].includes(peek().op) ? toks[p++].op : null;
  if (!rel) throw new SyntaxError();
  const right = sum();
  if (p !== toks.length) throw new SyntaxError();
  const holds = { '=': left === right, '<': left < right, '>': left > right, '<=': left <= right, '>=': left >= right, '!=': left !== right }[rel];
  return { holds, left, right, rel };
}
export function arith(text) {
  const s = String(text).replace(/\s+/g, ' ').replace(/[.?]+$/, '').trim();
  let toks;
  try { toks = lex(s); } catch (e) { return { why: 'too big to check here (whole numbers up to 60 digits, powers up to 512, answers up to 4000 digits)' }; }
  if (!toks || !toks.length) return { why: 'not plain arithmetic' };
  try {
    const r = parse(toks);
    const form = toks.map(t => (t.n !== undefined ? t.n.toString() : t.op)).join(' ');
    return { holds: r.holds, form, value: `${r.left} ${r.rel} ${r.right}`.slice(0, 200) };
  } catch (e) {
    if (e instanceof Frac) return { why: 'a negative power is a fraction, and this checker works with whole numbers only' };
    return { why: e instanceof Big ? 'too big to check here (whole numbers up to 60 digits, powers up to 512, answers up to 4000 digits)' : 'not plain arithmetic' };
  }
}

const PASTE_DEBRIS = /[­​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;
export async function checkPublic(text, facts, runId) {
  const claim = String(text ?? '').replace(PASTE_DEBRIS, '');
  if (!claim.trim()) return { error: 'Type a claim to check.' };
  if ([...claim].length > MAX_CLAIM) return { error: `That is ${[...claim].length} characters; the limit is ${MAX_CLAIM}. Send one shorter claim.` };
  const n = norm(claim);
  const f = (facts || []).find(x => norm(x.claim) === n);
  if (f) {
    const check = `library:${f.id}`, words = f.claim_label || 'NOT CHECKED';
    const rec = await receipt(f.claim, f.label, check, runId, JSON.stringify({ id: f.id, label: f.label, claim_label: words, checked_by: f.checked_by }));
    return { kind: 'library', label: f.label, words_label: words, id: f.id, checked_by: f.checked_by, link: f.link,
      plain: `This is fact "${f.id}" in the library. The math part is ${f.label}, checked by ${f.checked_by} when it was added. The words around it are ${words}.`, receipt: rec };
  }
  const two = /\b\d{4}-\d{1,2}-\d{1,2}\b|(?<![\d\s-])\d{1,2}-\d{2}(?![\d-])/.test(claim) ? 'it looks like a date (2024-01-15, 12-25), which reads two ways'
    : /(?<![\d,.])0\d*,\d/.test(claim) ? 'a comma after a leading zero (0,500) could be a decimal comma or a thousands group'
    : /(?<![\d.])0\s*(\^|\*\*)\s*0(?![\d.])/.test(claim) ? '0^0 is 1 by one convention and has no value by another' : '';
  const a = two ? { why: two } : arith(claim.replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)));
  if (a.form) {
    const label = a.holds ? LABELS.PROVEN : LABELS.FALSIFIED;
    const rec = await receipt(a.form, label, 'arith:bigint-v1', runId, a.value);
    return { kind: 'arith', label, form: a.form, plain: a.holds ? 'Exact whole-number arithmetic: this is true as written.' : 'Exact whole-number arithmetic: this is false as written.', receipt: rec };
  }
  return { kind: 'none', label: LABELS.NOT, plain: `Not checked: ${a.why}. Not checked never means false. It only means this checker cannot check it. Try an exact fact from the library, or whole-number arithmetic like 2^10 = 1024.` };
}

export const logRow = (r, t) => ({ t, kind: r.kind, ...r.receipt });
export async function verifyRow(row, facts) {
  if (!row || typeof row !== 'object') return false;
  const { t, kind, sha256, ...rest } = row;
  if (typeof t !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(t)) return false;
  if (kind === 'arith') {
    if (rest.check !== 'arith:bigint-v1') return false;
    const a = arith(rest.claim); if (!a.form || a.form !== rest.claim || (a.holds ? 'PROVEN' : 'FALSIFIED') !== rest.label) return false;
    if ((await receipt(a.form, rest.label, rest.check, rest.run_id, a.value)).sha256 !== sha256) return false;
  } else if (kind === 'library') {
    const f = (facts || []).find(x => `library:${x.id}` === rest.check);
    if (!f || f.claim !== rest.claim || f.label !== rest.label) return false;
    const out = JSON.stringify({ id: f.id, label: f.label, claim_label: f.claim_label || 'NOT CHECKED', checked_by: f.checked_by });
    if ((await receipt(f.claim, f.label, rest.check, rest.run_id, out)).sha256 !== sha256) return false;
  } else return false;
  return true;
}
export async function tally(rows, facts) {
  const out = { checks: 0, proven: 0, falsified: 0, library: 0, arithmetic: 0, days: 0, rejected: 0, first: null, last: null };
  const days = new Set(), seen = new Set(), list = rows || [];
  const good = await Promise.all(list.map(r => verifyRow(r, facts)));
  for (const [k, r] of list.entries()) {
    if (!good[k] || seen.has(r.run_id)) { out.rejected++; continue; }
    seen.add(r.run_id);
    out.checks++; r.label === 'FALSIFIED' ? out.falsified++ : out.proven++; r.kind === 'arith' ? out.arithmetic++ : out.library++;
    days.add(r.t.slice(0, 10)); out.first = out.first && out.first < r.t ? out.first : r.t; out.last = out.last && out.last > r.t ? out.last : r.t;
  }
  out.days = days.size;
  return out;
}
