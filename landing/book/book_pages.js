
export const label = f => ({ tag: 'PROVEN', by: f.how === 'lean' ? 'by Lean, a proof checker' : 'by the checker on the front page' });
export const receipt = f => `/atlas/list/#${encodeURIComponent(f.id)}`;

function tailNumber(s) {
  const m = /(?:~=|=)\s*(-?[\d.]+)\s*$/.exec(s) || /^\s*(-?[\d.]+)\s*$/.exec(s);
  return m ? Number(m[1]) : null;
}

export function visual(f) {
  const a = String(f.answer).trim();
  if (f.source === 'mathlib') return { kind: 'lean', text: a };
  const frac = /^(\d+)\/(\d+)$/.exec(a);
  if (frac) {
    const v = Number(frac[1]) / Number(frac[2]);
    if (v > 0 && v < 1) return { kind: 'odds', num: frac[1], den: frac[2], v };
  }
  if (/^\d{16,}$/.test(a)) return { kind: 'digits', digits: a.length, head: a.slice(0, 12) };
  const n = tailNumber(a);
  if (n !== null && n > 0 && Number.isFinite(n)) {
    const left = a.replace(/\s*(?:~=|=)\s*-?[\d.]+\s*$/, '');
    return { kind: 'scale', n, exact: !/~=/.test(a), left: left === a ? '' : left };
  }
  return { kind: 'plate', text: a };
}

export function build(data) {
  const facts = data.facts.map((f, i) => ({ f, i })).sort((x, y) => x.f.rung - y.f.rung || x.i - y.i).map(x => x.f);
  const chapters = [], pages = [];
  facts.forEach(f => {
    const n = pages.length + 1;
    let ch = chapters[chapters.length - 1];
    if (!ch || ch.rung !== f.rung) chapters.push(ch = { rung: f.rung, name: data.rungs[f.rung], first: n, count: 0 });
    ch.count++;
    pages.push({ n, id: f.id, chapter: ch.name, opens: ch.first === n, star: !!f.star, claim: f.claim, levels: f.levels || null, answer: f.answer,
      proof: f.proof, notProven: f.notProven || '', label: label(f), receipt: receipt(f), visual: visual(f) });
  });
  return { chapters, pages };
}
