import { run as settleForm } from './checker.js';
const MAX_CLAIMS = 40;

const UNITS = [
  ['length', 1, ['m', 'meter', 'meters', 'metre', 'metres']], ['length', 1000, ['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres']],
  ['length', 0.01, ['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres']], ['length', 0.001, ['mm', 'millimeter', 'millimeters']],
  ['length', 1609.344, ['mi', 'mile', 'miles']], ['length', 0.9144, ['yd', 'yard', 'yards']], ['length', 0.3048, ['ft', 'foot', 'feet']],
  ['length', 0.0254, ['in', 'inch', 'inches']],
  ['mass', 1, ['kg', 'kilogram', 'kilograms']], ['mass', 0.001, ['g', 'gram', 'grams']], ['mass', 0.45359237, ['lb', 'lbs', 'pound', 'pounds']],
  ['mass', 0.028349523125, ['oz', 'ounce', 'ounces']], ['mass', 0.000001, ['mg', 'milligram', 'milligrams']], ['mass', 1000, ['tonne', 'tonnes']],
  ['volume', 1, ['l', 'liter', 'liters', 'litre', 'litres']], ['volume', 0.001, ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres']],
  ['volume', 3.785411784, ['gal', 'gallon', 'gallons']], ['volume', 0.946352946, ['qt', 'quart', 'quarts']],
  ['volume', 0.473176473, ['pt', 'pint', 'pints']], ['volume', 0.2365882365, ['cup', 'cups']],
  ['volume', 0.01478676478125, ['tbsp', 'tablespoon', 'tablespoons']], ['volume', 0.00492892159375, ['tsp', 'teaspoon', 'teaspoons']],
  ['speed', 0.44704, ['mph']], ['speed', 1, ['m/s']], ['speed', 1 / 3.6, ['km/h', 'kph']],
  ['time', 1, ['s', 'sec', 'second', 'seconds']], ['time', 60, ['min', 'minute', 'minutes']], ['time', 3600, ['h', 'hr', 'hour', 'hours']],
  ['time', 86400, ['day', 'days']], ['time', 604800, ['wk', 'week', 'weeks']], ['time', 0.001, ['ms', 'millisecond', 'milliseconds']],
  ['area', 1, ['m²', 'm2', 'sq m', 'square meter', 'square meters', 'square metre', 'square metres']],
  ['area', 1000000, ['km²', 'km2', 'sq km', 'square kilometer', 'square kilometers', 'square kilometre', 'square kilometres']],
  ['area', 0.0001, ['cm²', 'cm2', 'sq cm', 'square centimeter', 'square centimeters', 'square centimetre', 'square centimetres']],
  ['area', 0.09290304, ['ft²', 'ft2', 'sq ft', 'sq. ft', 'sq. ft.', 'square foot', 'square feet']],
  ['area', 0.00064516, ['in²', 'sq in', 'square inch', 'square inches']], ['area', 0.83612736, ['yd²', 'sq yd', 'square yard', 'square yards']],
  ['area', 2589988.110336, ['mi²', 'sq mi', 'square mile', 'square miles']],
  ['area', 4046.8564224, ['acre', 'acres']], ['area', 10000, ['ha', 'hectare', 'hectares']],
  ['volume', 1000, ['m³', 'm3', 'cubic meter', 'cubic meters', 'cubic metre', 'cubic metres']],
  ['volume', 0.001, ['cc', 'cm³', 'cm3', 'cubic centimeter', 'cubic centimeters', 'cubic centimetre', 'cubic centimetres']],
  ['volume', 28.316846592, ['ft³', 'cu ft', 'cubic foot', 'cubic feet']], ['volume', 764.554857984, ['yd³', 'cu yd', 'cubic yard', 'cubic yards']], ['mass', 6.35029318, ['stone', 'stones']],
];
const EXACT = { 0.2365882365: '0.2365882365', 0.946352946: '0.946352946', 0.473176473: '0.473176473', 3.785411784: '3.785411784',
  0.01478676478125: '0.01478676478125', 0.00492892159375: '0.00492892159375', 0.028349523125: '0.028349523125', [1 / 3.6]: '(1 / 3.6)' };
const UNIT = new Map(); for (const [kind, f, names] of UNITS) for (const n of names) UNIT.set(n, { kind, f: EXACT[f] || String(f) });
const ALT = { pint: [0.56826125], quart: [1.1365225], gallon: [4.54609], cup: [0.25, 0.284130625, 0.24], tablespoon: [0.02],
  ounce: [0.0311034768], pound: [0.3732417216] };
for (const [k, names] of [['pint', ['pt', 'pints']], ['quart', ['qt', 'quarts']], ['gallon', ['gal', 'gallons']], ['cup', ['cups']], ['tablespoon', ['tbsp', 'tablespoons']],
  ['ounce', ['oz', 'ounces']], ['pound', ['lb', 'lbs', 'pounds']]])
  for (const n of names) ALT[n] = ALT[k];
const TEMP = { f: 'F', '°f': 'F', fahrenheit: 'F', 'degrees fahrenheit': 'F', c: 'C', '°c': 'C', celsius: 'C', 'degrees celsius': 'C' };

const NUM = String.raw`\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?`;
const SCALES = { thousand: 3, million: 6, billion: 9, trillion: 12 };
const UNIT_WORD = String.raw`°\s?[FC]|degrees\s+(?:fahrenheit|celsius)|fahrenheit|celsius|fl\.?\s?oz|km\/h|m\/s|(?:sq\.?|square|cubic|cu)\s+[a-zA-Z]+\.?|[a-zA-Z]+[²³]|(?:km|cm|m|ft)[23](?!\w)|[a-zA-Z]+`;
const QTY = String.raw`((?:(?<![\w.])-\s?)?(?:${NUM}))(?:\s+(thousand|million|billion|trillion))?\s*(${UNIT_WORD})`;
const LINK = String.raw`\s*(?:,\s*)?(?:\(|is|are|equals|=|≈|~|is\s+about|is\s+roughly|is\s+approximately|is\s+around|about|roughly|or\s+about|or\s+roughly|or|which\s+is\s+about|which\s+is|have|has|make|makes)\s*(?:about|roughly|approximately|around|nearly|~)?\s*`;
const OF = String.raw`(?:\s+of\s+[a-z]+)?(?:\s+a\s+(?:day|week|month|year))?`;
const CONVERSION = new RegExp(QTY + OF + LINK + QTY, 'gi');
const PREV = new RegExp(QTY + String.raw`\s*,?\s*(?:and\s+)?$`, 'i');
const NEXT = new RegExp(String.raw`^\s*,?\s*(?:and\s+)?` + QTY, 'i');

const plainNum = s => s.replace(/,/g, '');
const signedNum = s => { const v = plainNum(s).replace(/^-\s+/, '-'); return v.startsWith('-') ? `(${v})` : v; };
function qty(n, scale, unit) {
  if (/^M[a-zA-Z]?$/.test(unit) && UNIT.has(unit.toLowerCase())) return null;
  const u0 = unit.toLowerCase().replace(/\s+/g, ' ').replace('° ', '°'), u = UNIT.has(u0) ? u0 : u0.replace(/\.$/, '').replace(/^(sq|cu)\. ?/, '$1 '), t = TEMP[u];
  const k = scale ? SCALES[scale.toLowerCase()] : 0;
  const v = signedNum(n) + (k ? ` * 10^${k}` : '');
  const num = { n: Number(plainNum(n).replace(/\s/g, '')) * 10 ** k, d: (plainNum(n).split('.')[1] || '').length };
  return t ? { kind: 'temp', t, v, ...num } : UNIT.has(u) ? { ...UNIT.get(u), v, alt: ALT[u], ...num } : null;
}
const holds = (a, fa, b, fb) => Math.abs(a.n * fa / fb - b.n) <= 0.5 * 10 ** -b.d * (1 + 1e-9);
function conversion(a, b, change) {
  if (!a || !b || a.kind !== b.kind) return null;
  if (a.kind === 'temp') {
    if (a.t === b.t) return null;
    const r = a.t === 'F' ? 5 / 9 : 9 / 5, near = x => Math.abs(x - b.n) <= 0.5 * 10 ** -b.d * (1 + 1e-9);
    if (change && near(a.n * r) && !near(a.t === 'F' ? (a.n - 32) * r : a.n * r + 32)) return null;
    return a.t === 'F' ? `(${a.v} - 32) * 5 / 9 ~= ${b.v}` : `${a.v} * 9 / 5 + 32 ~= ${b.v}`;
  }
  if (a.f === b.f) return null;
  if ((a.alt || b.alt) && !holds(a, Number(a.f), b, Number(b.f))
    && (a.alt || [Number(a.f)]).concat(Number(a.f)).some(fa => (b.alt || [Number(b.f)]).concat(Number(b.f)).some(fb => holds(a, fa, b, fb)))) return null;
  return `${a.v} * ${a.f} / ${b.f} ~= ${b.v}`;
}

const SIDE = String.raw`(?:(?<![\d.)])-\s*)?(?:\(\s*(?:-\s*)?)?(?:${NUM})(?:\s*\^\s*\d+)*(?:\s*\)(?:\s*\^\s*\d+)*)?(?:\s*(?:[-+*/×÷x]|\^(?!\s*\d))\s*(?:-\s*)?(?:\(\s*(?:-\s*)?)?(?:${NUM})(?:\s*\^\s*\d+)*(?:\s*\)(?:\s*\^\s*\d+)*)?)*`;
const ARITH = new RegExp(String.raw`(${SIDE})\s*(=|<=|>=|<|>|≈|≠|\bis\s+(?:about|approximately|roughly|around)\b|\bis\b|\bequals\b|\bcomes?\s+to\b|\btotals?\b|\bwould\s+be\b|\bwill\s+be\b|\bwas\b|\bleaves\b|\bgives\b|\bare\b|\bwere\b)\s*(${SIDE})`, 'gi');
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MON_ = String.raw`(${MONTHS.join('|')}|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec)\.?`;
const DATE_ = String.raw`${MON_}\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*(\d{4}))?`;
const DATEX = String.raw`(?:${DATE_}|(\d{4})-(\d{1,2})-(\d{1,2})(?![\d-]))`;
const DEADLINE = new RegExp(String.raw`\b(\d{1,4})\s+(?:calendar\s+)?(days?|weeks?)\s+(after|from|before)\s+(?:(?:service|filing|entry|trial|judgment|notice|the\s+(?:hearing|order|filing|judgment|notice|petition|complaint|motion|scheduling\s+order))\s+(?:on|of|dated)\s+)?${DATEX}\s+(?:is|was|falls\s+on|lands\s+on|would\s+be|will\s+be|=)\s+(?:a\s+[a-z]+,\s+)?${DATEX}(?![\w])`, 'gi');
const iso = (m, d, y) => { const k = typeof m === 'number' ? m - 1 : MONTHS.findIndex(x => x.startsWith(m.toLowerCase().slice(0, 3))), t = new Date(Date.UTC(+y, k, +d));
  return k >= 0 && t.getUTCDate() === +d && t.getUTCMonth() === k && t.getUTCFullYear() === +y ? t.toISOString().slice(0, 10) : null; };
function deadline(m) {
  const [all, n, unit, dir, m1, d1, y1, Y1, M1, D1, m2, d2, y2, Y2, M2, D2] = m;
  if (/\b(?:business|court|working|judicial)\s+days?\b/i.test(m.input)) return null;
  const yr1 = y1 || Y1, yr2 = y2 || Y2;
  if (!(yr1 || yr2)) return null;
  const a = Y1 ? iso(+M1, D1, Y1) : iso(m1, d1, yr1 || yr2), b = Y2 ? iso(+M2, D2, Y2) : iso(m2, d2, yr2 || yr1);
  if (!a || !b) return null;
  return `${a} ${/before/i.test(dir) ? '-' : '+'} ${+n * (/^w/i.test(unit) ? 7 : 1)} days = ${b}`;
}
const PRIMEQ = new RegExp(String.raw`(${SIDE})\s+is\s+(not\s+)?(?:a\s+)?prime(?:\s+number)?`, 'gi');
const count = (s, c) => s.split(c).length - 1;
function balanced(s) {
  while (s.startsWith('(') && count(s, '(') > count(s, ')')) s = s.slice(1).trim();
  while (s.endsWith(')') && count(s, ')') > count(s, '(')) s = s.slice(0, -1).trim();
  return s;
}
const mathText = s => balanced(plainNum(s.replace(/×|(?<=\d)\s*x\s*(?=\d)/g, ' * ').replace(/÷/g, ' / ').replace(/\s+/g, ' ').trim()));

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
  'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const NUMWORD = new Map([...ONES.map((w, i) => [w, i]), ...Object.entries(TENS)]);
const OPWORDS = [[/\bmultiplied\s+by\b/gi, '*'], [/\bdivided\s+by\b/gi, '/'], [/\b(?:is\s+)?equal\s+to\b/gi, '='], [/\bequals\b/gi, '='],
  [/\bplus\b/gi, '+'], [/\bminus\b/gi, '-'], [/\btimes\b/gi, '*'],
  [new RegExp(String.raw`,?\s*\b(?:and\s+)?you(?:'ll|\s+will)?\s+get\b`, 'gi'), '='], [new RegExp(String.raw`\b(?:gives\s+you|makes)\b`, 'gi'), '=']];
const MATHY = /[-+*/=×÷%√]|\b(?:plus|minus|times|multiplied|divided|equals?|sum|product|percent|half|thirds?|quarters?|fourths?|fifths?|tenths?|split|shared|squared|simple\s+interest|treble[ds]?|trebled|tripled|doubled|halved|splitting|dividing|\d[\d,.]*\s+(?:an?|per|each)\s+(?:day|week|month|quarter|year)\s+(?:is|equals)|of\s+[$€£]?\d[\d,.]*\s+and\s+(?:[a-z]+\s+){1,3}of\s+[$€£]?\d[\d,.]*,?\s+(?:totals?|come|comes|are|is|makes?)|(?:\d[\d,.]*|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:hours?|hrs?|days?|weeks?|months?|years?|nights?|sessions?|visits?)(?:\s+of\s+[a-z]+)?\s+at\s+[$€£]?\d[\d,.]*(?:,?\s+which\s+is|\s*=|\s+is)|\d[\d,.]*\s+less\s+[$€£]?\d+(?![\d.,]*\s*(?:%|percent))|(?:add|multiply|divide|subtract|halve)\s+\d+|\d\/\d+\s+(?:contingency\s+)?(?:fee|share|commission|interest|cut|royalty)\s+on|\bat\s+[$€£]?\d[\d,.]*(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(?:hour|hr|mile|day|week|month|year|unit|item|page|copy|session|visit|night|share|gallon|liter|litre|ticket|seat|box)\b|\bat\s+[$€£]?\d[\d,.]*\s+each\b|each\s+of\s+(?:the\s+)?\d+|for\s+a\s+total\s+of\s+[$€£]?\d+|totall?ing\s+[$€£]?\d+|\d[\d,.]*(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(?:hours?|days?|weeks?|months?|years?)\s+(?:for|over)\s+\d+|\d\s+(?:hours?|hrs?|days?|weeks?|months?|units?|items?|pages?|copies|sessions?|visits?|nights?|shares?)\s*x\s*[$€£]?\d|mph|kph|kmh|miles?\s+(?:per|an|a)\s+hour|kilomet(?:er|re)s?\s+(?:per|an|a)\s+hour|there\s+(?:are|is)\s+\d[\d,.]*\s+[a-z]+\s+in|(?:has|contains|holds)\s+\d[\d,.]*\s+[a-z]+|\d[\d,.]*\s+[a-z]+\s+costs?\s+[$€£]?\d+|from\s+\d{1,2}(?::\d\d)?\s*(?:am|pm)\s+(?:to|until|till)\s+\d+|cubed|root|double|twice|triple|dozen|average|mean|difference|quotient)\b/i;
const BILL = String.raw`hours?|hrs?|miles?|days?|weeks?|months?|years?|units?|items?|pages?|copies|copy|sessions?|visits?|nights?|shares?|gallons?|liters?|litres?|tickets?|seats?|boxes|box`;
const same = (a, b) => { const s = w => w.toLowerCase().replace(/^hrs?$/, 'hour').replace(/^copies$/, 'copy').replace(/^boxes$/, 'box').replace(/^litres?$/, 'liter').replace(/s$/, ''); return s(a) === s(b); };
const N_ = String.raw`(\d[\d,]*(?:\.\d+)?)`, SHARE = { half: 2, third: 3, quarter: 4, fifth: 5, tenth: 10 };
const DIST = String.raw`miles?|mi|kilomet(?:er|re)s?|km`, SPEED = String.raw`miles?\s+(?:per|an|a)\s+hour|mph|mi\/h|kilomet(?:er|re)s?\s+(?:per|an|a)\s+hour|km\/h|kph|kmh`;
const sameDist = (d, s) => /^mi/i.test(d) === /^(?:mi|mph)/i.test(s);
const nearer = (p, x, y, down) => { const v = s => Number(s.replace(/,/g, '')), n = v(x), c = n * v(p) / 100, t = n + (down ? -c : c);
  return Math.abs(t - v(y)) <= Math.abs(c - v(y)) ? `(${x} ${down ? '-' : '+'} ${p}/100 * ${x})` : `(${p}/100 * ${x})`; };
const scaled = s => s.replace(new RegExp(String.raw`(?<=\b(?:of|on|the|an?|my|your|our|his|her|their)\s+[$€£]?)${N_}\s+(thousand|million|billion|trillion|dozen)\b(?!\s*(?:[.!?;]|$))`, 'gi'), (all, n, k) => {
  const [i, f = ''] = n.replace(/,/g, '').split('.');
  const [d, places] = /^dozen$/i.test(k) ? [String(BigInt(i + f) * 12n), f.length] : [`${i}${f}${'0'.repeat(Math.max(0, SCALES[k.toLowerCase()] - f.length))}`, Math.max(0, f.length - SCALES[k.toLowerCase()])];
  const w = d.padStart(places + 1, '0'), out = places ? `${w.slice(0, -places)}.${w.slice(-places)}`.replace(/\.?0+$/, '') : w;
  return out.replace(/^0+(?=\d)/, '');
});
const OTHER_MONEY = /\b(?:cents?|pennies|penny|pence|yen|euros?|pounds?|pesos?|rupees?|yuan|francs?|quarters?|dimes?|nickels?|cad|aud|gbp|eur|jpy|usd|canadian|australian)\b|[€£¥₹¢]/i;
const dollars = s => OTHER_MONEY.test(s) ? s : s.replace(new RegExp(String.raw`(?<=\d)\s+(?:dollars?|bucks)\b`, 'gi'), '');
const MIXPCT = new RegExp(String.raw`(?<![\w.,/])(\d+)\s+(\d+)\/(\d+)\s*(?:%|percent\b)\s+(?:of\s+(?:(?:the|an?|my|your|our|his|her|their)\s+)?|(?:contingency\s+fee|contingency|(?:attorney'?s?|legal)\s+fee|fee|commission|share|cut)\s+(?:on|of)\s+(?:(?:the|an?)\s+)?)[$€£]?${N_}(?:\s+(?!(?:is|was|are|for|over|per|a|an|each|and|or|daily|weekly|monthly|yearly)\b)[a-z]+)?(?=\s*(?:=|\b(?:is|was|are|comes\s+to|would\s+be|will\s+be|equals)\b))`, 'gi');
const mixpct = s => s.replace(MIXPCT, (all, a, b, c, n) => +b < +c && +c > 0 ? `(${String(BigInt(a) * BigInt(c) + BigInt(b))}/${String(BigInt(c) * 100n)} * ${n})` : all)
  .replace(new RegExp(String.raw`(?<![\w.,/])\d+\s+\d+\/\d+\s*(?:%|percent\b)`, 'gi'), 'a mixed percent');
const GROUPS = s => mixpct(s)
  .replace(/(\d\s*(?:%|percent\b))\s+(?:share|cut|portion|stake)\s+of\b/gi, '$1 of')
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}\s+(?:(?:is|was|gets?|got)\s+)?(reduced|decreased|discounted|cut|lowered|increased|raised|marked\s+up|marked\s+down)\s+by\s+${N_}\s*(?:%|percent\b)\s*,?\s+(?:is|=|comes\s+to|leaves|gives|becomes|to|which\s+is)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, x, v, p) => { x = x.replace(/,$/, ''); return `(${x} ${/^(?:incr|rais|marked\s+up)/i.test(v) ? '+' : '-'} ${p}/100 * ${x}) = `; })
  .replace(new RegExp(String.raw`\b(reduced|decreased|discounted|cut|lowered|increased|raised)\s+by\s+${N_}\s*(?:%|percent\b),?\s+from\s+[$€£]?${N_}\s+to\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, v, p, x) => { x = x.replace(/,$/, ''); return `(${x} ${/^(?:incr|rais)/i.test(v) ? '+' : '-'} ${p}/100 * ${x}) = `; })
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}\s+(?:minus|less)\s+(?:(?:a|an|the|my|our|their|his|her|your)\s+)?${N_}\s*(?:%|percent\b)\s+(?:contingency\s+fee|(?:attorney'?s?|legal)\s+fee|fee|cut|commission|discount|tax|withholding|share),?\s+(?:is|=|comes\s+to|leaves|gives|which\s+is)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, x, p) => { x = x.replace(/,$/, ''); return `(${x} - ${p}/100 * ${x}) = `; })
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s*(?:%|percent\b)\s+of\s+[$€£]?${N_}(?![\w.,]?\d|\s*(?:%|percent\b))`, 'gi'), (all, p, n) => `(${p}/100 * ${n})`)
  .replace(new RegExp(String.raw`(?<![\w.,-])(?:(?:a|an|one|1)\s+(third|quarter|fifth|tenth)|(half))\s+of\s+[$€£]?${N_}(?![\w.,]?\d|\s*(?:%|percent\b))`, 'gi'),
    (all, k, h, n) => `(${n} / ${SHARE[(k || h).toLowerCase()]})`)
  .replace(new RegExp(String.raw`(?<=\d)\s+(?:in\s+)?(?:costs|fees|interest|taxes|tax|billed|paid|owed|due|damages|expenses|penalties|credits?|refunds?|(?:security\s+)?deposit|retainer|judgment|judgement|award|settlement|balance|bill|rent|estate|verdict|payment|loan|recovery|salary|budget)\b(?=\s*(?:[-+*/=]|plus\b|minus\b|times\b|is\b|was\b|are\b|leaves\b|comes?\s+to\b|equals\b))`, 'gi'), '')
  .replace(/(\btimes\s+[$€£]?\d[\d,]*(?:\.\d+)?)\s+(?:an?|per)\s+(hour|day|week|month|year|night|shift)\s+(is|=|equals)\s+([$€£]?\d[\d,]*(?:\.\d+)?)\s+(?:an?|per)\s+(hour|day|week|month|year|night|shift)(?=\s*(?:[.;!]|$))/gi,
    (all, a, u1, v, b, u2) => u1.toLowerCase() === u2.toLowerCase() ? `${a} ${v} ${b}` : all)
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}\s+(?:an?|per|each)\s+(day|week|month|quarter|year)\s+(?:is|equals|comes\s+to|works\s+out\s+to|=)\s+[$€£]?${N_}\s+(?:an?|per|each)\s+(day|week|month|quarter|year)(?=\s*(?:[.;!]|$))`, 'gi'),
    (all, a, u1, b, u2) => {
      const K = { 'month>year': 12, 'quarter>year': 4, 'month>quarter': 3, 'day>week': 7 }, x = u1.toLowerCase(), y = u2.toLowerCase();
      const a1 = a.replace(/,$/, ''), b1 = b.replace(/,$/, '');
      return K[`${x}>${y}`] ? `(${a1} * ${K[`${x}>${y}`]}) = ${b1}` : K[`${y}>${x}`] ? `(${a1} / ${K[`${y}>${x}`]}) = ${b1}` : all;
    })
  .replace(new RegExp(String.raw`\binterest\b[^.;!=]{0,40}?\bon\s+(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+[a-z]+)?\s+(?:for|over)\s+(?:1|a|one)\s+year(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be)\b))`, 'gi'),
    all => all.replace(/\s+(?:for|over)\s+(?:1|a|one)\s+year$/i, ''))
  .replace(new RegExp(String.raw`\bafter\s+(?:(?:a|an|the|my|his|her|their|our|your)\s+)?(\d{1,2})\s*(?:%|percent\b)\s+(?:contingency\s+fee|(?:attorney'?s?|legal)\s+fee|fee|cut|commission|share|tax|withholding),?\s+(?:the\s+|a\s+)?(?:[a-z]+\s+){0,2}(?:keeps?|kept|gets?|got|nets?|netted|receives?|received|takes?\s+home|took\s+home)\s+[$€£]?${N_}\s+of\s+(?:(?:a|an|the|my|his|her|their|our|your)\s+)?[$€£]?${N_}(?:\s+[a-z]+)?(?=\s*(?:[.;!]|$))`, 'gi'),
    (all, p, t, n) => `(${100 - +p}/100 * ${n.replace(/,$/, '')}) = ${t.replace(/,$/, '')}`)
  .replace(new RegExp(String.raw`(?<=\d)\s+less\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?(?![\d.,%]|\s*(?:%|percent\b|than\b)))`, 'gi'), ' minus ')
  .replace(new RegExp(String.raw`(?<![\w.,/])(\d+)\/(\d+)\s+(?:contingency\s+)?(?:fee|share|commission|interest|cut|royalty)\s+on\s+(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+(?!(?:daily|weekly|monthly|quarterly|per|a|each|for|over|and|or|is|was|are)\b)[a-z]+)?(?=\s*(?:=|\b(?:is|was|are|comes\s+to|would\s+be|will\s+be|equals)\b))`, 'gi'),
    (all, a, b, n) => `(${a}/${b} * ${n})`)
  .replace(new RegExp(String.raw`\b(?:treble|trebled|tripled|triple)\s+damages\s+(?:on|of)\s+[$€£]?${N_}(?=\s*(?:=|\b(?:is|are|was|were|come\s+to|comes\s+to|would\s+be|will\s+be)\b))`, 'gi'), (all, n) => `(3 * ${n})`)
  .replace(new RegExp(String.raw`\bdamages\s+of\s+[$€£]?${N_}\s+(doubled|trebled|tripled)(?=\s*(?:=|\b(?:is|are|was|were|come\s+to|comes\s+to|would\s+be|will\s+be)\b))`, 'gi'), (all, n, k) => `(${/^d/i.test(k) ? 2 : 3} * ${n})`)
  .replace(new RegExp(String.raw`(?<![\w.,])(?:${N_}\s*(?:%|percent\b)|(?:a|one|1)[\s-](third|quarter|fifth|tenth))\s+(?:contingency\s+fee|contingency|(?:attorney'?s?|legal|management|processing|finder'?s|late)\s+fee|fee|sales\s+tax|tax|commission|interest|tip|gratuity|royalty|deposit|down\s+payment|surcharge|penalty|service\s+charge)\s+on\s+(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+(?!(?:daily|weekly|monthly|quarterly|per|a|each|for|over|and|or|is|was|shares?|copies|copy|units?|items?|pages?|books?|tickets?|people|persons?|members?|acres?|hours?|days?)\b)[a-z]+)?(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|equals)\b))`, 'gi'),
    (all, p, k, n) => p ? `(${p}/100 * ${n})` : `(${n} / ${SHARE[k.toLowerCase()]})`)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s*(?:%|percent\b)\s+off\s+(?:of\s+)?(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+(?!(?:is|was|equals|comes|would|will)\b)[a-z]+)?(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|equals)\b)\s*[$€£]?\s?(\d[\d,]*(?:\.\d+)?))`, 'gi'),
    (all, p, x, y) => nearer(p, x, y, true))
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s*(?:%|percent\b)\s+(discount|reduction|decrease|cut|markup|mark-up|raise|increase|rise|hike)\s+(?:on|to|for)\s+(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+(?!(?:is|was|equals|comes|would|will)\b)[a-z]+)?(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|equals)\b)\s*[$€£]?\s?(\d[\d,]*(?:\.\d+)?))`, 'gi'),
    (all, p, w, x, y) => nearer(p, x, y, /^(?:dis|red|dec|cut)/i.test(w)))
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}\s+(?:plus|with|after|including)\s+(?:an?\s+)?${N_}\s*(?:%|percent\b)\s+(?:sales\s+tax|tax|vat|tip|gratuity|service\s+charge)(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|equals)\b)\s*[$€£]?\s?\d)`, 'gi'),
    (all, x, p) => `(${x} + ${p}/100 * ${x})`)
  .replace(new RegExp(String.raw`\b(?:percent(?:age)?\s+)?(increase|rise|jump|growth|gain|decrease|drop|fall|decline)\s+from\s+[$€£]?${N_}\s+to\s+[$€£]?${N_}(?=\s*(?:=|\b(?:is|was|equals)\b)\s*(?:an?\s+)?\d[\d,]*(?:\.\d+)?\s*(?:%|percent\b))`, 'gi'),
    (all, w, a, b) => /^(?:dec|dro|fal)/i.test(w) ? `(1 - ${b} / ${a})` : `(${b} / ${a} - 1)`)
  .replace(new RegExp(String.raw`\b(?:(?:late|attorney'?s?|legal|contingency|management|processing|service)\s+fee|fee|sales\s+tax|tax|commission|tip|gratuity|royalty|surcharge|penalty|interest)\s+of\s+${N_}\s*(?:%|percent\b)\s+on\s+(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+(?!(?:daily|weekly|monthly|quarterly|per|a|each|for|over|and|or|is|was|shares?|copies|copy|units?|items?|pages?|books?|tickets?|people|persons?|members?|acres?|hours?|days?)\b)[a-z]+)?(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|equals)\b))`, 'gi'),
    (all, p, n) => `(${p}/100 * ${n})`)
  .replace(new RegExp(String.raw`(?<![\w.,-])(?:${N_}\s*(?:%|percent\b)|(?:a|one)\s+(third|quarter|fifth|tenth)|(half))\s+of\s+(?:the|an?|my|your|our|his|her|their)\s+[$€£]?${N_}(?:\s+(?!(?:daily|weekly|monthly|quarterly|per|a|each|for|over|and|or|is|was|more|less|fewer|extra|times|squared|cubed|percent)\b)[a-z]+){0,2}(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|equals)\b))`, 'gi'),
    (all, p, k, h, n) => p ? `(${p}/100 * ${n})` : `(${n} / ${SHARE[(k || h).toLowerCase()]})`)
  .replace(new RegExp(String.raw`(?<![\w.,/-])${N_}\s+(?:out\s+)?of\s+(?:the\s+)?${N_}(?:\s+[a-z]+)?(?=\s*(?:=|\b(?:is|was|are|equals|comes\s+to)\b)\s*${N_}\s*(?:%|percent\b))`, 'gi'),
    (all, a, b) => `(${a} / ${b})`)
  .replace(new RegExp(String.raw`(?<![\w.,/-])([2-9])[\s-](thirds|quarters|fourths|fifths|tenths)\s+of\s+(?:the\s+)?[$€£]?${N_}(?![\w.,/]?\d|\s*(?:%|percent\b))`, 'gi'),
    (all, k, d, n) => `(${k}/${{ thirds: 3, quarters: 4, fourths: 4, fifths: 5, tenths: 10 }[d.toLowerCase()]} * ${n})`)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+(${DIST})\s+in\s+${N_}\s+(?:hours?|hrs?)\s+(is|was|means|equals)\s+(?:an?\s+(?:average\s+)?(?:speed\s+)?of\s+)?${N_}\s+(${SPEED})(?=\s*(?:[.;!]|$))`, 'gi'),
    (all, d, du, t, v, s, su) => sameDist(du, su) ? `(${d} / ${t}) ${v} ${s}` : all)
  .replace(new RegExp(String.raw`(?:\b(?:driving|going|traveling|travelling|running|walking|cycling|biking|riding|flying)\s+(?:at\s+)?)?(?<![\w.,])${N_}\s+(${SPEED})\s+for\s+${N_}\s+(?:hours?|hrs?)\s+(?:is|covers|goes|gets\s+you|takes\s+you|means)\s+${N_}\s+(${DIST})(?=\s*(?:[.;!]|$))`, 'gi'),
    (all, s, su, t, d, du) => sameDist(du, su) ? `(${s} * ${t}) = ${d}` : all)
  .replace(new RegExp(String.raw`\bat\s+${N_}\s+(${SPEED}),?\s+${N_}\s+(${DIST})\s+takes\s+${N_}\s+(?:hours?|hrs?)(?=\s*(?:[.;!]|$))`, 'gi'),
    (all, s, su, d, du, t) => sameDist(du, su) ? `(${d} / ${s}) = ${t}` : all)
  .replace(new RegExp(String.raw`(?:\bif\s+)?(?<![\w.,])${N_}\s+([a-z]+)\s+costs?\s+[$€£]?${N_},?\s+(?:so\s+|then\s+)?(?:(one|a|an|each|1)|${N_})\s+([a-z]+)\s+(?:costs?|would\s+cost|will\s+cost)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, n, w1, x, one, m, w2) => { x = x.replace(/,$/, ''); return same(w1, w2) ? (one ? `(${x} / ${n}) = ` : `(${x} / ${n} * ${m}) = `) : all; })
  .replace(new RegExp(String.raw`(?:\b(?:an?|the|my|our|your|his|her|their)\s+(?:shift|workday|work\s+day|day|meeting|class|lecture|trip|flight|drive|game|show|event|nap)\s+)?\bfrom\s+(\d{1,2})(?::(\d\d))?\s*(am|pm)\s+(?:to|until|till)\s+(\d{1,2})(?::(\d\d))?\s*(am|pm)\s+(is|was|equals)\s+${N_}\s+(hours?|hrs?|minutes?|mins?)(?=\s*(?:[.;!]|$))`, 'gi'),
    (all, h1, m1, p1, h2, m2, p2, v, n, u) => {
      if (+h1 < 1 || +h1 > 12 || +h2 < 1 || +h2 > 12 || +(m1 || 0) > 59 || +(m2 || 0) > 59) return all;
      const t = (h, m, p) => (+h % 12 + (/^p/i.test(p) ? 12 : 0)) * 60 + +(m || 0), a = t(h1, m1, p1), b = t(h2, m2, p2) + (t(h2, m2, p2) <= t(h1, m1, p1) ? 1440 : 0);
      return /^h/i.test(u) ? `(${b} / 60 - ${a} / 60) ${v} ${n}` : `(${b} - ${a}) ${v} ${n}`; })
  .replace(new RegExp(String.raw`\bthere\s+(?:are|is)\s+${N_}\s+([a-z]+)\s+in\s+(?:a|an|one|1|every|each)\s+([a-z]+)(?=\s*(?:[.;!]|$|,\s*(?:so|and\s+so|which\s+means)\b))`, 'gi'), (all, n, u1, u2) => `1 ${u2} is ${n} ${u1}`)
  .replace(new RegExp(String.raw`(?<![\w.,])(?:a|an|one|1|every|each)\s+([a-z]+)\s+(?:has|contains|holds)\s+${N_}\s+([a-z]+)(?=\s*(?:[.;!]|$|,\s*(?:so|and\s+so|which\s+means)\b))`, 'gi'), (all, u1, n, u2) => `1 ${u1} is ${n} ${u2}`)
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}(?:\s+([a-z]+))?\s+(?:split|divided|shared)\s+(?:(?:equally|evenly)\s+)?(?:(?:among|between|by)\s+(?:the\s+)?${N_}(?:\s+[a-z]+)?|${N_}\s+ways)\s+(is|was|comes\s+to|would\s+be|will\s+be)\s+[$€£]?${N_}(?:\s+([a-z]+))?\s+(?:each|apiece|per\s+(?:person|head))(?=\s*(?:[.;!]|$))`, 'gi'),
    (all, n, u1, a, b, v, y, u2) => u2 && !(u1 && same(u1, u2)) ? all : `(${n} / ${a || b}) ${v} ${y}`)
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}(?:\s+[a-z]+)?\s+(?:split|divided|shared)\s+(?:(?:equally\s+)?(?:among|between)\s+(?:the\s+)?${N_}(?:\s+[a-z]+)?|${N_}\s+ways)(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|gives|leaves)\b))`, 'gi'),
    (all, n, a, b) => `(${n} / ${a || b})`)
  .replace(new RegExp(String.raw`(\(\d[\d,]*(?:\.\d+)? \/ \d[\d,]*(?:\.\d+)?\)),?\s+(?:gives|leaves|means)\s+each(?:\s+(?:one|1|person|heir|of\s+them))?(?:\s+(?:gets?|receives?|takes?))?\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, q) => `${q} = `)
  .replace(new RegExp(String.raw`\b(?:splitting|dividing|sharing)\s+(?:the\s+|an?\s+|my\s+|our\s+|their\s+)?[$€£]?${N_}(?:\s+[a-z]+){0,2}\s+(?:(?:equally|evenly)\s+)?(?:among|between|by)\s+(?:the\s+)?${N_}(?:\s+[a-z]+)?,?\s+(?:gives|leaves|means)\s+each(?:\s+(?:one|person|heir|of\s+them))?(?:\s+(?:gets?|receives?|takes?))?\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, n, a) => `(${n.replace(/,$/, '')} / ${a.replace(/,$/, '')}) = `)
  .replace(new RegExp(String.raw`\beach\s+of\s+(?:the\s+)?${N_}\s+[a-z]+\s+(?:(?:was|were|is|are|will\s+be|has|have)\s+)?(?:puts?\s+in|put\s+in|pays?|paid|contributes?|contributed|invests?|invested|gets?|got|receives?|received|owes?|owed|earns?|earned|is\s+paid|gives?|gave|takes?|took|deposits?|deposited)\s+[$€£]?${N_},?\s+(?:for\s+a\s+total\s+of|totall?ing|which\s+totals|or)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?(?:\s+(?:in\s+)?(?:total|altogether|in\s+all))?\s*(?:[.;!]|$))`, 'gi'),
    (all, n, x) => `(${n} * ${x.replace(/,$/, '')}) = `)
  .replace(new RegExp(String.raw`\b(owes?|owed|pays?|paid|bills?|billed|charges?|charged|earns?|earned|costs?)\s+[$€£]?${N_}\s+for\s+${N_}\s+(${BILL})\s+at\s+[$€£]?${N_}(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(${BILL})(?=\s*(?:[.;!]|$))`, 'gi'),
    (all, v, t, n, u1, r, u2) => same(u1, u2) ? `${v} (${n} * ${r}) = ${t.replace(/,$/, '')}` : all)
  .replace(new RegExp(String.raw`\bis\s+[$€£]?${N_}\s+and\s+(?:the\s+)?(?:[a-z]+\s+){1,3}is\s+[$€£]?${N_},?\s+(?:for\s+a\s+total\s+of|totall?ing)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, a, b) => `(${a.replace(/,$/, '')} + ${b.replace(/,$/, '')}) = `)
  .replace(new RegExp(String.raw`\b(?:costs?|fees?|charges?|damages|interest|expenses?|rent|deposit|tax|taxes|penalt(?:y|ies)|fines?|retainer|award)\s+of\s+[$€£]?${N_}\s+and\s+(?:[a-z]+\s+){0,2}(?:costs?|fees?|charges?|damages|interest|expenses?|rent|deposit|tax|taxes|penalt(?:y|ies)|fines?|retainer|award)\s+of\s+[$€£]?${N_},?\s+(?:totals?|total\s+to|come\s+to|comes\s+to|are|is|makes?|=)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, a, b) => `(${a.replace(/,$/, '')} + ${b.replace(/,$/, '')}) = `)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+(${BILL})\s+at\s+[$€£]?${N_}(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(${BILL}),\s+(?:earning|making|totaling|totalling|costing|for\s+a\s+total\s+of|or|for|billed\s+at)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, n, u1, r, u2) => same(u1, u2) ? `(${n} * ${r}) = ` : all)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+(${BILL})\s+at\s+[$€£]?${N_}(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(${BILL})(?=\s*(?:=|\b(?:is|was|comes\s+to|totals?|would\s+be|will\s+be|gives)\b))`, 'gi'),
    (all, n, u1, r, u2) => same(u1, u2) ? `(${n} * ${r})` : all)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+(${BILL})(?:\s+of\s+[a-z]+)?\s+at\s+[$€£]?${N_}(?:,?\s+which\s+is|\s*=|\s+(?:is|was|comes\s+to|would\s+be|will\s+be))\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, n, u, r) => `(${n} * ${r.replace(/,$/, '')}) = `)
  .replace(new RegExp(String.raw`\bat\s+[$€£]?${N_}(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(${BILL}),?\s+${N_}\s+(${BILL})(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|gives)\b))`, 'gi'),
    (all, r, u1, n, u2) => same(u1, u2) ? `(${r} * ${n})` : all)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+(${BILL})\s*(?:x|×|\*)\s*[$€£]?${N_}(?![\w.,]?\d)`, 'gi'), (all, n, u, r) => `(${n} * ${r})`)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+([a-z]+)\s+at\s+[$€£]?${N_}\s+each(?=\s*(?:=|\b(?:is|was|are|were|comes?\s+to|would\s+be|will\s+be)\b)\s*[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, n, w, r) => `(${n} * ${r})`)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+(${BILL})\s+at\s+[$€£]?${N_}(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(${BILL})\s+(?:earns?|earned|makes?|made|costs?|pays?|paid)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, n, u1, r, u2) => same(u1, u2) ? `(${n} * ${r}) = ` : all)
  .replace(new RegExp(String.raw`\bat\s+[$€£]?${N_}(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(${BILL})\s+(?:for|over)\s+${N_}\s+(${BILL}),?\s+(?:you|he|she|they|we|i)\s+(?:earns?|earned|makes?|made|gets?|got|pays?|paid|owes?|owed)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, r, u1, n, u2) => same(u1, u2) ? `(${r} * ${n}) = ` : all)
  .replace(new RegExp(String.raw`\bof\s+(?:the\s+)?[$€£]?${N_}(?:\s+[a-z]+)?,\s+each\s+of\s+(?:the\s+)?${N_}\s+[a-z]+\s+(?:receives?|gets?|owes?|takes?|pays?|inherits?)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, n, m) => /^(?:1[89]|20)\d\d$/.test(n) ? all : `(${n} / ${m}) = `)
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(${BILL})\s+(?:for|over)\s+${N_}\s+(${BILL})(,\s+which(?=\s+is\b))?(?=\s*(?:=|\b(?:is|was|comes\s+to|totals?|would\s+be|will\s+be|gives)\b))`, 'gi'),
    (all, r, u1, n, u2, w, off, str) => same(u1, u2) && !/\d/.test(str.slice(0, off))
      && /^\s*(?:=|is|was|comes\s+to|totals?|would\s+be|will\s+be|gives)\s+[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$)/i.test(str.slice(off + all.length)) ? `(${r} * ${n})` : all)
  .replace(new RegExp(String.raw`\b(?:simple\s+interest\s+(?:of|at)\s+${N_}\s*(?:%|percent\b)|${N_}\s*(?:%|percent\b)\s+simple\s+interest|interest\s+(?:of|at)\s+${N_}\s*(?:%|percent\b)\s+simple)(?:\s+(?:a|per)\s+year|\s+annually|\s+yearly)?\s+on\s+(?:a\s+|the\s+)?[$€£]?${N_}(?:\s+[a-z]+)?\s+(?:for|over)\s+${N_}\s+(years?|months?)(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|gives)\b))`, 'gi'),
    (all, r1, r2, r3, p, n, u, off, str) => /^\s*(?:=|is|was|comes\s+to|would\s+be|will\s+be|gives)\s+(?:about\s+|roughly\s+|approximately\s+)?[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$)/i.test(str.slice(off + all.length))
      ? `(${p} * ${r1 || r2 || r3}/100 * ${n}${/^m/i.test(u) ? '/12' : ''})` : all)
  .replace(/\b(?:the\s+)?(sum|product)\s+of\s+(-?\d[\d,]*(?:\.\d+)?)\s+and\s+(-?\d[\d,]*(?:\.\d+)?)\b(?!\s+and\b|[.,]\d)/gi,
  (all, k, a, b) => `(${a} ${k.toLowerCase() === 'sum' ? '+' : '*'} ${b})`)
  .replace(new RegExp(String.raw`(?<![\w.,^])${N_}\s+(squared|cubed)\b`, 'gi'), (all, n, k) => `(${n}^${/^s/i.test(k) ? 2 : 3})`)
  .replace(new RegExp(String.raw`\b(?:the\s+)?(square|cube)\s+root\s+of\s+${N_}(?![\w.,]?\d)`, 'gi'), (all, k, n) => `${n}^(1/${/^s/i.test(k) ? 2 : 3})`)
  .replace(new RegExp(String.raw`√\s*${N_}(?![\w.,]?\d)`, 'g'), (all, n) => `${n}^(1/2)`)
  .replace(new RegExp(String.raw`\b(?:(?:if|when)\s+you\s+)?(add|multiply|divide|subtract)\s+${N_}\s+(and|to|by|from)\s+${N_}(?![\w.,]?\d)(?=,?\s*(?:and\s+)?you(?:'ll|\s+will)?\s+get\b)`, 'gi'),
    (all, v, a, w, b) => { v = v.toLowerCase(); w = w.toLowerCase(); b = b.replace(/,$/, '');
      return v === 'add' && (w === 'and' || w === 'to') ? `(${a} + ${b})` : v === 'multiply' && (w === 'by' || w === 'and') ? `(${a} * ${b})`
        : v === 'divide' && w === 'by' ? `(${a} / ${b})` : v === 'subtract' && w === 'from' ? `(${b} - ${a})` : all; })
  .replace(new RegExp(String.raw`\b(?:if|when)\s+you\s+(double|triple|halve)\s+${N_}(?![\w.,]?\d)(?=,?\s*(?:and\s+)?you(?:'ll|\s+will)?\s+get\b)`, 'gi'),
    (all, k, n) => (n = n.replace(/,$/, ''), /^h/i.test(k) ? `(${n} / 2)` : `(${/^t/i.test(k) ? 3 : 2} * ${n})`))
  .replace(new RegExp(String.raw`\b(double|twice|triple)\s+(?:the|an?|my|our|their|his|her|your|its)\s+${N_}(?![\w.,]?\d)(?:\s+[a-z]+){0,2}(?=\s*(?:=|\b(?:is|was|equals|comes\s+to|would\s+be|will\s+be)\b))`, 'gi'),
    (all, k, n) => `(${/^tr/i.test(k) ? 3 : 2} * ${n})`)
  .replace(new RegExp(String.raw`\b(double|twice|triple)\s+${N_}(?![\w.,]?\d)`, 'gi'), (all, k, n) => `(${/^tr/i.test(k) ? 3 : 2} * ${n})`)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+(doubled|tripled|halved)\b`, 'gi'), (all, n, k) => /^h/i.test(k) ? `(${n} / 2)` : `(${/^t/i.test(k) ? 3 : 2} * ${n})`)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+dozen\b`, 'gi'), (all, n) => `(${n} * 12)`)
  .replace(new RegExp(String.raw`(?<![\w.,/])(\d+)\/(\d+)\s+of\s+[$€£]?${N_}(?![\w.,/]?\d|\s*(?:%|percent\b))`, 'gi'), (all, a, b, n) => `(${a}/${b} * ${n})`)
  .replace(new RegExp(String.raw`\b(?:the\s+)?(?:average|mean)\s+of\s+(${N_.slice(1, -1)}(?:\s*,\s*${N_.slice(1, -1)})*)\s*,?\s+and\s+${N_}\b(?![.,]\d|\s+and\b|\s+(?!(?:is|are|was|equals|comes)\b)[a-z])`, 'gi'),
    (all, list, last) => { const xs = list.split(/\s*,\s+|\s*,$/).concat(last).map(x => x.replace(/,/g, '')).filter(Boolean); return `(${xs.map(x => `${x}/${xs.length}`).join(' + ')})`; })
  .replace(new RegExp(String.raw`\b(?:the\s+)?(difference|quotient)\s+(?:of|between)\s+${N_}\s+and\s+${N_}\b(?![.,]\d|\s+and\b)`, 'gi'),
    (all, k, a, b) => /^d/i.test(k) ? (Number(a.replace(/,/g, '')) >= Number(b.replace(/,/g, '')) ? `(${a} - ${b})` : all) : `(${a} / ${b})`);
