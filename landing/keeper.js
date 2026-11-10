const PLACE = [['freezer', /\b(freezer|frozen|freeze|freezing)\b/i], ['fridge', /\b(fridge|refrigerator|refrigerated|refrigerate|refrigeration)\b/i],
  ['pantry', /\b(pantry|cupboard|room temperature|counter|shelf)\b/i]];
const DAYS = { day: 1, week: 7, month: 30, year: 365 };
const TIME = /\b(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|twelve)(?:\s*(?:to|-|–|or)\s*(\d+(?:\.\d+)?|two|three|four|five|six|seven|eight|nine|ten|twelve))?\s*(day|week|month|year)s?\b/i;
const WORD = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12 };
const NOT = /\b(not recommended|(should|can)(not|n't| not) be (frozen|refrigerated)|(do not|don't|never) (freeze|refrigerate))\b/i;
const num = w => WORD[String(w).toLowerCase()] ?? +w;
const stem = w => w.length > 3 ? w.replace(/(ies)$/, 'y').replace(/s$/, '') : w;
const words = s => (String(s).toLowerCase().match(/[a-z]+/g) || []).map(stem);

export const looksKeeper = claim => PLACE.some(([, re]) => re.test(claim)) && (TIME.test(claim) || NOT.test(claim));

const FILLER = new Set(('a an the in on of for to or and with without such as at it its they you your is are be will can should '
  + 'keep keeps kept last lasts stay stays good safe safely fresh about up only around usually typically up until '
  + 'fridge refrigerator refrigerated refrigerate freezer frozen freeze pantry cupboard room temperature counter shelf '
  + 'day week month year not recommended never do don').split(' ').map(stem));

function pickProduct(products, claim, place) {
  const said = [...new Set(words(claim))].filter(w => !FILLER.has(w));
  if (!said.length) return null;
  let best = null, bestScore = -Infinity;
  for (const p of products) {
    if (!p[4][place]) continue;
    const vocab = new Set(words(`${p[1]} ${p[2]} ${p[3]}`));
    if (!said.every(w => vocab.has(w))) continue;
    const named = new Set(words(`${p[1]} ${p[2]}`).filter(w => !FILLER.has(w)));
    const score = said.filter(w => named.has(w)).length * 10 - [...named].filter(w => !said.includes(w)).length;
    if (score > bestScore) { best = p; bestScore = score; }
  }
  return best;
}

const span = (a, b, u) => `${a === b ? a : `${a} to ${b}`} ${u.toLowerCase().replace(/s$/, '')}${b === 1 ? '' : 's'}`;

export function checkKeeper(claim, data) {
  const s = String(claim || ''), placeHit = PLACE.find(([, re]) => re.test(s));
  if (!placeHit || !data) return null;
  const place = placeHit[0], t = s.match(TIME), not = NOT.test(s);
  if (!t && !not) return null;
  const p = pickProduct(data.products, t ? s.replace(t[0], ' ') : s, place);
  if (!p) return null;
  const [min, max, unit, tip] = p[4][place], name = p[2] ? `${p[1]}, ${p[2]}` : p[1];
  const where = { fridge: 'in the fridge', freezer: 'in the freezer', pantry: 'in the pantry' }[place];
  const usda = min == null ? unit.toLowerCase() : span(min, max, unit);
  const ref = { id: p[0], name }, src = `USDA FSIS FoodKeeper (product ${p[0]}, data from Sept 2018): ${name}, ${usda} ${where}${tip ? ` (${tip})` : ''}`;
  if (min == null) {
    const agrees = not && /not recommended/i.test(unit);
    return { verdict: agrees ? 'CHECKED' : 'GUESS', why: agrees ? src : `USDA FSIS FoodKeeper does not back that: ${src.slice(src.indexOf(': ') + 2)}`, product: ref, place, usda };
  }
  if (!t) return { verdict: 'GUESS', why: `USDA FSIS FoodKeeper gives a time, not a no: ${src.slice(src.indexOf(': ') + 2)}`, product: ref, place, usda };
  const per = DAYS[t[3].toLowerCase()], lo = num(t[1]) * per, hi = num(t[2] ?? t[1]) * per, u = DAYS[String(unit).toLowerCase().replace(/s$/, '')];
  if (!u) return null;
  const inside = lo >= min * u && hi <= max * u;
  return { verdict: inside ? 'CHECKED' : 'GUESS', why: inside ? src : `USDA FSIS FoodKeeper does not back ${t[0].trim()}: ${src.slice(src.indexOf(': ') + 2)}`, product: ref, place, usda };
}
