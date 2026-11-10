const FILLER = new Set(['is', 'are', 'the', 'an', 'of', 'to', 'in', 'on', 'and', 'or', 'it', 'its', 'that', 'this', 'what', 'which',
  'does', 'do', 'how', 'why', 'true', 'problem', 'theorem', 'fact']);
const stem = w => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
export const words = s => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 1);
export const SHOWN = 6;

export function search(q, facts) {
  const typed = words(q), kept = typed.filter(w => !FILLER.has(w));
  const want = (kept.length ? kept : typed).map(stem);
  if (!want.length || (!kept.length && /\d/.test(q))) return { hits: [], total: 0 };
  const all = facts.filter(f => {
    const have = words(`${f.claim} ${f.checked_as} ${f.theorem || ''}`).map(stem);
    return want.every(w => have.some(h => h.startsWith(w)));
  });
  return { hits: all.slice(0, SHOWN), total: all.length };
}

export function related(q, facts) {
  const want = [...new Set(words(q).filter(w => !FILLER.has(w) && !/^\d+$/.test(w)).map(stem))];
  if (want.length < 2) return [];
  return facts.map(f => {
    const have = words(`${f.claim} ${f.checked_as || ''} ${f.theorem || ''}`).map(stem);
    return { f, n: want.filter(w => have.some(h => h.startsWith(w))).length };
  }).filter(x => x.n >= 2 && 2 * x.n >= want.length).sort((a, b) => b.n - a.n).slice(0, 3).map(x => x.f);
}