function oneOff(a, b) {
  if (Math.abs(a.length - b.length) > 1 || a === b) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) === 1;
}
export function spelled(s) {
  if (!MATHY.test(s)) return { text: s, typos: [] };
  const typos = [];
  let t = s.replace(new RegExp(String.raw`\b(${Object.keys(TENS).join('|')})[- ]([a-z]+)\b`, 'gi'), (all, a, b) => {
    const x = TENS[a.toLowerCase()], y = NUMWORD.get(b.toLowerCase());
    return x !== undefined && y !== undefined && y > 0 && y < 10 ? String(x + y) : all;
  });
  const words = fix => t.replace(/\b[a-z]+\b/gi, w => {
    const lw = w.toLowerCase();
    if (NUMWORD.has(lw)) return String(NUMWORD.get(lw));
    if (!fix || lw.length < 4 || /^(?:plus|minus|times|equals?|divided|multiplied|by|to|is)$/.test(lw) || new RegExp(`^(?:${BILL})$`).test(lw)) return w;
    const meant = [...NUMWORD.keys()].find(n => n.length >= 4 && oneOff(lw, n));
    if (!meant) return w;
    typos.push({ word: w, meant }); return String(NUMWORD.get(meant));
  });
  const hundreds = x => x.replace(/\b(?:(a|one|\d{1,2}))\s+hundred\b(?:\s+(?:and\s+)?(\d{1,2})\b(?![.,]\d|\s+(?:hundred|thousand|million|billion)\b))?/gi,
    (all, a, b) => String((/^\d+$/.test(a) ? +a : 1) * 100 + (b ? +b : 0)));
  const signs = x => { x = GROUPS(scaled(hundreds(dollars(x)))); for (const [re, sign] of OPWORDS) x = x.replace(re, ` ${sign} `); return x.replace(/ {2,}/g, ' '); };
  const plain = signs(words(false)), fixed = signs(words(true));
  const key = x => formsIn(x).map(f => f.form).join('|');
  return typos.length && key(fixed) && key(fixed) !== key(plain) ? { text: fixed, typos } : { text: plain, typos: [] };
}

