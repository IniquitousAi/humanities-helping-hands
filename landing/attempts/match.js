const SYN = [
  [/p\s*(≠|!=|=\/=|<>|\bneq\b|\bis not\b|\bnot equals?\b|\bdoes not equal\b|\bnot equal to\b)\s*np/g, ' pneqnp '],
  [/p\s*(=|\bequals?\b|\bis\b)\s*np/g, ' peqnp '],
  [/\bunsatisfiab\w*/g, ' unsat '], [/\bsatisfiab\w*/g, ' sat '], [/\bpolynomial\w*/g, ' poly '],
  [/\blinear program\w*/g, ' lp '], [/\bnp.complete\w*/g, ' npcomplete '], [/\btravel+ing salesm[ae]n\b/g, ' tsp '],
];
const STOP = new Set('the and for that with from are not its this into how use using via our who was has have can will all any one'.split(' '));
const stem = w => w.length > 4 ? w.replace(/(ies|es|s)$/, '') : w;
export const tokens = s => {
  let t = String(s).toLowerCase().replace(/[’']/g, '');
  for (const [re, to] of SYN) t = t.replace(re, to);
  return t.split(/[^a-z0-9]+/).filter(w => w.length > 1 && !STOP.has(w)).map(stem);
};

function near(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let low = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); low = Math.min(low, cur[j]);
    }
    if (low > max) return false; prev = cur;
  }
  return prev[b.length] <= max;
}

function fit(q, w) {
  if (q === w) return 1;
  if (q.length >= 3 && w.startsWith(q)) return 0.8;
  if (q.length >= 4 && near(q, w, q.length >= 7 ? 2 : 1)) return 0.6;
  return 0;
}

export function index(rows) {
  const vocab = new Map(), out = rows.map(r => ({ title: new Set(tokens(r.title)), body: new Set(tokens(r.text)) }));
  for (const r of out) for (const w of [...r.title, ...r.body]) vocab.set(w, 0);
  return { rows: out, vocab: [...vocab.keys()] };
}
export function search(ix, query) {
  const qs = [...new Set(tokens(query))];
  if (!qs.length) return [];
  const best = qs.map(q => { const m = new Map(); for (const w of ix.vocab) { const f = fit(q, w); if (f) m.set(w, f); } return m; });
  const hits = [];
  ix.rows.forEach((r, i) => {
    let score = 0, got = 0;
    for (const m of best) {
      let s = 0;
      for (const [w, f] of m) { if (r.title.has(w)) s = Math.max(s, f * 1.5); else if (r.body.has(w)) s = Math.max(s, f); }
      score += s; got += s > 0;
    }
    if (got && got * 2 >= qs.length) hits.push({ i, score: score + got });
  });
  return hits.sort((a, b) => b.score - a.score || a.i - b.i);
}
