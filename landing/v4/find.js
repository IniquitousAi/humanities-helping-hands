export const FIELDS = [['claim', 'the claim'], ['theorem', 'the theorem name'], ['checked_as', 'the statement checked'], ['credit', 'the credit'], ['checked_by', 'who checked it']];
const TOKEN = /[a-z0-9]+/g;
const low = s => String(s ?? '').toLowerCase();
export const words = q => low(q).match(TOKEN) || [];

export function near(a, b) {
  if (a === b) return true;
  const la = a.length, lb = b.length; if (Math.abs(la - lb) > 1) return false;
  let i = 0; while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return la < lb ? a.slice(i) === b.slice(i + 1) : a.slice(i + 1) === b.slice(i);
}
export function kind(w, t, typos) {
  if (t === w) return 0;
  if (t.startsWith(w)) return 1;
  if (w.length >= 3 && t.includes(w)) return 2;
  if (typos && w.length >= 4 && t[0] === w[0] && (near(w, t) || near(w, t.slice(0, w.length)) || near(w, t.slice(0, w.length + 1)) || near(w, t.slice(0, w.length - 1)))) return 3;
  return -1;
}
export function index(facts, fields = FIELDS) {
  return facts.map((fact, at) => ({ fact, at, toks: fields.map(([k]) => low(fact[k]).match(TOKEN) || []) }));
}
function best(w, row, typos) {
  let b = null;
  for (let f = 0; f < row.toks.length; f++) {
    const ts = row.toks[f];
    for (let i = 0; i < ts.length; i++) {
      const k = kind(w, ts[i], typos); if (k < 0) continue;
      const s = [k === 3 ? 1 : 0, f, k, i];
      if (!b || cmp(s, b) < 0) b = s;
      if (k === 0) break;
    }
    if (b && b[0] === 0 && b[2] === 0) break;
  }
  return b;
}
const cmp = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };

export function rank(rows, q) {
  const ws = words(q);
  if (!ws.length) return { rows: rows.map(r => ({ fact: r.fact, field: 0 })), close: false };
  for (const typos of [false, true]) {
    const out = [];
    for (const r of rows) {
      const score = [0, 0, 0, 0]; let ok = true, top = 99;
      for (const w of ws) { const b = best(w, r, typos); if (!b) { ok = false; break; } for (let i = 0; i < 4; i++) score[i] += b[i]; top = Math.min(top, b[1]); }
      if (ok) out.push({ fact: r.fact, field: top, score, at: r.at });
    }
    if (out.length) return { rows: out.sort((a, b) => cmp(a.score, b.score) || a.at - b.at), close: typos };
  }
  return { rows: [], close: false };
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function mark(text, q, typos) {
  const ws = words(q), s = String(text ?? ''); if (!ws.length) return esc(s);
  let out = '', last = 0;
  for (const m of low(s).matchAll(TOKEN)) {
    let from = -1, len = 0;
    for (const w of ws) {
      const k = kind(w, m[0], typos); if (k < 0) continue;
      const a = k === 3 ? 0 : m[0].indexOf(w), n = k === 3 ? m[0].length : w.length;
      if (n > len) { from = a; len = n; }
    }
    if (from < 0) continue;
    const a = m.index + from;
    out += esc(s.slice(last, a)) + '<mark>' + esc(s.slice(a, a + len)) + '</mark>'; last = a + len;
  }
  return out + esc(s.slice(last));
}