export function sentences(text) {
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/).map(s => s.trim()).filter(s => s.length > 1);
}

const pctDecimal = p => {
  const [i, f = ''] = p.replace(/,/g, '').split('.'), w = i.padStart(3, '0');
  return `${w.slice(0, -2).replace(/^0+(?=\d)/, '')}.${w.slice(-2)}${f}`;
};
const CMP_AFTER = new RegExp(String.raw`^\s*(?:[a-z]+\s+){0,2}?(?:(?:less|more|fewer|greater|bigger|smaller|higher|lower|larger|older|younger|longer|shorter|further|farther|cheaper|heavier|lighter)\s+than|short\s+of|(?:times|\*)\s+(?:as|more|less|bigger|smaller|larger|greater|fewer))\b`, 'i');
const norm = x => x.replace(/[−–]/g, '-').replace(/ /g, ' ');
function formsIn(s) {
  const t = norm(s);
  const out = [], spans = [];
  const tail = a => /[A-Za-z_]$/.test(t.slice(0, a)) || /\b(?:mod|modulo|rem|div|(?<!\b(?:total|subtotal|sum|cost|price|bill|amount|balance|judgment|judgement|award|settlement|retainer|deposit|verdict|estate|loan|debt|payments?|installments?|instalments?|dues|premiums?|maintenance|tuition|allowance|stipend|leases?|support|rent|alimony|mileage|wages?|salary|fees?|charges?|expenses?|damages|penalt(?:y|ies)|fines?|interest|costs)\s+)of|log|sqrt|root)\s*$/i.test(t.slice(0, a))
    || (t[a] === '(' && /[\d)]\s*$/.test(t.slice(0, a))) || /\d\s+(?:in|out\s+of|per)\s+$/i.test(t.slice(Math.max(0, a - 30), a))
    || (/^[-+*/×÷]\s/.test(t.slice(a)) && /[A-Za-z]\s*$/.test(t.slice(Math.max(0, a - 3), a)))
    || /\d:$/.test(t.slice(Math.max(0, a - 2), a))
    || (t[a] === '(' && /\b(?:double|twice|triple|thrice|half|and|of|than|between)\s*$/i.test(t.slice(Math.max(0, a - 12), a))
      && !/\b(?:payments?|installments?|instalments?|dues|premiums?|maintenance|tuition|allowance|stipend|leases?|support|rent|alimony|mileage|wages?|salary|fees?|charges?|expenses?|total|cost|bill|amount|damages|penalt(?:y|ies)|fines?|interest|costs|retainer|award|settlement)\s+of\s*$/i.test(t.slice(Math.max(0, a - 18), a)))
    || /\^\s*$/.test(t.slice(Math.max(0, a - 2), a)) || (t[a] === '(' && /[\w')\]]$/.test(t.slice(Math.max(0, a - 1), a)))
    || (/^\(\s*-?[\d.,/]+\s*\)/.test(t.slice(a)) && /[A-Za-z]\s?$/.test(t.slice(Math.max(0, a - 2), a)));
  const add = (m, form, prime) => {
    const a = m.index, b = a + m[0].length;
    if (tail(a)) return;
    if (spans.some(([x, y, s]) => a < y && x < b && !(s && a < x && b <= s))) return;
    spans.push([a, b, prime ? a + m[1].length : 0]); out.push({ said: m[0], form });
  };
  for (const m of t.matchAll(DEADLINE)) { const f = deadline(m); if (f) add(m, f); }
  for (const m of t.matchAll(PRIMEQ)) add(m, `${mathText(m[1])} is ${m[2] ? 'not ' : ''}prime`, true);
  for (const m of t.matchAll(ARITH)) {
    const l = mathText(m[1]);
    let r = mathText(m[3]);
    const after = t.slice(m.index + m[0].length);
    const pct = /^\s*(?:%|percent\b|per cent\b)/i.test(after);
    if (pct) {
      if (!/^\d[\d,]*(?:\.\d+)?$/.test(r.trim()) || !/^\s*(?:%|percent|per cent)\s*(?:$|[.,;:!?)]|(?:and|but|so|or|which|while)\b)/i.test(after)) continue;
      r = pctDecimal(r.trim());
    }
    if ((/\.\d+\s*$/.test(r) && /^\s*(?:\.{2,}|…)/.test(after)) || /^\s*(?:r|R|rem|remainder)\s*\d/.test(after)) continue;
    if (/\d$/.test(r.trim()) && /^ \d{3}(?!\d)|^\s+(?:thousand|million|billion|trillion)\b|^:\d/i.test(after)) continue;
    if (CMP_AFTER.test(after)) continue;
    const unbalanced = (s, o, c) => (s.split(c).length - 1) > (s.split(o).length - 1);
    if (unbalanced(m[1], '(', ')') || unbalanced(m[3], ')', '(')) continue;
    if (/^\d{3}(?!\d)/.test(t.slice(m.index)) && /\d{1,3} $/.test(t.slice(Math.max(0, m.index - 4), m.index))) continue;
    const range = s => { const g = s.trim().match(/^(\d[\d,]*)-(\d[\d,]*)$/); return g && +g[1].replace(/,/g, '') < +g[2].replace(/,/g, ''); };
    const worded = /^\s+[a-z]/i.test(t.slice(m.index + m[0].length));
    if (worded && ((range(l) && !/^\s*-/.test(r)) || (range(r) && !/^\s*-/.test(l)))) continue;
    const ISO = /(?<![\d.])\d{4}-\d{1,2}-\d{1,2}(?![\d.])/;
    if (ISO.test(m[1]) || ISO.test(m[3]) || ISO.test(t.slice(Math.max(0, m.index - 6), m.index + m[0].length + 6))) continue;
    const SLASHDATE = /(?<![\d.\/])(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}\/\d{1,2}\/\d{1,2})(?![\d\/])/;
    if (SLASHDATE.test(t.slice(Math.max(0, m.index - 10), m.index + m[0].length + 10))) continue;
    if (/^totals?$/i.test(m[2].trim()) && !/[+(]/.test(m[1])) continue;
    if (pct && /^\s*\d[\d,]*\s*$/.test(l)) continue;
    if (!pct && !/[-+*/^]/.test(l + r)) continue;
    const op = /^is\s+\w/i.test(m[2]) ? '~=' : /^(?:comes?|totals?|would|will|was|leaves|gives|are|were)\b/i.test(m[2]) ? '=' : { '≈': '~=', '≠': '!=', is: '=', equals: '=' }[m[2].toLowerCase()] || m[2];
    add(m, `${l} ${op} ${r}`);
  }
  for (const m of t.matchAll(CONVERSION)) {
    if (/\bminus\s*$|\d\s*[-–]\s*$/i.test(t.slice(0, m.index))) continue;
    if (/(?:[-+*/×÷^]|\b(?:plus|times)\b|\b(?:half|thirds?|quarters?|fifths?|tenths?|double|twice|triple)\s+of)\s*$/i.test(t.slice(0, m.index)) || (/^\s*[-–]/.test(m[0]) && /[\d)]\s*$/.test(t.slice(0, m.index)))) continue;
    let a = qty(m[1], m[2], m[3]), at = m;
    const pm = a && a.kind !== 'temp' && t.slice(Math.max(0, m.index - 40), m.index).match(PREV);
    const p = pm && qty(pm[1], pm[2], pm[3]);
    if (p && p.kind === a.kind) {
      if ((p.kind === 'volume' && (p.alt || a.alt)) || !(Number(p.f) > Number(a.f))) continue;
      a = { kind: a.kind, f: p.f, v: `(${p.v} + ${a.v} * ${a.f} / ${p.f})`, n: p.n + a.n * Number(a.f) / Number(p.f) };
      const from = m.index - (m.index > 40 ? 40 : m.index) + pm.index;
      at = { index: from, 0: t.slice(from, m.index + m[0].length) };
    }
    let b = qty(m[4], m[5], m[6]);
    const end = m.index + m[0].length, nm = b && b.kind !== 'temp' && t.slice(end, end + 40).match(NEXT), c = nm && qty(nm[1], nm[2], nm[3]);
    if (c && c.kind === b.kind) {
      const k = Number(b.f) / Number(c.f), whole = Math.round(k);
      if ((b.kind === 'volume' && (b.alt || c.alt)) || !(k > 1) || Math.abs(k - whole) > 1e-9 || b.d || c.n < 0 || b.n < 0) continue;
      const n = b.n * whole + c.n;
      b = { ...c, n, v: String(+n.toFixed(c.d)) };
      at = { index: at.index, 0: t.slice(at.index, end + nm[0].length) };
    }
    const change = /\b(?:by|rise|rises|rose|risen|raise|change|changes|changed|increase|increased|decrease|decreased|drop|drops|dropped|fall|falls|fell|difference|warmed|cooled|warmer|cooler|colder|hotter|swing|spread)\b/i
      .test(t.slice(Math.max(0, at.index - 40), at.index) + ' ' + t.slice(at.index + at[0].length, at.index + at[0].length + 20));
    const f = conversion(a, b, change);
    if (f) add(at, f);
  }
  return out;
}

