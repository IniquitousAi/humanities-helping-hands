import { expr, run, PROVEN } from './checker.js';
import { findClaims } from './finder.js';

const ASK = /^\s*(?:what(?:'s| is| are| does)|how much (?:is|are|does)|calculate|compute|work out|solve)\s+(.+?)\s*(?:equal|make|come to)?\s*\?*\s*$/i;
const SIGNS = [[/\bmultiplied by\b|\btimes\b|×|\bx\b(?=\s*\d)/gi, '*'], [/\bdivided by\b|\bover\b|÷/gi, '/'], [/\bplus\b/gi, '+'],
  [/\bminus\b|−/gi, '-'], [/\bto the power of\b|\braised to\b/gi, '^'], [/\bsquared\b/gi, '^2'], [/\bcubed\b/gi, '^3']];

export function mathAnswer(text) {
  const m = String(text || '').match(ASK);
  if (!m) return null;
  let e = m[1].replace(/\s*(equal|equals|make|come to)\s*$/i, '');
  for (const [re, s] of SIGNS) e = e.replace(re, ` ${s} `);
  e = e.replace(/\s+/g, ' ').replace(/\s*\^\s*/g, '^').trim();
  if (!/\d/.test(e) || !/[-+*/^!%]/.test(e) || /[A-Za-z]/.test(e.replace(/\bmod\b/g, ''))) return null;
  try {
    const v = expr(e);
    if (!v.exact) return null;
    const claim = `${e} = ${written(v.lo)}`;
    const found = findClaims(claim);
    return found.length === 1 && run(found[0].form, found[0].said)[0] === PROVEN ? claim : null;
  } catch { return null; }
}

function written(q) {
  if (q.int) return String(q.n);
  let d = q.d, k = 0n; while (d % 2n === 0n) { d /= 2n; k++; } let j = 0n; while (d % 5n === 0n) { d /= 5n; j++; }
  if (d !== 1n) return `${q.n}/${q.d}`;
  const places = k > j ? k : j, scaled = q.n * 10n ** places / q.d, neg = scaled < 0n, a = (neg ? -scaled : scaled).toString().padStart(Number(places) + 1, '0');
  return `${neg ? '-' : ''}${a.slice(0, a.length - Number(places))}.${a.slice(a.length - Number(places))}`;
}
