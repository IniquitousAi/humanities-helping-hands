const NUTRIENT = [['kcal', /\b(calories|calorie|kcal|cal)\b/i], ['protein', /\bproteins?\b/i], ['fiber', /\b(dietary )?fib(er|re)s?\b/i],
  ['sugar', /\bsugars?\b/i], ['carbs', /\b(carbs?|carbohydrates?)\b/i], ['cholesterol', /\bcholesterol\b/i], ['fat', /\b(total )?fats?\b/i],
  ['sodium', /\bsodium\b/i], ['calcium', /\bcalcium\b/i], ['iron', /\biron\b/i], ['potassium', /\bpotassium\b/i],
  ['vitamin c', /\bvitamin c\b/i], ['caffeine', /\bcaffeine\b/i]];
const UNIT = { g: 1, gram: 1, grams: 1, mg: 1e-3, milligram: 1e-3, milligrams: 1e-3 };
const NUM = /(about|around|roughly|approximately|nearly|almost|over|more than|at least|under|less than|up to)?\s*(\d+(?:\.\d+)?)\s*(g|grams?|mg|milligrams?|kcal|calories|calorie|cal)\b/i;
const STOP = new Set(('a an the one of in on at to for from by with and or is are was were has have had contains contain gives give provides '
  + 'provide about around roughly approximately nearly almost over more than at least under less up per serving grams gram g mg milligrams '
  + 'milligram kcal calories calorie cal protein proteins fat fats carbs carb carbohydrate carbohydrates sugar sugars fiber fibre dietary '
  + 'sodium calcium iron potassium vitamin c caffeine cholesterol total it its this that typical average whole plain only just '
  + 'cup cups tablespoon tbsp teaspoon tsp slice ounce oz fl glass').split(' '));
const SIZE = /\b(small|medium|large|extra large|jumbo)\b/i;
const COOK = /\b(raw|boiled|fried|scrambled|poached|baked|roasted|grilled|cooked|steamed|dried|canned|frozen|brewed|skim|whole|white|brown|wheat)\b/gi;
const stem = w => w.length > 3 ? w.replace(/(ies)$/, 'y').replace(/(oes|ches|shes|sses)$/, m => m.slice(0, -2)).replace(/s$/, '') : w;
const words = s => (String(s).toLowerCase().match(/[a-z]+/g) || []);

function pickFood(foods, claim) {
  const want = words(claim).filter(w => !STOP.has(w) && !SIZE.test(w) && !/^(raw|boiled|fried|scrambled|poached|baked|roasted|grilled|cooked|steamed|dried|canned|frozen|brewed|skim|whole|white|brown|wheat)$/.test(w)).map(stem);
  if (!want.length) return null;
  const cook = (String(claim).toLowerCase().match(COOK) || []);
  let best = null, bestScore = -1;
  for (const f of foods) {
    const parts0 = f[1].split(','), head = words(/^Beverages$/i.test(parts0[0]) ? parts0[1] || '' : parts0[0]).map(stem);
    if (!want.every(w => head.includes(w)) || head.length > want.length + 1) continue;
    const rest = f[1].toLowerCase(), parts = f[1].split(',').length;
    let score = 100 - parts * 3 - (head.length - want.length) * 10;
    for (const c of cook) score += rest.includes(c) ? 20 : -5;
    if (!cook.length && /\b(raw|fresh)\b/.test(rest)) score += 15;
    const said = String(claim).toLowerCase();
    for (const p of rest.match(/\b(frozen|salted|pasteurized|dried|dry|dehydrated|powder|canned|imitation|substitute|mixture|without|instant|decaffeinated|chocolate|fortified)\b/g) || [])
      if (!said.includes(p)) score -= 25;
    if (score > bestScore) { best = f; bestScore = score; }
  }
  return best;
}

function amounts(food, claim) {
  const s = String(claim).toLowerCase(), all = food[3];
  if (/\b(per|in|every|each)\s+100\s*(g|grams)\b|\b100\s*(g|grams)\s+of\b/.test(s)) return [['100 g', 100]];
  const cup = s.match(/\b(a|one|1)\s+(cup|tablespoon|tbsp|teaspoon|tsp|slice|ounce|oz|fl oz|glass)\b/);
  if (cup) { const u = { tablespoon: 'tbsp', teaspoon: 'tsp', ounce: 'oz', glass: 'cup' }[cup[2]] || cup[2]; const p = all.filter(([l]) => new RegExp(`^1 ${u}\\b`).test(l)); return p.length ? p.slice(0, 1) : null; }
  const size = s.match(SIZE);
  if (size) { const p = all.filter(([l]) => new RegExp(`^1 ${size[1]}\\b`).test(l)); return p.length ? p.slice(0, 1) : null; }
  if (/\b(a|an|one|1)\s/.test(s)) {
    const p = all.filter(([l]) => /^1 (extra small|small|medium|large|extra large|jumbo|whole|fruit|egg|item|nlea serving)\b/.test(l));
    return p.length ? p : null;
  }
  return null;
}

export const looksFood = claim => NUM.test(claim) && NUTRIENT.some(([, re]) => re.test(claim));

const fmt = x => +x.toPrecision(x < 1 ? 2 : 3);

export function checkFood(claim, data) {
  const s = String(claim || ''), nut = NUTRIENT.find(([, re]) => re.test(s)), m = s.match(NUM);
  if (!nut || !m || !data) return null;
  const key = nut[0], unitWord = m[3].toLowerCase(), said = +m[2], hedge = (m[1] || '').toLowerCase();
  const isCal = /^(kcal|calories|calorie|cal)$/.test(unitWord);
  if (isCal !== (key === 'kcal')) return null;
  const food = pickFood(data.foods, s.replace(m[0], ' '));
  if (!food || food[2][key] === undefined) return null;
  const portions = amounts(food, s);
  if (!portions) return null;
  const unit = data.units[key], toUnit = isCal ? 1 : UNIT[unitWord] / UNIT[unit];
  const want = said * toUnit, per100 = food[2][key];
  const tol = /about|around|roughly|approximately|nearly|almost/.test(hedge) ? 0.2 : 0.1;
  const fits = v => /over|more than|at least/.test(hedge) ? v >= want : /under|less than|up to/.test(hedge) ? v <= want
    : Math.abs(v - want) <= Math.max(tol * v, 0.05 * (unit === 'g' ? 1 : 10));
  const vals = portions.map(([label, g]) => ({ label, g, v: per100 * g / 100 })), hit = vals.filter(x => fits(x.v)).sort((a, b) => Math.abs(a.v - want) - Math.abs(b.v - want))[0];
  const show = x => `${x.label === '100 g' ? '100 g' : `${x.label} (${x.g} g)`} has ${fmt(x.v)} ${key === 'kcal' ? 'calories' : `${unit} of ${key}`}`;
  const ref = { id: food[0], name: food[1], url: data.url + food[0] };
  if (hit) return { verdict: 'CHECKED', why: `USDA FoodData Central: ${food[1]}, ${show(hit)}`, food: ref, value: fmt(hit.v), basis: hit.label };
  const lo = vals.reduce((a, b) => (a.v < b.v ? a : b)), hi = vals.reduce((a, b) => (a.v > b.v ? a : b));
  const range = lo === hi ? show(lo) : `${show(lo)} up to ${show(hi)}`;
  return { verdict: 'GUESS', why: `USDA FoodData Central does not back ${m[0].trim()}: ${food[1]}, ${range}`, food: ref, value: fmt(lo.v), basis: lo.label };
}