const GLUE = new Set(('the a an so and also yes answer result is are was it its that this which then we get gives equals equal because since '
  + 'true correct right total sum of about roughly approximately around nearly or number degrees day days week month year '
  + 'to by plus minus times divided multiplied').split(' '));
const LEAD = new Set(('billing billed bill invoice fees fee charges charge costs cost damages liquidated statutory compensatory punitive '
  + 'retainer interest penalty penalties fine fines rent wages wage salary award settlement judgment judgement verdict net balance '
  + 'deposit subtotal partner associate attorney lawyer paralegal client firm owes owed court filing legal marital she he they we you prejudgment postjudgment '
  + 'child support spousal alimony maintenance mileage payment payments paying paid pays pay installment installments instalment instalments '
  + 'dues premium premiums tuition allowance stipend tenant landlord plaintiff defendant debtor creditor borrower lender monthly weekly '
  + 'lease overtime at').split(' '));
const RATE_LEFT = new RegExp(String.raw`\b(?:an?|each|every)\s+(?:seconds?|minutes?|hours?|days?|weeks?|months?|years?|nights?|shifts?)\b`, 'gi');
export function unchecked(s, saids) {
  const t0 = norm(s), m = t0.split('');
  for (const x of saids) for (let i = x ? t0.indexOf(x) : -1; i >= 0; i = t0.indexOf(x, i + 1)) m.fill(' ', i, i + x.length);
  const t = m.join('');
  const first = Math.min(...saids.map(x => (x ? t0.indexOf(x) : -1)).filter(i => i >= 0), t0.length);
  const latin = [...t.matchAll(/[a-z]+/gi)].filter(x => { const l = x[0].toLowerCase(); return l.length > 1 && !GLUE.has(l) && !UNIT.has(l) && !TEMP[l] && !(x.index < first && LEAD.has(l)); }).map(x => x[0]);
  const other = (t.match(/[\p{L}\p{M}]+/gu) || []).filter(w => /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(w));
  const nums = t.match(/\d+(?:[.,]\d+)*/g) || [];
  const letters = [...t0.matchAll(/(?<=\d ?)[A-Za-z](?![A-Za-z'’])/g)].filter(x => t[x.index] !== ' ' && !(x[0] === x[0].toLowerCase() && UNIT.has(x[0]))).map(x => x[0]);
  const marks = t.match(/[⁰¹²³⁴-⁹⁺⁻½⅓⅔¼¾⅕-⅞✗✘✖❌❎×]/gu) || [];
  const rates = t.match(RATE_LEFT) || [];
  return [...latin, ...other, ...nums, ...letters, ...marks, ...rates].join(' ');
}
const HOLDS = new Set(['PROVEN', 'ARITHMETIC-CHECKED']);
const DENIES = new RegExp(String.raw`\b(?:not|no|never|nobody|none|false|wrong|incorrect|untrue|myth|mistake|mistaken|error|nonsense|impossible|absurd|if|unless|suppose|supposing|assume|assuming|imagine|pretend|hypothetically)\b`, 'i');
export function whole(c, out) {
  if (out[0] === 'FALSIFIED' && c.rest && DENIES.test(c.rest))
    return ['GUESS', out[1], `the math "${c.form}" does not hold, but the sentence around it ("${c.rest.slice(0, 80)}") may deny it or only suppose it, so the sentence is not called false`];
  if (out[0] !== 'PROVEN') return out;
  if (c.rest) return ['GUESS', out[1], `only the part "${c.form}" was checked, and it holds; the rest ("${c.rest.slice(0, 80)}") is not checked by math; look it up below`];
  for (const f of c.sib || []) {
    const [v] = settleForm(f.form, f.said);
    if (!HOLDS.has(v)) return ['GUESS', out[1], `the part "${c.form}" holds, but another part of the same sentence, "${f.said.trim().slice(0, 80)}", ${v === 'FALSIFIED' ? 'is false' : 'is not proven'}, as its own line shows`];
  }
  return out;
}

export function findClaims(text) {
  const out = [], all = sentences(text);
  let left = false;
  for (const [i, s] of all.entries()) {
    const sp = spelled(s), forms = formsIn(sp.text);
    if (sp.typos.length) {
      out.push({ said: s, form: null, maybe: { ...sp.typos[0], form: forms[0].form } });
      if (out.length >= MAX_CLAIMS) { left = i + 1 < all.length; break; }
      continue;
    }
    const rest = forms.length ? unchecked(sp.text, forms.map(f => f.said)) : '';
    const first = { said: s, form: forms[0] ? forms[0].form : null, ...(rest ? { rest } : {}) };
    if (forms.length > 1) Object.defineProperty(first, 'sib', { value: forms.slice(1) });
    out.push(first);
    for (const f of forms.slice(1)) out.push({ said: f.said, form: f.form });
    if (out.length >= MAX_CLAIMS) { left = i + 1 < all.length; break; }
  }
  const kept = out.slice(0, MAX_CLAIMS);
  if (left || out.length > MAX_CLAIMS) kept.more = true;
  return kept;
}
