import { run as settleForm, twoWays } from './checker.js';
import { arith } from './public_check.js';
const MAX_CLAIMS = 40;

const written = form => {
  const t = form.split(' '), unary = t.map((k, i) => k === '-' && (i === 0 || !(/^\d/.test(t[i - 1]) || t[i - 1] === ')')));
  return t.map((k, i) => (i === 0 || t[i - 1] === '(' || k === ')' || k === '^' || t[i - 1] === '^' || unary[i - 1] ? '' : ' ') + k).join('');
};
export const engineReads = s => {
  if (twoWays(s, true)) return null;
  const a = arith(String(s).replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)));
  return a.form ? { holds: a.holds, form: written(a.form) } : null;
};

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
  ['time', 1209600, ['fortnight', 'fortnights']],
  ['calendar', 1, ['month', 'months']], ['calendar', 12, ['yr', 'yrs', 'year', 'years']], ['calendar', 120, ['decade', 'decades']],
  ['calendar', 1200, ['century', 'centuries']], ['calendar', 12000, ['millennium', 'millennia', 'millenniums']],
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
const CONVERSION = new RegExp('(?<!\\d,?)' + QTY + OF + LINK + QTY, 'gi');
const LINKED = new RegExp('^' + QTY + OF + '(' + LINK + ')' + QTY + '$', 'i');
const OR_CHOICE = 'the two amounts are joined by "or", which can offer a choice as well as say one amount twice, and these two do not match, so no verdict is given; to check a conversion, write it with "is", as in "1 week is 7 days"';
const OR_ASIDE = 'the bracket goes on past its amount, so it may say something other than the amount before it, and no verdict is given; to check a conversion, write it with "is", as in "3 days is 72 hours"';
const R_HEDGE = String.raw`(?:(?:about|around|roughly|approximately|nearly|almost)\s+|~\s*)?`;
const R_DASH = '[-\u2010-\u2015\u2212~\u301C]';
const RANGE_BEFORE = new RegExp(String.raw`(?:(?:(?<![A-Za-z][-‐]?\d*)\d|[½¼¾⅓⅔⅛])(?:\s+(?:up\s+to|to|and|or|through|thru)|\s*${R_DASH})`
  + String.raw`|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|few|couple(?:\s+of)?)\s+(?:up\s+to|to|and|or|through|thru)`
  + String.raw`|\d\s*[a-zA-Z°]+\.?(?:\s+(?:up\s+to|to|through|thru)|\s*${R_DASH}))\s*${R_HEDGE}$`, 'i');
const RANGE_AFTER = new RegExp(String.raw`^\s*(?:to|or|through|thru|${R_DASH})\s*${R_HEDGE}(?:\d|[½¼¾⅓⅔⅛])`, 'i');
const BOUND = /\b(?:(?:less|more|fewer|greater)\s+than|under|over|below|above|nearly|almost|at\s+(?:most|least)|up\s+to|just\s+(?:under|over))\s*$/i;
const OR_RANGE = 'the amount is one end of a range, not the whole amount the sentence gives, so no verdict is given; to check a conversion, write one amount with "is", as in "3 hours is 180 minutes"';
const OR_BOUND = 'the amount is a limit ("less than", "over", "up to" and the like), not an exact amount, and the two amounts do not match, so no verdict is given; to check a conversion, write it with "is", as in "2 hours is 120 minutes"';
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
const SIZE_NAME = { 0.56826125: 'the UK pint', 1.1365225: 'the UK quart', 4.54609: 'the UK gallon', 0.25: 'the metric cup of 250 ml',
  0.284130625: 'the UK cup', 0.24: 'the US food-label cup of 240 ml', 0.02: 'the Australian tablespoon of 20 ml' };
function otherSize(a, b, f, text) {
  if (a.kind !== 'volume' || !(a.alt || b.alt) || settleForm(f, text)[0] !== 'FALSIFIED') return '';
  for (const fa of [Number(a.f), ...(a.alt || [])]) for (const fb of [Number(b.f), ...(b.alt || [])]) {
    if ((fa === Number(a.f) && fb === Number(b.f)) || settleForm(`${a.v} * ${fa} / ${fb} ~= ${b.v}`, text)[0] !== 'PROVEN') continue;
    const names = [fa === Number(a.f) ? '' : SIZE_NAME[fa], fb === Number(b.f) ? '' : SIZE_NAME[fb]].filter(Boolean).join(' and ');
    return `the amounts match for ${names || 'another legal size'}, not for the US size, so no verdict is given; to check it, write the amount in milliliters or liters`;
  }
  return '';
}
const OVEN = /\b(?:ovens?|bake[sd]?|baking|roast(?:s|ed|ing)?|preheat(?:s|ed|ing)?|broil(?:s|ed|ing)?|gas\s+mark)\b/i;
function ovenStep(a, b, f, text, sentence, change) {
  if (change || a.kind !== 'temp' || a.t === b.t || a.d || b.d || !OVEN.test(sentence) || settleForm(f, text)[0] !== 'FALSIFIED') return '';
  const [c, F] = a.t === 'C' ? [a.n, b.n] : [b.n, a.n];
  if (c % 5 || c < 100 || c > 290 || F % 25 || F < 225 || F > 550) return '';
  const toF = c * 9 / 5 + 32, toC = (F - 32) * 5 / 9;
  if (Math.abs(F - toF) > 12.5 && Math.abs(c - toC) > 2.5) return '';
  return `not exact (${c} °C is ${+toF.toFixed(1)} °F, and ${F} °F is ${+toC.toFixed(1)} °C), but a usual oven setting, since oven dials step by 25 °F and by 5 or 10 °C, so no verdict is given; to check a conversion, write the exact value`;
}
function tempChange(a, b, f, text, lead, change) {
  if (!change || a.kind !== 'temp' || a.t === b.t || !/\b(?:by|of)\s+$/i.test(lead)) return '';
  const d = a.n * (a.t === 'F' ? 5 / 9 : 9 / 5);
  if (Math.abs(d - b.n) <= 0.5 * 10 ** -b.d * (1 + 1e-9) || settleForm(f, text)[0] !== 'PROVEN') return '';
  return `a change in temperature converts without the 32 (a change of ${a.n} °${a.t} is a change of ${+d.toFixed(1)} °${b.t}), and these two amounts match only as two temperatures, so no verdict is given`;
}
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

const SIDE = String.raw`(?:(?<![\d.)])(?:-\s*){1,4})?(?:\(\s*(?:-\s*){0,4})?(?<!\d,?)(?:${NUM})(?:\s*\^\s*\d+)*(?:\s*\)(?:\s*\^\s*\d+)*)?(?:\s*(?:[-+*/×÷x]|\^(?!\s*\d))\s*(?:-\s*){0,4}(?:\(\s*(?:-\s*){0,4})?(?:${NUM})(?:\s*\^\s*\d+)*(?:\s*\)(?:\s*\^\s*\d+)*)?)*`;
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
const PRIME_END = /\s+is\s+(?:not\s+)?(?:a\s+)?prime(?:\s+number)?/gi, SIDE_CHAR = /[\d\s\-(),.^+*/×÷x]/i;
function* primeMatches(t) {
  let from = 0;
  for (const e of t.matchAll(PRIME_END)) {
    const end = e.index + e[0].length;
    let r = e.index;
    while (r > from && SIDE_CHAR.test(t[r - 1])) r--;
    const re = new RegExp(PRIMEQ.source, 'gi');
    re.lastIndex = r;
    const m = re.exec(t.slice(0, end));
    if (m && m.index + m[0].length === end) { from = end; yield m; }
  }
}
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
const MATHY = /[-+*/=×÷%√]|\b(?:per\s+diem\s+(?:of|at)\s+[$€£]?\d[\d,.]*|plus|minus|times|multiplied|divided|equals?|sum|product|percent|half|thirds?|quarters?|fourths?|fifths?|tenths?|split|shared|squared|simple\s+interest|(?:hour|dai|week|month|night|year)ly\s+(?:fee|rate|charge|price|cost|wage|pay)\s+(?:of|is|was)\s+[$€£]?\d[\d,.]*|treble[ds]?|trebled|tripled|doubled|halved|splitting|dividing|(?<!\d[,.]?)\d[\d,.]*\s+(?:an?|per|each)\s+(?:day|week|month|quarter|year)\s+(?:is|equals)|of\s+[$€£]?\d[\d,.]*\s+and\s+(?:[a-z]+\s+){1,3}of\s+[$€£]?\d[\d,.]*,?\s+(?:totals?|come|comes|are|is|makes?)|(?:(?<!\d[,.]?)\d[\d,.]*|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:hours?|hrs?|days?|weeks?|months?|years?|nights?|sessions?|visits?)(?:\s+of\s+[a-z]+)?\s+at\s+[$€£]?\d[\d,.]*(?:,?\s+which\s+is|,\s+or|\s*=|\s+is)|(?<!\d[,.]?)\d[\d,.]*\s+less\s+(?:the\s+)?[$€£]?\d+(?![\d.,]*\s*(?:%|percent))|(?:add|multiply|divide|subtract|halve)\s+\d+|\d\/\d+\s+(?:contingency\s+)?(?:fee|share|commission|interest|cut|royalty)\s+on|\bat\s+[$€£]?\d[\d,.]*(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(?:hour|hr|mile|day|week|month|year|unit|item|page|copy|session|visit|night|share|gallon|liter|litre|ticket|seat|box)\b|\bat\s+[$€£]?\d[\d,.]*\s+each\b|each\s+of\s+(?:the\s+)?\d+|for\s+a\s+total\s+of\s+[$€£]?\d+|totall?ing\s+[$€£]?\d+|(?<!\d[,.]?)\d[\d,.]*(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(?:hours?|days?|weeks?|months?|years?)\s+(?:for|over)\s+\d+|\d\s+(?:hours?|hrs?|days?|weeks?|months?|units?|items?|pages?|copies|sessions?|visits?|nights?|shares?)\s*x\s*[$€£]?\d|mph|kph|kmh|miles?\s+(?:per|an|a)\s+hour|kilomet(?:er|re)s?\s+(?:per|an|a)\s+hour|there\s+(?:are|is)\s+\d[\d,.]*\s+[a-z]+\s+in|(?:has|contains|holds)\s+\d[\d,.]*\s+[a-z]+|(?<!\d[,.]?)\d[\d,.]*\s+[a-z]+\s+costs?\s+[$€£]?\d+|from\s+\d{1,2}(?::\d\d)?\s*(?:am|pm)\s+(?:to|until|till)\s+\d+|after\s+paying\s+(?:off\s+)?[$€£]?\d+|(?:kept|keeps|withheld|withholds|deducted|deducts|retained|retains)\s+[$€£]?\d[\d,.]*\s+of\s+(?:the|a|an|my|his|her|their|our|your)\s+[$€£]?\d+|cubed|root|double|twice|triple|dozen|average|mean|median|difference|quotient|(?<!\d[,.]?)\d[\d,.]*\s+(?:raised\s+)?to\s+the\s+(?:power|\d{1,3}(?:st|nd|rd|th)\s+power|[a-z]+\s+power))\b/i;
const BILL = String.raw`hours?|hrs?|miles?|days?|weeks?|months?|years?|units?|items?|pages?|copies|copy|sessions?|visits?|nights?|shares?|gallons?|liters?|litres?|tickets?|seats?|boxes|box`;
const same = (a, b) => { const s = w => w.toLowerCase().replace(/^hrs?$/, 'hour').replace(/^copies$/, 'copy').replace(/^boxes$/, 'box').replace(/^litres?$/, 'liter').replace(/s$/, ''); return s(a) === s(b); };
const N_ = String.raw`(\d[\d,]*(?:\.\d+)?)`, SHARE = { half: 2, third: 3, quarter: 4, fifth: 5, tenth: 10 };
const OF_WHAT = String.raw`(?:\s+of\s+(?:rent|storage|parking))?`;
const BILL_BEFORE = /\d|\b(?:and|both|each|every|double[ds]?|twice|triple[ds]?|thrice|treble[ds]?|quadruple[ds]?|half|halved|split|splits|splitting|shared?|sharing|between|among|amongst|divided)\b|\b[a-z]+s'(?=\s|$)/i;
const roundedPart = (n, a, b, rest) => { const x = Number(String(n).replace(/,/g, '')) * Number(a) / Number(b), y = (rest.match(/^\s*(?:=|(?:is|was|are|were|comes?\s+to|would\s+be|will\s+be|equals|leaves|nets?)\b)?\s*[$€£]?(\d[\d,]*(?:\.\d+)?)/i) || [])[1];
  return !Number.isInteger(x) && !!y && !/\./.test(y); };
const FEE_TAKEN = /\b(?:minus|less|after|plus)\s+(?:an?|the)\s*$/i;
const LIST_ITEM = String.raw`[-−‐]?\d+(?:,\d{3})*(?:\.\d+)?(?:\/\d+)?`, LIST_SEP = String.raw`\s*,\s+`;
const EN_DASH = String.fromCharCode(0x2013);
const LIST_END = String.raw`(?![\d/]|[.,]\d|\s*[-−${EN_DASH}‐+*/×÷^%]|\s+and\b|\s+(?!(?:is|are|was|equals|comes)\b)[a-z])`;
const listItems = (list, last) => list.split(/\s*,\s+/).concat(last).map(x => x.replace(/,/g, '').replace(/^[−‐]/, '-'));
const DIST = String.raw`miles?|mi|kilomet(?:er|re)s?|km`, SPEED = String.raw`miles?\s+(?:per|an|a)\s+hour|mph|mi\/h|kilomet(?:er|re)s?\s+(?:per|an|a)\s+hour|km\/h|kph|kmh`;
const sameDist = (d, s) => /^mi/i.test(d) === /^(?:mi|mph)/i.test(s);
const nearer = (p, x, y, down) => { const v = s => Number(s.replace(/,/g, '')), n = v(x), c = n * v(p) / 100, t = n + (down ? -c : c);
  return Math.abs(t - v(y)) <= Math.abs(c - v(y)) ? `(${x} ${down ? '-' : '+'} ${p}/100 * ${x})` : `(${p}/100 * ${x})`; };
const PW_SUM = String.raw`(?<!(?:[-+*/×÷^=]|\b(?:plus|minus|times|and|or|then|of|by))\s*[$€£]?\s*)`;
const PW_VERB = String.raw`\s+(?:(leaves)(?:\s+(?:you|me|us|them)\s+with)?|(saves)(?:\s+(?:you|me|us|them))?)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`;
const PW_HEDGED = /\b(?:about|around|roughly|approximately|approx|nearly|almost|only|just|still|over|under|up\s+to|at\s+least|at\s+most|not|never|hardly|barely|estimated|expected|typically|average|if|suppose|supposing|assume|assuming|imagine|maybe|perhaps|probably|supposedly|possibly|would|could|might|then)\b|n't\b|~|≈/i;
const NET_BEFORE = /\b(?:costs?|expenses?|fees?|tax(?:es)?|charges?|deductions?|damages|repairs?|cleaning|interest|liens?|also|too|again|another|additional|further|extra|other|quarterly|monthly|weekly|yearly|annually|daily|per|installments?|instalments?|we|they|our|their|us|them|everyone|plaintiffs|clients|claimants|heirs|tenants|roommates|owners|partners|siblings|children|kids|parents|firm|attorneys?|lawyers?|counsel|agents?|agency|brokers?|realtors?|managers?|lenders?|banks?|collectors?)\b/i;
const netFront = (off, str) => { const f = str.slice(0, off); return BILL_BEFORE.test(f) || PW_HEDGED.test(f) || NET_BEFORE.test(f); };
const netNum = s => Number(String(s).replace(/,/g, ''));
const priceWord = (all, p, x, left, s) => Number(p.replace(/,/g, '')) > 100 || PW_HEDGED.test(s) ? all
  : (x = x.replace(/,$/, ''), left ? `(${x} - ${p}/100 * ${x}) = ` : `(${p}/100 * ${x}) = `);
const TAXW = String.raw`(?:sales\s+tax|tax|vat|tip|gratuity|service\s+charge)`;
const TAX_END = String.raw`(?:\s+(costs?)(?=\s+[$€£]?\s?(\d[\d,]*(?:\.\d+)?))|(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|equals)\b)\s*[$€£]?\s?(\d[\d,]*(?:\.\d+)?)))`;
const TAX_AFTER = String.raw`(?<!\b(?:for|of|x|by|per|each|and|or|to|between|about|around|roughly|nearly|approximately|approx|almost|over|under|some)\s+)`;
const ONEIN_THING = String.raw`people|persons|adults|children|kids|voters|jurors|students|patients|workers|employees|teens|teenagers|men|women|users|players|cases|homes|households|families|babies|doctors|dentists|nurses|drivers|smokers|customers|buyers|owners|residents|citizens|members|respondents|readers|viewers|visitors|guests|chance`;
const ITEM_NOT = String.raw`daily|weekly|monthly|yearly|annual|annually|hourly|nightly|apiece|each|per|total|subtotal|people|person|pack|piece|count|and|or|with|plus|after|including|for|of|to|in|at|on|off|gallon|pound|lb|kg|kilo|kilogram|gram|g|liter|litre|l|ml|ounce|oz|foot|ft|inch|meter|metre|m|mile|mi|km|hour|hr|day|week|month|year|night|minute|min|second|sec|cent|dollar|buck|euro`;
const totalWith = (all, x, p, cost, y) => {
  const v = s => Number(s.replace(/,/g, '')), X = v(x), P = v(p), Y = v(y), half = 0.5 * 10 ** -((y.split('.')[1] || '').length);
  if (!(X > 0) || Math.abs(Y - X * P / 100) <= half || Math.abs(Y - X / (1 + P / 100)) <= half) return all;
  return `(${x} + ${p}/100 * ${x})${cost ? ' =' : ''}`;
};
const scaled = s => s.replace(new RegExp(String.raw`(?<=\b(?:of|off|on|the|an?|my|your|our|his|her|their|double|twice|triple)\s+[$€£]?)${N_}\s+(thousand|million|billion|trillion|dozen)\b(?!\s*(?:[.!?;]|$))`, 'gi'), (all, n, k) => {
  const [i, f = ''] = n.replace(/,/g, '').split('.');
  const [d, places] = /^dozen$/i.test(k) ? [String(BigInt(i + f) * 12n), f.length] : [`${i}${f}${'0'.repeat(Math.max(0, SCALES[k.toLowerCase()] - f.length))}`, Math.max(0, f.length - SCALES[k.toLowerCase()])];
  const w = d.padStart(places + 1, '0'), out = places ? `${w.slice(0, -places)}.${w.slice(-places)}`.replace(/\.?0+$/, '') : w;
  return out.replace(/^0+(?=\d)/, '');
});
const OTHER_MONEY = /\b(?:cents?|pennies|penny|pence|yen|euros?|pounds?|pesos?|rupees?|yuan|francs?|quarters?(?!\s+of\b)|dimes?|nickels?|cad|aud|gbp|eur|jpy|usd|canadian|australian)\b|[€£¥₹¢]/i;
const dollars = s => OTHER_MONEY.test(s) ? s : s.replace(new RegExp(String.raw`(?<=\d)\s+(?:dollars?|bucks)\b`, 'gi'), '');
const MIXPCT = new RegExp(String.raw`(?<![\w.,/])(\d+)\s+(\d+)\/(\d+)\s*(?:%|percent\b)\s+(?:of\s+(?:(?:the|an?|my|your|our|his|her|their)\s+)?|(?:contingency\s+fee|contingency|(?:attorney'?s?|legal)\s+fee|fee|commission|share|cut)\s+(?:on|of)\s+(?:(?:the|an?)\s+)?)[$€£]?${N_}(?:\s+(?!(?:is|was|are|for|over|per|a|an|each|and|or|daily|weekly|monthly|yearly)\b)[a-z]+)?(?=\s*(?:=|\b(?:is|was|are|comes\s+to|would\s+be|will\s+be|equals)\b))`, 'gi');
const mixpct = s => s.replace(MIXPCT, (all, a, b, c, n) => +b < +c && +c > 0 ? `(${String(BigInt(a) * BigInt(c) + BigInt(b))}/${String(BigInt(c) * 100n)} * ${n})` : all)
  .replace(new RegExp(String.raw`(?<![\w.,/])\d+\s+\d+\/\d+\s*(?:%|percent\b)`, 'gi'), 'a mixed percent');
const NOT_NOUN = 'is|was|equals|comes|would|will|squared|cubed|dozen|hundred|thousand|million|billion|trillion|times|percent|more|less|plus|minus';
const POW_ = String.raw`(?:\s*\^\s*(\d{1,3}))?`, pow = e => e ? `^${e}` : '';
const ORDW = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10 };
const POWW_ = String.raw`\s+(?:raised\s+)?to\s+the\s+(?:power\s+(?:of\s+)?(\d{1,3})|(\d{1,3})(?:st|nd|rd|th)\s+power|(${Object.keys(ORDW).join('|')})\s+power)`
  + String.raw`(?![\w.,]?\d|\s*,\s*\d|\s*\^|\s*%|\s+(?:squared|cubed|to\s+the|raised|power)\b|\s+(?!(?:is|was|are|equals|comes|would|will|makes|gives)\b)[a-z])`;
const powOf = (n, a, b, c) => { const m = a || b || String(ORDW[String(c).toLowerCase()]);
  return +n.replace(/,/g, '') === 0 && +m === 0 ? null : m; };
const SIGN_ = String.raw`(?<!(?:^|[\s(=+*×÷])[-−‐-―])`;
const MT_N = String.raw`(?<!${R_DASH}|[\d.,/])(\d{1,15}(?:,\d{3}){0,5}(?:\.\d{1,15})?)(?![\d,.]?\d|\s*\/|\s*%)`;
const MT_X = String.raw`(${R_DASH}?\d{1,15}(?:,\d{3}){0,5}(?:\.\d{1,15})?)(?![\d,.]?\d|\s*\/|\s*%)`;
const MT_OK = s => !PM_HEDGED.test(s) && !/\bno\s+(?:more|less|fewer)\b|\?|\btimes\b/i.test(s) && (s.match(/\bthan\b/gi) || []).length === 1;
const MT_SIGN = w => (/^(?:more|greater|bigger|larger)$/i.test(w) ? '+' : '-');
const TA_K = k => (/^(?:twice|double)$/i.test(k) ? 2 : 3);
const TA_OK = s => !PM_HEDGED.test(s) && !/\bno\s+(?:more|less|fewer)\b|\?|\bmore\s+than\b|\bless\s+than\b|,\s*[a-z]/i.test(s) && (s.match(/\bas\s+(?:much|many|big|large|long|high|tall|heavy|old|far|fast)\s+as\b/gi) || []).length === 1;
const MIXED = /(?<![\w.,/$€£])(\d{1,3}(?:,\d{3})+|\d+) ([1-9]\d{0,2})\/(\d{2,3}|[2-9])(?!\d|[.,]\d|\/\d|\s+\d+\/\d|\s*(?:%|percent\b))/g;
const MIXED_DATE = /\b(?:due|on|by|until|till|since|from|dated|born|before|after|through|starting|ending|expires|deadline)\s+$/i;
const MIXED_EXACT = [2, 4, 5, 8, 10, 16, 100];
const mixed = (all, w, a, b, off, str) => {
  if (!(+a < +b) || !(+b <= 16 || +b === 100) || /^(?:1\d|20)\d\d$/.test(w) || MIXED_DATE.test(str.slice(Math.max(0, off - 12), off))) return all;
  return MIXED_EXACT.includes(+b) ? `${w}${String(a / b).slice(1)}` : `(${w} + ${a}/${b})`;
};
const mixedValue = s => { const g = String(s).match(/^\((\d[\d,]*) \+ (\d+)\/(\d+)\)$/); return g ? netNum(g[1]) + g[2] / g[3] : netNum(s); };
const YEAR_COUNT = 'people|persons|voters?|votes|ballots|students|employees|workers|members|residents|households|homes|houses|cars|items|units|copies|seats|tickets|cases|jobs|acres|miles|pages|words|dollars';
const YEAR_AMOUNT = (all, n) => /^(?:19|20)\d\d$/.test(n) && !new RegExp(String.raw`[$€£]\s*${n}(?!\d)`).test(all)
  && !new RegExp(String.raw`(?<!\d)${n}\s+(?:${YEAR_COUNT})\b`, 'i').test(all);
const GROUPS = s => mixpct(s)
  .replace(MIXED, mixed)
  .replace(new RegExp(String.raw`${R_AT}${MT_N}\s+(more|less|fewer)\s+than\s+${MT_N}\s+(?:is|equals|makes|gives)\s+${MT_X}${R_END}`, 'gi'),
    (all, n, w, y, x, at, str) => (MT_OK(str) ? `(${y} ${MT_SIGN(w)} ${n}) = ${x}` : all))
  .replace(new RegExp(String.raw`${R_AT}${MT_X}\s+(?:is|equals)\s+${MT_N}\s+(more|less|fewer)\s+than\s+${MT_N}${R_END}`, 'gi'),
    (all, x, n, w, y, at, str) => (MT_OK(str) ? `${x} = (${y} ${MT_SIGN(w)} ${n})` : all))
  .replace(new RegExp(String.raw`${R_AT}${MT_X}\s+(?:is|are)\s+(more|greater|bigger|larger|less|smaller|fewer)\s+than\s+${MT_N}${R_END}`, 'gi'),
    (all, x, w, y, at, str) => (MT_OK(str) ? `${x} ${MT_SIGN(w) === '+' ? '>' : '<'} ${y}` : all))
  .replace(new RegExp(String.raw`${R_AT}(?:${MT_N}\s+times|(twice|double|triple))\s+as\s+(?:much|many|big|large|long|high|tall|heavy|old|far|fast)\s+as\s+[$€£]?${MT_N}\s+(?:is|equals|makes|gives)\s+[$€£]?${MT_X}${R_END}`, 'gi'),
    (all, n, k, y, x, at, str) => (TA_OK(str) ? `(${n ?? TA_K(k)} * ${y}) = ${x}` : all))
  .replace(new RegExp(String.raw`${R_AT}[$€£]?${MT_X}\s+(?:is|equals)\s+(?:${MT_N}\s+times|(twice|double|triple))\s+as\s+(?:much|many|big|large|long|high|tall|heavy|old|far|fast)\s+as\s+[$€£]?${MT_N}${R_END}`, 'gi'),
    (all, x, n, k, y, at, str) => (TA_OK(str) ? `${x} = (${n ?? TA_K(k)} * ${y})` : all))
  .replace(new RegExp(String.raw`(?<=\b(?:of|off|double|twice|triple)\s+[$€£]?)${N_}\s+(squared|cubed)\b`, 'gi'), (all, n, k) => `${n}^${/^s/i.test(k) ? 2 : 3}`)
  .replace(new RegExp(String.raw`(?<=\b(?<!power\s+)(?:of|off|double|twice|triple)\s+)${N_}${POWW_}`, 'gi'), (all, n, a, b, c) => { const m = powOf(n, a, b, c); return m === null ? all : `${n}^${m}`; })
  .replace(new RegExp(String.raw`\b(double|twice|triple)\s+${N_}\s*(?:%|percent\b)\s+of\s+[$€£]?${N_}${POW_}(?![\w.,]?\d|\s*\^|\s*(?:%|percent\b))`, 'gi'),
    (all, k, p, n, e) => `(${/^tr/i.test(k) ? 3 : 2} * ${p}/100 * ${n}${pow(e)})`)
  .replace(/(\d\s*(?:%|percent\b))\s+(?:share|cut|portion|stake)\s+of\b/gi, '$1 of')
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}\s+(?:(?:is|was|gets?|got)\s+)?(reduced|decreased|discounted|cut|lowered|increased|raised|marked\s+up|marked\s+down)\s+by\s+${N_}\s*(?:%|percent\b)\s*,?\s+(?:is|=|comes\s+to|leaves|gives|becomes|to|which\s+is)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, x, v, p) => { x = x.replace(/,$/, ''); return `(${x} ${/^(?:incr|rais|marked\s+up)/i.test(v) ? '+' : '-'} ${p}/100 * ${x}) = `; })
  .replace(new RegExp(String.raw`\b(reduced|decreased|discounted|cut|lowered|increased|raised)\s+by\s+${N_}\s*(?:%|percent\b),?\s+from\s+[$€£]?${N_}\s+to\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, v, p, x) => { x = x.replace(/,$/, ''); return `(${x} ${/^(?:incr|rais)/i.test(v) ? '+' : '-'} ${p}/100 * ${x}) = `; })
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}\s+(?:minus|less)\s+(?:(?:a|an|the|my|our|their|his|her|your)\s+)?${N_}\s*(?:%|percent\b)\s+(?:contingency\s+fee|(?:attorney'?s?|legal)\s+fee|fee|cut|commission|discount|tax|withholding|share),?\s+(?:is|=|comes\s+to|leaves|gives|which\s+is)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, x, p, off, str) => { if (BILL_BEFORE.test(str.slice(0, off)) || PW_HEDGED.test(str.slice(0, off))) return all;
      x = x.replace(/,$/, ''); return `(${x} - ${p}/100 * ${x}) = `; })
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s*(?:%|percent\b)\s+of\s+[$€£]?${N_}${POW_}(?![\w.,]?\d|\s*\^|\s*(?:%|percent\b))`, 'gi'), (all, p, n, e) => `(${p}/100 * ${n}${pow(e)})`)
  .replace(new RegExp(String.raw`(?<![\w.,-])(?:(?:a|an|one|1)\s+(third|quarter|fifth|tenth)|(half))\s+of\s+[$€£]?${N_}${POW_}(?![\w.,]?\d|\s*\^|\s*(?:%|percent\b))`, 'gi'),
    (all, k, h, n, e) => `(${n}${pow(e)} / ${SHARE[(k || h).toLowerCase()]})`)
  .replace(new RegExp(String.raw`\bafter\s+paying\s+(?:off\s+)?[$€£]?${N_}\s+of\s+(?:the|a|an|my|his|her|their|our|your)\s+[$€£]?${N_}(?:\s+(?:debt|loan|balance|bill|judgment|judgement|award|fine|fee|fees|rent|invoice))?,?\s+[$€£]?${N_}\s+(?:remains|is\s+left|is\s+still\s+owed|is\s+owed|is\s+due)(?=\s*[.!]?\s*$)`, 'gi'),
    (all, y, x, z, off, str) => { [x, y, z] = [x, y, z].map(c => c.replace(/,$/, ''));
      return netFront(off, str) || netNum(z) > netNum(x) - netNum(y) ? all : `(${x} - ${y}) = ${z}`; })
  .replace(new RegExp(String.raw`\b(?:kept|keeps|withheld|withholds|deducted|deducts|retained|retains)\s+[$€£]?${N_}\s+of\s+(?:the|a|an|my|his|her|your)\s+[$€£]?${N_}(?:\s+(?:security\s+)?deposit)?,\s+(?:returning|refunding|giving\s+back|paying\s+back)\s+[$€£]?${N_}(?=\s*[.!]?\s*$)`, 'gi'),
    (all, y, x, z, off, str) => { [x, y, z] = [x, y, z].map(c => c.replace(/,$/, ''));
      return netFront(off, str) || netNum(z) > netNum(x) - netNum(y) ? all : `(${x} - ${y}) = ${z}`; })
  .replace(new RegExp(String.raw`\b(?:(?:the|a|my|his|her|their|our|your)\s+)?(?:client|plaintiff|claimant|winner|seller|author|artist|creator|worker|employee|family|victim|owner|heir|heirs|beneficiary|i|he|she|we|you)\s+(?:nets?|netted|keeps?|kept|gets?|got|receives?|received|takes?\s+home|took\s+home)\s+[$€£]?${N_}\s+(?:from|of|out\s+of)\s+(?:a|an|the|my|his|her|their|our|your)\s+[$€£]?${N_}(?:\s+(?:settlement|award|judgment|judgement|verdict|recovery|sale|claim))?\s+after\s+(?:a|an|the|my|his|her|their|our|your)\s+(\d{1,2})\s*(?:%|percent\b)\s+(?:(?:contingency|attorney'?s?|legal)\s+)?(?:fee|commission|cut)(?=\s*[.!]?\s*$)`, 'gi'),
    (all, z, x, p, off, str) => { [x, z] = [x, z].map(c => c.replace(/,$/, ''));
      return netFront(off, str) || !(+p > 0) ? all : `(${x} - ${p}/100 * ${x}) = ${z}`; })
  .replace(new RegExp(String.raw`\bnet\s+of\s+(?:a|an|the)\s+(\d{1,2})\s*(?:%|percent\b)\s+(?:(?:contingency|attorney'?s?|legal)\s+)?(?:fee|commission|cut),\s+(?:the|a|an|my|his|her|your)\s+[$€£]?${N_}(?:\s+(?:settlement|award|judgment|judgement|verdict|recovery|sale|claim))?\s+(?:pays|paid|nets|netted|is|was|leaves|comes\s+to|=)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*[.!]?\s*$)`, 'gi'),
    (all, p, x, off, str) => { x = x.replace(/,$/, ''); return netFront(off, str) || !(+p > 0) ? all : `(${x} - ${p}/100 * ${x}) = `; })
  .replace(new RegExp(String.raw`(?<![\w.,])([$€£]?)${N_}(\s+(?:settlement|award|judgment|judgement|verdict|recovery|claim))?\s+(?:less|minus)\s+(\d+)\/(\d+)(\s+(?:(?:for|in)\s+)?(?:fees|(?:attorney'?s?|legal)\s+fees|costs))?\s+(?:nets|leaves|is|was|comes\s+to|=)\s+(?=[$€£]?(\d[\d,]*(?:\.\d+)?|\(\d[\d,]* \+ [1-9]\d{0,2}\/\d{1,3}\))\s*[.!]?\s*$)`, 'gi'),
    (all, sign, x, noun, a, b, fees, y, off, str) => { const n = x.replace(/,$/, '');
      if (netFront(off, str) || !(+a > 0 && +a < +b)) return all;
      const share = `(${n} - ${a}/${b} * ${n}) = `, t = mixedValue(y);
      if (sign || noun || fees) return share;
      return Math.abs(netNum(n) * (1 - a / b) - t) <= Math.abs(netNum(n) - a / b - t) ? share : `(${n} - ${a}/${b}) = `; })
  .replace(new RegExp(String.raw`(?<=\d)\s+(?:in\s+)?(?:costs|fees|interest|taxes|tax|billed|paid|owed|due|damages|expenses|penalties|credits?|refunds?|(?:security\s+)?deposit|retainer|judgment|judgement|award|settlement|balance|bill|rent|estate|verdict|payment|loan|recovery|salary|budget)\b(?=\s*(?:[-+*/=]|plus\b|minus\b|times\b|is\b|was\b|are\b|leaves\b|comes?\s+to\b|equals\b))`, 'gi'), '')
  .replace(/(\btimes\s+[$€£]?\d[\d,]*(?:\.\d+)?)\s+(?:an?|per)\s+(hour|day|week|month|year|night|shift)\s+(is|=|equals)\s+([$€£]?\d[\d,]*(?:\.\d+)?)\s+(?:an?|per)\s+(hour|day|week|month|year|night|shift)(?=\s*(?:[.;!]|$))/gi,
    (all, a, u1, v, b, u2) => u1.toLowerCase() === u2.toLowerCase() ? `${a} ${v} ${b}` : all)
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}\s+(?:an?|per|each)\s+(day|week|month|quarter|year)\s+(?:is|equals|comes\s+to|works\s+out\s+to|=)\s+[$€£]?${N_}\s+(?:an?|per|each)\s+(day|week|month|quarter|year)(?=\s*(?:[.;!]|$))`, 'gi'),
    (all, a, u1, b, u2) => {
      const K = { 'month>year': 12, 'quarter>year': 4, 'month>quarter': 3, 'day>week': 7 }, x = u1.toLowerCase(), y = u2.toLowerCase();
      const a1 = a.replace(/,$/, ''), b1 = b.replace(/,$/, '');
      return K[`${x}>${y}`] ? `(${a1} * ${K[`${x}>${y}`]}) = ${b1}` : K[`${y}>${x}`] ? `(${a1} / ${K[`${y}>${x}`]}) = ${b1}` : all;
    })
  .replace(new RegExp(String.raw`\b(?:simple\s+)?interest\b[^.;!=]{0,40}?\bon\s+(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+[a-z]+)?\s+(?:for|over)\s+(?:1|a|one)\s+year(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be)\b))`, 'gi'),
    all => all.replace(/^simple\s+/i, '').replace(/\s+(?:for|over)\s+(?:1|a|one)\s+year$/i, ''))
  .replace(new RegExp(String.raw`\bafter\s+(?:(?:a|an|the|my|his|her|their|our|your)\s+)?(\d{1,2})\s*(?:%|percent\b)\s+(?:contingency\s+fee|(?:attorney'?s?|legal)\s+fee|fee|cut|commission|share|tax|withholding),?\s+(?:(?:the|a|my|his|her|their|our|your)\s+)?(?:(?:client|plaintiff|claimant|winner|seller|author|artist|creator|worker|employee|family|victim|owner|heir|heirs|beneficiary|i|he|she|we|you)\s+)?(?:keeps?|kept|gets?|got|nets?|netted|receives?|received|takes?\s+home|took\s+home)\s+[$€£]?${N_}\s+of\s+(?:(?:a|an|the|my|his|her|their|our|your)\s+)?[$€£]?${N_}(?:\s+[a-z]+)?(?=\s*(?:[.;!]|$))`, 'gi'),
    (all, p, t, n) => `(${100 - +p}/100 * ${n.replace(/,$/, '')}) = ${t.replace(/,$/, '')}`)
  .replace(new RegExp(String.raw`(?<=\d)\s+less\s+(?=\(\d[\d,]* \+ [1-9]\d{0,2}\/\d{1,3}\)|[$€£]?\d[\d,]*(?:\.\d+)?(?![\d.,%]|\s*(?:%|percent\b|than\b)))`, 'gi'), ' minus ')
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}\s+(?:less|minus)\s+(the\s+)?[$€£]?${N_}(\s+(?:(?:already\s+)?(?:paid|received|deducted|withheld|advanced|credited)|(?:for|in)\s+(?:cleaning|damages|repairs|unpaid\s+rent|fees|costs|late\s+fees)))?\s+(leaves|is|was|comes\s+to|=)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, x, the, y, q, v, off, str) => !(the || q || /^l/i.test(v)) || BILL_BEFORE.test(str.slice(0, off)) || PW_HEDGED.test(str.slice(0, off)) ? all
      : `(${x.replace(/,$/, '')} - ${y.replace(/,$/, '')}) = `)
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}(?:\s+(?:settlement|award|judgment|judgement|verdict|recovery|claim))?\s+(?:minus|less|after)\s+(?:an?\s+|the\s+)?(?:(\d+)\/(\d+)|${N_}\s*(?:%|percent\b))\s+(?:(?:contingency|attorney'?s?|legal)\s+)?(?:fee|commission|cut)\s+(?:is|was|leaves|comes\s+to|=)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, x, a, b, p, off, str) => { const n = x.replace(/,$/, ''), rest = str.slice(off + all.length);
      if (BILL_BEFORE.test(str.slice(0, off)) || PW_HEDGED.test(str.slice(0, off))) return all;
      const [k, d] = a ? [+a, +b] : [+p, 100], fee = Number(n.replace(/,/g, '')) * k / d;
      const said = Number(((rest.match(/^[$€£]?(\d[\d,]*(?:\.\d+)?)/) || [])[1] || '').replace(/,/g, ''));
      if (!(k > 0 && (a ? k < d : k <= 100)) || said === fee || (a && roundedPart(n, a, b, rest))) return all;
      return a ? `(${n} - ${a}/${b} * ${n}) = ` : `(${n} - ${p}/100 * ${n}) = `; })
  .replace(new RegExp(String.raw`(?<![\w.,/])(\d+)\/(\d+)\s+(?:contingency\s+)?(?:fee|share|commission|interest|cut|royalty)\s+on\s+(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+(?!(?:daily|weekly|monthly|quarterly|per|a|each|for|over|and|or|is|was|are)\b)[a-z]+)?(?=\s*(?:=|\b(?:is|was|are|comes\s+to|would\s+be|will\s+be|equals)\b))`, 'gi'),
    (all, a, b, n, off, str) => FEE_TAKEN.test(str.slice(0, off)) || roundedPart(n, a, b, str.slice(off + all.length)) ? all : `(${a}/${b} * ${n})`)
  .replace(new RegExp(String.raw`\b(?:treble|trebled|tripled|triple)\s+damages\s+(?:on|of)\s+[$€£]?${N_}(?=\s*(?:=|\b(?:is|are|was|were|come\s+to|comes\s+to|would\s+be|will\s+be)\b))`, 'gi'), (all, n) => `(3 * ${n})`)
  .replace(new RegExp(String.raw`\bdamages\s+of\s+[$€£]?${N_}\s+(doubled|trebled|tripled)(?=\s*(?:=|\b(?:is|are|was|were|come\s+to|comes\s+to|would\s+be|will\s+be)\b))`, 'gi'), (all, n, k) => `(${/^d/i.test(k) ? 2 : 3} * ${n})`)
  .replace(new RegExp(String.raw`(?<![\w.,])(?:${N_}\s*(?:%|percent\b)|(?:a|one|1)[\s-](third|quarter|fifth|tenth))\s+(?:contingency\s+fee|contingency|(?:attorney'?s?|legal|management|processing|finder'?s|late)\s+fee|fee|sales\s+tax|tax|commission|retainer|interest|tip|gratuity|royalty|deposit|down\s+payment|surcharge|penalty|service\s+charge)\s+on\s+(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+(?!(?:daily|weekly|monthly|quarterly|per|a|each|for|over|and|or|is|was|shares?|copies|copy|units?|items?|pages?|books?|tickets?|people|persons?|members?|acres?|hours?|days?)\b)[a-z]+)?(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|equals)\b))`, 'gi'),
    (all, p, k, n, off, str) => FEE_TAKEN.test(str.slice(0, off)) || YEAR_AMOUNT(all, n) ? all : p ? `(${p}/100 * ${n})` : `(${n} / ${SHARE[k.toLowerCase()]})`)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s*(?:%|percent\b)\s+(?:daily|weekly|monthly|quarterly|yearly|annual)\s+(?:late\s+)?(?:fee|charge|penalty|finance\s+charge|service\s+charge)\s+on\s+(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+(?:balance|bill|debt|invoice|account))?(?=\s*(?:=|\b(?:is|was|comes\s+to)\b)\s*[$€£]?\d[\d,]*(?:\.\d+)?\s*[.!]?\s*$)`, 'gi'),
    (all, p, n, off, str) => FEE_TAKEN.test(str.slice(0, off)) || BILL_BEFORE.test(str.slice(0, off)) || PW_HEDGED.test(str.slice(0, off)) ? all : `(${p}/100 * ${n.replace(/,$/, '')})`)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s*(?:%|percent\b)\s+off\s+(?:of\s+)?(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+(?!(?:${NOT_NOUN})\b)[a-z]+)?(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|equals)\b)\s*[$€£]?\s?(\d[\d,]*(?:\.\d+)?))`, 'gi'),
    (all, p, x, y) => nearer(p, x, y, true))
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s*(?:%|percent\b)\s+(discount|reduction|decrease|cut|markup|mark-up|raise|increase|rise|hike)\s+(?:on|to|for)\s+(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+(?!(?:${NOT_NOUN})\b)[a-z]+)?(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|equals)\b)\s*[$€£]?\s?(\d[\d,]*(?:\.\d+)?))`, 'gi'),
    (all, p, w, x, y) => nearer(p, x, y, /^(?:dis|red|dec|cut)/i.test(w)))
  .replace(new RegExp(String.raw`${PW_SUM}(?<![\w.,])${N_}\s*(?:%|percent\b)\s+off\s+(?:of\s+)?(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+(?!(?:${NOT_NOUN}|leaves|saves)\b)[a-z]+)?${PW_VERB}`, 'gi'),
    (all, p, x, l, sv, at, s) => priceWord(all, p, x, l, s))
  .replace(new RegExp(String.raw`${PW_SUM}(?<![\w.,])${N_}\s*(?:%|percent\b)\s+(?:discount|reduction|markdown|mark-down|cut)\s+(?:on|to|for|off)\s+(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+(?!(?:${NOT_NOUN}|leaves|saves)\b)[a-z]+)?${PW_VERB}`, 'gi'),
    (all, p, x, l, sv, at, s) => priceWord(all, p, x, l, s))
  .replace(new RegExp(String.raw`${PW_SUM}(?<![\w.,])[$€£]?${N_}(?:\s+(?!(?:${NOT_NOUN}|after|with)\b)[a-z]+)?\s+(?:after|with)\s+(?:an?\s+|the\s+)?${N_}\s*(?:%|percent\b)\s+(?:off|discount|reduction|markdown|mark-down)\s+(?:is|=|comes\s+to|leaves|gives|becomes|which\s+is)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, x, p, at, s) => priceWord(all, p, x, true, s))
  .replace(new RegExp(String.raw`(?<=^\s*|[.;:!?,]\s+)(?:a|an|the|my|your|our|their|his|her|this|that)\s+[$€£]?${N_}\s+(?![a-z]*[^s]s\b)(?!(?:${NOT_NOUN}|${ITEM_NOT})\b)[a-z]+\s+(?:plus|with|after)\s+(?:an?\s+)?${N_}\s*(?:%|percent\b)\s+${TAXW}${TAX_END}`, 'gi'),
    (all, x, p, cost, y1, y2) => totalWith(all, x, p, cost, y1 ?? y2))
  .replace(new RegExp(String.raw`${PW_SUM}(?<![\w.,])${TAX_AFTER}[$€£]?${N_}\s+(?:plus|with|after)\s+(?:an?\s+)?${N_}\s*(?:%|percent\b)\s+${TAXW}${TAX_END}`, 'gi'),
    (all, x, p, cost, y1, y2) => totalWith(all, x, p, cost, y1 ?? y2))
  .replace(new RegExp(String.raw`\b(?:percent(?:age)?\s+)?(increase|rise|jump|growth|gain|decrease|drop|fall|decline)\s+from\s+[$€£]?${N_}\s+to\s+[$€£]?${N_}(?=\s*(?:=|\b(?:is|was|equals)\b)\s*(?:an?\s+)?\d[\d,]*(?:\.\d+)?\s*(?:%|percent\b))`, 'gi'),
    (all, w, a, b) => /^(?:dec|dro|fal)/i.test(w) ? `(1 - ${b} / ${a})` : `(${b} / ${a} - 1)`)
  .replace(new RegExp(String.raw`\b(?:(?:late|attorney'?s?|legal|contingency|management|processing|service)\s+fee|fee|sales\s+tax|tax|commission|retainer|tip|gratuity|royalty|surcharge|penalty|interest)\s+of\s+${N_}\s*(?:%|percent\b)\s+on\s+(?:an?\s+|the\s+)?[$€£]?${N_}(?:\s+(?!(?:daily|weekly|monthly|quarterly|per|a|each|for|over|and|or|is|was|shares?|copies|copy|units?|items?|pages?|books?|tickets?|people|persons?|members?|acres?|hours?|days?)\b)[a-z]+)?(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|equals)\b))`, 'gi'),
    (all, p, n) => YEAR_AMOUNT(all, n) ? all : `(${p}/100 * ${n})`)
  .replace(new RegExp(String.raw`(?<![\w.,/-])(?:${N_}\s*(?:%|percent\b)|(\d+)\/(\d+)|(?:a|one)\s+(third|quarter|fifth|tenth)|(half))\s+of\s+(?:the|an?|my|your|our|his|her|their)\s+[$€£]?${N_}(?:\s+(?!(?:daily|weekly|monthly|quarterly|per|a|each|for|over|and|or|is|was|more|less|fewer|extra|times|squared|cubed|percent|plus|minus|with|including|includes|excluding|without|after|before)\b)[a-z]+){0,2}(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|equals)\b))`, 'gi'),
    (all, p, a, b, k, h, n) => YEAR_AMOUNT(all, n) ? all : p ? `(${p}/100 * ${n})` : a ? `(${a}/${b} * ${n})` : `(${n} / ${SHARE[(k || h).toLowerCase()]})`)
  .replace(new RegExp(String.raw`(?<![\w.,/-])${N_}\s+(?:out\s+)?of\s+(?:the\s+)?${N_}(?:\s+[a-z]+)?(?=\s*(?:=|\b(?:is|was|are|equals|comes\s+to)\b)\s*${N_}\s*(?:%|percent\b))`, 'gi'),
    (all, a, b) => `(${a} / ${b})`)
  .replace(new RegExp(String.raw`(?<=^\s*|[.;!?]\s+|(?:^|[.;!?]\s+)(?:so|thus|hence),?\s+)[$€£]?(\d{1,12}(?:,\d{3}){0,3})\s+in\s+(?:every\s+)?[$€£]?(?!(?:19|20)\d\d(?![\d,.]))(\d{1,12}(?:,\d{3}){0,3})(?![\d.,]?\d)(?:\s+(?:${ONEIN_THING})\b)?(?=\s*(?:=|\b(?:is|was|are|equals)\b)\s*\d[\d.]*(?<![.,])\s*(?:%|percent\b))`, 'gi'),
    (all, a, b) => { const A = Number(a.replace(/,/g, '')), B = Number(b.replace(/,/g, '')); return B > 0 && A <= B ? `(${a} / ${b})` : all; })
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
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}\s+divided\s+(?:(?:equally|evenly)\s+)?(?:among|between|by)\s+(?:the\s+)?${N_}\s+([a-z]+)\s+(is|was|comes\s+to)\s+[$€£]?${N_}\s+(?:per|a|each|for\s+each)\s+([a-z]+)(?=\s*[.!]?\s*$)`, 'gi'),
    (all, n, a, w1, v, y, w2, off, str) => same(w1, w2) && !BILL_BEFORE.test(str.slice(0, off)) && !PW_HEDGED.test(str.slice(0, off))
      ? `(${n.replace(/,$/, '')} / ${a.replace(/,$/, '')}) ${v} ${y.replace(/,$/, '')}` : all)
  .replace(new RegExp(String.raw`\b(?:bill|debt|balance|loan|fee|total|amount|cost|price|invoice|judgment|judgement|settlement|tuition|purchase)\s+of\s+[$€£]?${N_}\s+(?:is\s+)?(?:paid|payable|repaid|split|divided)\s+(?:in|into|over)\s+${N_}\s+equal\s+(?:installments|instalments|payments|parts|shares)\s+(is|are|was|were|comes?\s+to|of)\s+[$€£]?${N_}\s+each(?=\s*[.!]?\s*$)`, 'gi'),
    (all, t, n, v, x, off, str) => BILL_BEFORE.test(str.slice(0, off)) || PW_HEDGED.test(str.slice(0, off)) ? all : `(${t.replace(/,$/, '')} / ${n}) = ${x.replace(/,$/, '')}`)
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
  .replace(new RegExp(String.raw`\b(?:costs?|fees?|charges?|damages|interest|expenses?|rent|deposit|tax|taxes|penalt(?:y|ies)|fines?|retainer|award)\s+of\s+[$€£]?${N_}\s+(?:and|plus)\s+(?:[a-z]+\s+){0,2}(?:costs?|fees?|charges?|damages|interest|expenses?|rent|deposit|tax|taxes|penalt(?:y|ies)|fines?|retainer|award)\s+of\s+[$€£]?${N_},?\s+(?:totals?|total\s+to|come\s+to|comes\s+to|are|is|makes?|=)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, a, b, off, str) => BILL_BEFORE.test(str.slice(0, off)) || PW_HEDGED.test(str.slice(0, off)) ? all : `(${a.replace(/,$/, '')} + ${b.replace(/,$/, '')}) = `)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+(${BILL})${OF_WHAT}\s+at\s+[$€£]?${N_}(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(${BILL}),\s+(earning|making|totaling|totalling|costing|for\s+a\s+total\s+of|or|for|billed\s+at|which\s+(?:is|was|comes\s+to|came\s+to|totals|equals|would\s+be))\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, n, u1, r, u2, j, off, str) => same(u1, u2) && !BILL_BEFORE.test(str.slice(0, off))
      && !(/^which/i.test(j) && /^h/i.test(u1) && Number(n.replace(/,/g, '')) > 40) ? `(${n} * ${r}) = ` : all)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+(${BILL})${OF_WHAT}\s+at\s+[$€£]?${N_}(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(${BILL})(?=\s*(?:=|\b(?:is|was|are|were|comes?\s+to|totals?|would\s+be|will\s+be|gives)\b))`, 'gi'),
    (all, n, u1, r, u2, off, str) => same(u1, u2) && !BILL_BEFORE.test(str.slice(0, off)) ? `(${n} * ${r})` : all)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+(${BILL})(?:\s+of\s+[a-z]+)?\s+at\s+[$€£]?${N_}(?:,?\s+which\s+is|,\s+or|\s*=|\s+(?:is|was|comes\s+to|would\s+be|will\s+be))\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, n, u, r, off, str) => BILL_BEFORE.test(str.slice(0, off)) ? all : `(${n} * ${r.replace(/,$/, '')}) = `)
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
  .replace(new RegExp(String.raw`\beach\s+of\s+(?:the\s+)?${N_}\s+[a-z]+\s+(?:gets?|receives?|takes?|inherits?|is\s+owed|owes?|pays?)\s+[$€£]?${N_}\s+of\s+(?:the\s+|an?\s+|their\s+|our\s+|its\s+)?[$€£]?${N_}(?:\s+[a-z]+)?(?=\s*[.!]?\s*$)`, 'gi'),
    (all, m, x, n, off, str) => /^(?:1[89]|20)\d\d$/.test(n) || BILL_BEFORE.test(str.slice(0, off)) || PW_HEDGED.test(str.slice(0, off))
      ? all : `(${n.replace(/,$/, '')} / ${m}) = ${x.replace(/,$/, '')}`)
  .replace(new RegExp(String.raw`\bper\s+diem\s+(?:of|at)\s+[$€£]?${N_}(?:\s+(?:an?|per)\s+day)?\s+(?:for|over)\s+${N_}\s+days?(?=\s*(?:=|\b(?:is|was|are|were|comes?\s+to|totals?|would\s+be|will\s+be)\b)\s*[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, r, n, off, str) => BILL_BEFORE.test(str.slice(0, off)) ? all : `(${r.replace(/,$/, '')} * ${n})`)
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(${BILL})\s+(?:for|over)\s+${N_}\s+(${BILL})(,\s+which(?=\s+is\b))?(?=\s*(?:=|\b(?:is|was|are|were|comes?\s+to|totals?|would\s+be|will\s+be|gives)\b))`, 'gi'),
    (all, r, u1, n, u2, w, off, str) => same(u1, u2) && !BILL_BEFORE.test(str.slice(0, off))
      && /^\s*(?:=|is|was|are|were|comes?\s+to|totals?|would\s+be|will\s+be|gives)\s+[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$)/i.test(str.slice(off + all.length)) ? `(${r} * ${n})` : all)
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}(?:\s+(?:an?|per|each)\s+|\s*\/\s*)(${BILL})\s+(?:for|over)\s+${N_}\s+(${BILL}),\s+(?:totall?ing|for\s+a\s+total\s+of)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*[.!]?\s*$)`, 'gi'),
    (all, r, u1, n, u2, off, str) => same(u1, u2) && !BILL_BEFORE.test(str.slice(0, off)) && !PW_HEDGED.test(str.slice(0, off))
      ? `(${r.replace(/,$/, '')} * ${n.replace(/,$/, '')}) = ` : all)
  .replace(new RegExp(String.raw`(?<![\w.,])[$€£]?${N_}\s+times\s+${N_}\s+(${BILL})(?=\s*(?:=|\b(?:is|was|are|were|comes?\s+to|totals?|would\s+be|will\s+be)\b)\s*[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$))`, 'gi'),
    (all, r, n, u, off, str) => {
      const k = (str.slice(Math.max(0, off - 40), off).match(/\b(hour|dai|week|month|night|year)ly\b/i) || [])[1];
      return BILL_BEFORE.test(str.slice(0, off)) || (k && !same(k.replace(/^dai$/i, 'day'), u)) ? all : `(${r.replace(/,$/, '')} * ${n})`; })
  .replace(new RegExp(String.raw`\b(hour|dai|week|month|night|year)ly\s+(?:fee|rate|charge|price|cost|wage|pay)\s+(?:of|is|was)\s+[$€£]?${N_}\s+(?:for|over)\s+${N_}\s+(${BILL}),?(?=\s*(?:=|\b(?:is|was|comes\s+to|totals?|would\s+be|will\s+be)\b)\s*[$€£]?\d[\d,]*(?:\.\d+)?\s*[.!]?\s*$)`, 'gi'),
    (all, k, r, n, u, off, str) => same(k.replace(/^dai$/i, 'day'), u) && !BILL_BEFORE.test(str.slice(0, off)) && !PW_HEDGED.test(str.slice(0, off))
      ? `(${r.replace(/,$/, '')} * ${n.replace(/,$/, '')})` : all)
  .replace(new RegExp(String.raw`\b(?:judgment|judgement|loan|debt|balance|deposit|principal|award|note|bond)\s+of\s+[$€£]?${N_}\s+at\s+${N_}\s*(?:%|percent\b)\s+(?:simple\s+)?(?:annual\s+|yearly\s+)?interest\s+(?:for|over)\s+(?:1|one|a)\s+year\s+(?:accrues|earns|yields|generates)\s+(?=[$€£]?\d[\d,]*(?:\.\d+)?\s*[.!]?\s*$)`, 'gi'),
    (all, p, r, off, str) => /\b(?:apr|apy|effective|compound(?:ed|ing)?|daily|monthly|quarterly|semi-?annual(?:ly)?)\b/i.test(str) || BILL_BEFORE.test(str.slice(0, off)) || PW_HEDGED.test(str.slice(0, off))
      ? all : `(${r}/100 * ${p.replace(/,$/, '')}) = `)
  .replace(new RegExp(String.raw`\b(?:simple\s+interest\s+(?:of|at)\s+${N_}\s*(?:%|percent\b)|(?<!\d,?)${N_}\s*(?:%|percent\b)\s+simple\s+interest|interest\s+(?:of|at)\s+${N_}\s*(?:%|percent\b)\s+simple)(?:\s+(?:a|per)\s+year|\s+annually|\s+yearly)?\s+on\s+(?:a\s+|the\s+)?[$€£]?${N_}(?:\s+[a-z]+)?\s+(?:for|over)\s+${N_}\s+(years?|months?)(?=\s*(?:=|\b(?:is|was|comes\s+to|would\s+be|will\s+be|gives)\b))`, 'gi'),
    (all, r1, r2, r3, p, n, u, off, str) => /^\s*(?:=|is|was|comes\s+to|would\s+be|will\s+be|gives)\s+(?:about\s+|roughly\s+|approximately\s+)?[$€£]?\d[\d,]*(?:\.\d+)?\s*(?:[.;!]|$)/i.test(str.slice(off + all.length))
      ? `(${p} * ${r1 || r2 || r3}/100 * ${n}${/^m/i.test(u) ? '/12' : ''})` : all)
  .replace(/\b(?:the\s+)?(sum|product)\s+of\s+(-?\d[\d,]*(?:\.\d+)?)\s+and\s+(-?\d[\d,]*(?:\.\d+)?)\b(?!\s+and\b|[.,]\d)/gi,
  (all, k, a, b) => `(${a} ${k.toLowerCase() === 'sum' ? '+' : '*'} ${b})`)
  .replace(new RegExp(String.raw`(?<![\w.,^/])${SIGN_}${N_}\s+(squared|cubed)\b`, 'gi'), (all, n, k) => `(${n}^${/^s/i.test(k) ? 2 : 3})`)
  .replace(new RegExp(String.raw`(?<![\w.,^/$€£])${SIGN_}(?<![-−‐-―+*×÷/^]\s+|\b(?:of|off|plus|minus|times|by|over|and|less|than|from|into|per|with|power|double|twice|triple|half)\s+)${N_}${POWW_}`, 'gi'),
    (all, n, a, b, c) => { const m = powOf(n, a, b, c); return m === null ? all : `(${n}^${m})`; })
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
  .replace(new RegExp(String.raw`\b(double|twice|triple)\s+${N_}${POW_}(?![\w.,]?\d|\s*\^)`, 'gi'), (all, k, n, e) => `(${/^tr/i.test(k) ? 3 : 2} * ${n}${pow(e)})`)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+(doubled|tripled|halved)\b(?:,(?=\s*(?:=|\b(?:is|are|was|were|equals)\b)))?`, 'gi'), (all, n, k) => /^h/i.test(k) ? `(${n} / 2)` : `(${/^t/i.test(k) ? 3 : 2} * ${n})`)
  .replace(new RegExp(String.raw`(?<![\w.,])${N_}\s+dozen\b`, 'gi'), (all, n) => `(${n} * 12)`)
  .replace(new RegExp(String.raw`(?<![\w.,/])(\d+)\/(\d+)\s+of\s+[$€£]?${N_}${POW_}(?![\w.,/]?\d|\s*\^|\s*(?:%|percent\b))`, 'gi'), (all, a, b, n, e) => `(${a}/${b} * ${n}${pow(e)})`)
  .replace(new RegExp(String.raw`\b(?:the\s+)?(?:average|mean)\s+of\s+(${LIST_ITEM}(?:${LIST_SEP}${LIST_ITEM})*)\s*,?\s+and\s+(${LIST_ITEM})${LIST_END}`, 'gi'),
    (all, list, last) => { const xs = listItems(list, last); return `(${xs.map(x => `${x}/${xs.length}`).join(' + ')})`; })
  .replace(new RegExp(String.raw`\b(?:the\s+)?median\s+of\s+(${LIST_ITEM}(?:${LIST_SEP}${LIST_ITEM})*)\s*,?\s+and\s+(${LIST_ITEM})${LIST_END}`, 'gi'),
    (all, list, last) => {
      const xs = listItems(list, last);
      if (xs.some(x => x.includes('/') || /^-?0\d/.test(x) || x.replace(/^-|\./g, '').replace(/^0+/, '').length > 15)) return all;
      const s = xs.slice().sort((a, b) => Number(a) - Number(b)), h = s.length >> 1;
      return s.length % 2 ? `(${s[h]} + 0)` : `(${s[h - 1]}/2 + ${s[h]}/2)`;
    })
  .replace(new RegExp(String.raw`\b(?:the\s+)?(difference|quotient)\s+(?:of|between)\s+${N_}\s+and\s+${N_}\b(?![.,]\d|\s+and\b)`, 'gi'),
    (all, k, a, b) => /^d/i.test(k) ? (Number(a.replace(/,/g, '')) >= Number(b.replace(/,/g, '')) ? `(${a} - ${b})` : all) : `(${a} / ${b})`)
  .replace(/(\d),\)/g, '$1)');
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
const MATHY_THAN = /\b(?:(?<!\d[,.]?)\d[\d,.]*|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:more|less|fewer)\s+than\s+\d|\d\s+(?:is|are)\s+(?:more|greater|bigger|larger|less|smaller|fewer)\s+than\s+\d/i;
export function spelled(s) {
  if (!MATHY.test(s) && !MATHY_THAN.test(s)) return { text: s, typos: [] };
  const typos = [];
  let t = s.replace(new RegExp(String.raw`\b(${Object.keys(TENS).join('|')})[- ]([a-z]+)\b`, 'gi'), (all, a, b) => {
    const x = TENS[a.toLowerCase()], y = NUMWORD.get(b.toLowerCase());
    return x !== undefined && y !== undefined && y > 0 && y < 10 ? String(x + y) : all;
  });
  const words = fix => t.replace(/\b[a-z]+\b/gi, w => {
    const lw = w.toLowerCase();
    if (NUMWORD.has(lw)) return String(NUMWORD.get(lw));
    if (!fix || lw.length < 4 || /^(?:plus|minus|times|equals?|divided|multiplied|by|to|is|thirds?|fourths?|fifths?|sixths?|sevenths?|eighths?|ninths?|tenths?)$/.test(lw) || new RegExp(`^(?:${BILL})$`).test(lw)) return w;
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

const LINE_END = /(?<![+\-*/=<>×÷·,(:;&]|\b(?:is|are|was|were|be|of|and|or|but|so|the|a|an|to|than|equals|by|in|at|on|for|with|from|as|that|which|then|plus|minus|times))[ \t]*(?:\r?\n[ \t]*)+(?=[A-Z0-9"“($€£√-])/;
function splitSentences(text) {
  return text.split(LINE_END).flatMap(part => part.replace(/\s+/g, ' ').split(/(?:(?<=[.?])|(?<=\S!)(?<!\s!))\s+(?=[A-Z0-9"“(])/))
    .map(s => s.trim()).filter(s => s.length > 1)
    .map(s => (twoWays(s) && !s.endsWith('͏') ? s + '͏' : s));
}
const HEARD = [];
export const notedCount = () => HEARD.length;
export function sentences(text) {
  const out = splitSentences(text);
  if (typeof document !== 'undefined' || globalThis.HHH_PAGE) {
    const now = Date.now();
    for (const s of out) HEARD.push({ s, t: now });
    while (HEARD.length > 80 || (HEARD.length && now - HEARD[0].t > NOTE_LIFE)) HEARD.shift();
  }
  return out;
}

const pctDecimal = p => {
  const [i, f = ''] = p.replace(/,/g, '').split('.'), w = i.padStart(3, '0');
  return `${w.slice(0, -2).replace(/^0+(?=\d)/, '')}.${w.slice(-2)}${f}`;
};
const CMP_AFTER = new RegExp(String.raw`^\s*(?:[a-z]+\s+){0,2}?(?:(?:less|more|fewer|greater|bigger|smaller|higher|lower|larger|older|younger|longer|shorter|further|farther|cheaper|heavier|lighter)\s+than|short\s+of|(?:times|\*)\s+(?:as|more|less|bigger|smaller|larger|greater|fewer))\b`, 'i');
const norm = x => x.replace(/[−–]/g, '-').replace(/ /g, ' ');
const UPW = String.raw`rises|rise|rose|risen|increases|increase|increased|gains|gain|gained|jumps|jump|jumped|growth|grew|grows|grow|climbs|climb|climbed|hikes|hike|raises|raise|up`;
const DOWNW = String.raw`drops|drop|dropped|falls|fall|fell|fallen|decreases|decrease|decreased|declines|decline|declined|cuts|cut|loss|lost|dips|dip|dipped|slid|slides|slide|slumps|slump|slumped|reductions|reduction|down`;
const NOT_AMT = String.raw`(?![A-Za-z/]|[:-]\d|\s*(?:%|percent|per\s+cent\b|points?\b|pts\b|pp\b|bps\b|basis\b|am\b|pm\b|a\.m\.|p\.m\.|o'?clock\b))`;
const AMT_ = (n, last) => String.raw`(?<${n}c>[$€£])?\s?(?<${n}>${NUM})(?!\d)(?:\s+(?<${n}s>thousand|million|billion|trillion)\b)?${NOT_AMT}` + (last ? String.raw`(?!\s*(?:to|-)\s*[$€£]?\d)` : '');
const PCT_ = String.raw`(?<p>${NUM})\s*(?:%|percent\b|per\s+cent\b)`, PWORD = String.raw`(?<w>${UPW}|${DOWNW})\b`;
const OTHER_BASE = String.raw`(?!\s+(?:from|since|on|over|versus|vs\.?|than|compared|against|relative)\b)`;
const PCHG = [
  new RegExp(String.raw`\bfrom\s+${AMT_('a')}\s+to\s+${AMT_('b')}\s*,?\s*(?:(?:which\s+is|that\s+is|is|was|for|or|making\s+it)\s+)?(?:an?\s+)?${PCT_}\s+${PWORD}${OTHER_BASE}`, 'gi'),
  new RegExp(String.raw`\b${PWORD}\s+(?:by\s+)?${PCT_}\s*,?\s*from\s+${AMT_('a')}\s+to\s+${AMT_('b', true)}`, 'gi'),
  new RegExp(String.raw`\ban?\s+${PCT_}\s+${PWORD}\s+from\s+${AMT_('a')}\s+to\s+${AMT_('b', true)}`, 'gi'),
];
const UP = new RegExp(String.raw`^(?:${UPW})$`, 'i');
function pctChange(g) {
  const year = (c, x, sc) => !c && !sc && /^[12]\d{3}$/.test(x);
  if (year(g.ac, g.a, g.as) || year(g.bc, g.b, g.bs) || !g.as !== !g.bs || (g.ac && g.bc && g.ac !== g.bc)) return null;
  const k = sc => (sc ? 10 ** SCALES[sc.toLowerCase()] : 1), val = (x, sc) => Number(plainNum(x)) * k(sc);
  const half = (x, sc) => 0.5 * 10 ** -(plainNum(x).split('.')[1] || '').length * k(sc);
  const a = val(g.a, g.as), b = val(g.b, g.bs), ha = half(g.a, g.as), hb = half(g.b, g.bs), p = Number(plainNum(g.p)), hp = half(g.p);
  if (!(a - ha > 0)) return null;
  const up = UP.test(g.w), ch = (x, y) => (up ? y - x : x - y) / x * 100;
  const lo = up ? ch(a + ha, b - hb) : ch(a - ha, b + hb), hi = up ? ch(a - ha, b + hb) : ch(a + ha, b - hb);
  const v = (x, sc) => plainNum(x) + (sc ? ` * 10^${SCALES[sc.toLowerCase()]}` : ''), A = v(g.a, g.as), B = v(g.b, g.bs);
  const ps = plainNum(g.p), c = ch(a, b), expr = `(${up ? `${B} - ${A}` : `${A} - ${B}`}) / (${A}) * 100`;
  const z = ps.includes('.') || !/[1-9]/.test(ps) ? 0 : ps.length - ps.replace(/0+$/, '').length, unit = 2 * hp * 10 ** z;
  const capIn = (x, f) => Math.abs(x - p) <= Math.min(unit / 2, 0.02 * Math.abs(x)) * f;
  if (Math.abs(c - p) < hp * (1 - 1e-9)) return capIn(c, 1 - 1e-6) ? `${expr} ~= ${ps}` : `abs(${expr} - ${ps}) < 0.${'0'.repeat((ps.split('.')[1] || '').length)}5`;
  if (!(hi < p - hp || lo > p + hp)) return null;
  return capIn(Math.min(Math.max(p, lo), hi), 1 + 1e-6) ? null : `${expr} ~= ${ps}`;
}
const R_AT = String.raw`(?<=^\s*|[.;:!?,]\s+|\(\s*|\b(?:number|value|answer|result|figure|reading|measurement|estimate|average|mean|median|total|price|cost|score)\s+)`;
const R_X = String.raw`${R_AT}(?<x>${NUM})(?!\d)(?<xp>\s*(?:%|percent\b))?`;
const R_Y = String.raw`(?<y>${NUM})(?!\d)(?<yp>\s*(?:%|percent\b))?`;
const R_COUNT = String.raw`\d|one|two|three|four|five|six|seven|eight`;
const R_STEP = String.raw`(?:(?:the\s+)?nearest\s+(?<near>whole\s+number|whole|integer|units?|ones?|tenths?|hundredths?|thousandths?|ten\s+thousand|hundred\s+thousand|tens?|hundreds?|thousands?|millions?)`
  + String.raw`|(?<dp>${R_COUNT})\s+(?:decimal\s+places?|decimals?|dp)|(?<sf>${R_COUNT})\s+(?:significant\s+(?:figures?|digits?)|sig\.?\s*figs?|s\.?f\.?))\b`;
const R_END = String.raw`(?!\.\.|\.?\d|\s*,\s*\d)(?=\s*(?:$|[.,;:!?)\]"']|(?:and|but|so|which|while|since|because|though|although)\b(?!\s*[$€£]?\d)))`;
const R_IS = String.raw`(?:is|=|equals|gives|becomes|comes\s+to|would\s+be|will\s+be|makes|yields)`;
const MOREW = String.raw`more|higher|greater`, LESSW = String.raw`less|lower|fewer|cheaper`, MORE = new RegExp(String.raw`^(?:${MOREW})$`, 'i');
const PMORE = new RegExp(String.raw`${R_AT}${AMT_('b')}\s+(?:is|was|are|were)\s+${PCT_}\s+(?<cw>${MOREW}|${LESSW})\s+than\s+${AMT_('a', true)}${R_END}`, 'gi');
const PM_HEDGED = /\b(?:about|around|roughly|approximately|approx|nearly|almost|circa|some|least|most|up\s+to|over|under|average|typical|typically|estimated|expected|not|never)\b|n't\b|~|≈/i;
const ROUND = [
  new RegExp(String.raw`${R_X}\s*,?\s*(?:rounds|rounded|round)(?:\s+off)?\s+to\s+${R_Y}(?:\s*,?\s+(?:to|at)\s+${R_STEP})?${R_END}`, 'gi'),
  new RegExp(String.raw`${R_X}\s*,?\s*(?:when\s+|if\s+)?(?:rounded|rounds|round)(?:\s+off)?\s+to\s+${R_STEP}\s*,?\s*${R_IS}\s+${R_Y}${R_END}`, 'gi'),
  new RegExp(String.raw`(?<=^\s*|[.;:!?,]\s+|\(\s*)rounding\s+(?:off\s+)?${R_X.slice(R_AT.length)}\s+to\s+${R_STEP}\s*,?\s*${R_IS}\s+(?:you\s+)?${R_Y}${R_END}`, 'gi'),
];
const R_PLACE = { whole: 0, 'whole number': 0, integer: 0, unit: 0, units: 0, one: 0, ones: 0, tenth: -1, tenths: -1, hundredth: -2, hundredths: -2,
  thousandth: -3, thousandths: -3, ten: 1, tens: 1, hundred: 2, hundreds: 2, thousand: 3, thousands: 3, 'ten thousand': 4, 'hundred thousand': 5, million: 6, millions: 6 };
const R_N = w => (/^\d$/.test(w) ? Number(w) : ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'].indexOf(w.toLowerCase()) + 1);
function rounding(g) {
  if (!g.xp !== !g.yp) return null;
  const x = plainNum(g.x), y = plainNum(g.y), dec = v => (v.split('.')[1] || '').length;
  if (x.length > 30 || y.length > 30) return null;
  let k;
  if (g.near) k = R_PLACE[g.near.toLowerCase().replace(/\s+/g, ' ')];
  else if (g.dp) k = -R_N(g.dp);
  else if (g.sf) {
    const n = R_N(g.sf), [i, f = ''] = x.split('.'), lead = i.replace(/^0+/, '');
    if (!n || !/[1-9]/.test(x)) return null;
    k = (lead ? lead.length - 1 : -(f.search(/[1-9]/) + 1)) - n + 1;
  } else if (!/[1-9]/.test(y)) return null;
  else k = dec(y) ? -dec(y) : y.length - y.replace(/0+$/, '').length;
  if (k === undefined || !Number.isInteger(k)) return null;
  const D = Math.max(dec(x), dec(y), -k + 1, 0), int = v => BigInt(v.replace('.', '') + '0'.repeat(D - dec(v)));
  const X = int(x), Y = int(y), step = 10n ** BigInt(D + k), gap = X > Y ? X - Y : Y - X;
  if (Y % step !== 0n || 2n * gap === step) return null;
  const s = k >= 0 ? '1' + '0'.repeat(k) : '0.' + '0'.repeat(-k - 1) + '1';
  return `abs(${x} - ${y}) < ${s}/2`;
}
const C_HEDGE = String.raw`≈|~=|~|is\s+(?:about|approximately|roughly|around|nearly|close\s+to)|equals\s+about`;
const CONSTQ = new RegExp(String.raw`(?<=^\s*|[.;:!?,]\s+|\(\s*|,\s*(?:and|but|while|whereas)\s+)(?<c>pi\b|π|euler['’]?s\s+number\b`
  + String.raw`|(?<e>e)(?=\s*(?:${C_HEDGE}))|sqrt\s*\(\s*(?<r>\d{1,6})\s*\))\s*(?<op>${C_HEDGE}|=|is|equals)`
  + String.raw`\s*(?<y>\d+(?:\.\d+)?)(?!\d)${R_END}`, 'gi');
function constant(g) {
  if (g.e && g.e !== 'e') return null;
  const r = g.r, y = g.y, d = (y.split('.')[1] || '').length, n = Number(y);
  const name = r ? `sqrt(${Number(r)})` : /^(?:pi|π)$/i.test(g.c) ? 'pi' : 'E';
  const v = r ? Math.sqrt(Number(r)) : name === 'pi' ? Math.PI : Math.E;
  if (d > 14 || y.replace('.', '').length > 16 || Math.abs(n - v) > 0.5 * v) return null;
  const hedged = !/^(?:=|is|equals)$/i.test(g.op), cut = Math.trunc(v * 10 ** d) / 10 ** d, rnd = Math.round(v * 10 ** d) / 10 ** d;
  if (n === cut && n !== rnd) return null;
  if (!hedged) return d || Number.isInteger(v) ? `${name} = ${y}` : null;
  return n === rnd && Math.abs(n - v) > 0.1 * v * (1 - 1e-9) ? null : `${name} ~= ${y}`;
}
function formsIn(s) {
  const t = norm(s);
  const out = [], spans = [];
  const inList = a => /\b(?:average|mean|median)\s+of\s(?:(?!\b(?:is|are|was|were|equals|comes)\b|=)(?:[^.;!?]|\.(?=\d)))*$/i.test(t.slice(Math.max(0, a - 240), a));
  const tail = a => inList(a) || /[A-Za-z_]$/.test(t.slice(0, a)) || /\b(?:mod|modulo|rem|div|(?<!\b(?:total|subtotal|sum|cost|price|bill|amount|balance|judgment|judgement|award|settlement|retainer|deposit|verdict|estate|loan|debt|payments?|installments?|instalments?|dues|premiums?|maintenance|tuition|allowance|stipend|leases?|support|rent|alimony|mileage|wages?|salary|fees?|charges?|expenses?|damages|penalt(?:y|ies)|fines?|interest|costs|rates?)\s+)of|log|sqrt|root)\s*$/i.test(t.slice(0, a))
    || (t[a] === '(' && /[\d)]\s*$/.test(t.slice(0, a))) || /\d\s+(?:(?:in|out\s+of)(?:\s+every)?|per)\s+$/i.test(t.slice(Math.max(0, a - 30), a))
    || (/^[-+*/×÷]\s/.test(t.slice(a)) && /[A-Za-z]\s*$/.test(t.slice(Math.max(0, a - 3), a)))
    || /\d:$/.test(t.slice(Math.max(0, a - 2), a))
    || /(?:%|\bpercent)\s+off(?:\s+of)?\s*[$€£]?\s*$|\b(?:double|twice|triple|thrice)\s*[$€£]?\s*$/i.test(t.slice(Math.max(0, a - 24), a))
    || /\b(?:times|twice|double|triple)\s+as\s+(?:much|many|big|large|long|high|tall|heavy|old|far|fast)\s+as\s*[$€£]?\s*$/i.test(t.slice(Math.max(0, a - 48), a))
    || (t[a] === '(' && /\b(?:double|twice|triple|thrice|half|and|of|off|than|between)\s*$/i.test(t.slice(Math.max(0, a - 12), a))
      && !/\b(?:payments?|installments?|instalments?|dues|premiums?|maintenance|tuition|allowance|stipend|leases?|support|rent|alimony|mileage|wages?|salary|fees?|charges?|expenses?|total|cost|bill|amount|damages|penalt(?:y|ies)|fines?|interest|costs|retainer|award|settlement|judge?ments?|verdicts?|estates?|deposits?|loans?|debts?|balances?|rates?)\s+of\s*$/i.test(t.slice(Math.max(0, a - 18), a))
      && !/(?:=|\b(?:is|was|are|equals))\s*[$€£]?-?\d[\d,]*(?:\.\d+)?\s*[,;]\s*and\s*$/i.test(t.slice(Math.max(0, a - 60), a)))
    || /\^\s*$/.test(t.slice(Math.max(0, a - 2), a)) || (t[a] === '(' && /[\w')\]]$/.test(t.slice(Math.max(0, a - 1), a)))
    || (/^\(\s*-?[\d.,/]+\s*\)/.test(t.slice(a)) && /[A-Za-z]\s?$/.test(t.slice(Math.max(0, a - 2), a)));
  const add = (m, form, prime, unsure) => {
    const a = m.index, b = a + m[0].length;
    if (tail(a)) return;
    if (spans.some(([x, y, s]) => a < y && x < b && !(s && a < x && b <= s))) return;
    spans.push([a, b, prime ? a + m[1].length : 0]); out.push(unsure ? { said: m[0], form, unsure } : { said: m[0], form });
  };
  for (const m of t.matchAll(DEADLINE)) { const f = deadline(m); if (f) add(m, f); }
  for (const m of primeMatches(t)) add(m, `${mathText(m[1])} is ${m[2] ? 'not ' : ''}prime`, true);
  for (const re of ROUND) for (const m of t.matchAll(re)) { const f = rounding(m.groups); if (f) add(m, f); }
  for (const m of t.matchAll(CONSTQ)) { const f = constant(m.groups); if (f) add(m, f); }
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
    if (/\b(?:more|less|fewer|greater|smaller|bigger|larger)\s+than\s*[$€£]?\s*$/i.test(t.slice(Math.max(0, m.index - 24), m.index))) continue;
    const unbalanced = (s, o, c) => (s.split(c).length - 1) > (s.split(o).length - 1);
    if (unbalanced(m[1], '(', ')') || unbalanced(m[3], ')', '(')) continue;
    if (/^\d{3}(?!\d)/.test(t.slice(m.index)) && /\d{1,3} $/.test(t.slice(Math.max(0, m.index - 4), m.index))) continue;
    if (/\d$/.test(r.trim()) && /^\s+\d+\/\d+(?!\d)/.test(after.slice(0, 40))) continue;
    if (/^\d+\/\d/.test(t.slice(m.index, m.index + 40)) && /\d\s+$/.test(t.slice(Math.max(0, m.index - 24), m.index))) continue;
    const range = s => { const g = s.trim().match(/^(\d[\d,]*)-(\d[\d,]*)$/); return g && +g[1].replace(/,/g, '') < +g[2].replace(/,/g, ''); };
    const worded = /^\s+[a-z]/i.test(t.slice(m.index + m[0].length));
    if (worded && ((range(l) && !/^\s*-/.test(r)) || (range(r) && !/^\s*-/.test(l)))) continue;
    const ISO = /(?<![\d.])\d{4}-\d{1,2}-\d{1,2}(?![\d.])/;
    if (ISO.test(m[1]) || ISO.test(m[3]) || ISO.test(t.slice(Math.max(0, m.index - 6), m.index + m[0].length + 6))) continue;
    const SLASHDATE = /(?<![\d.\/])(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}\/\d{1,2}\/\d{1,2})(?![\d\/])/;
    if (SLASHDATE.test(t.slice(Math.max(0, m.index - 10), m.index + m[0].length + 10))) continue;
    if (/^totals?$/i.test(m[2].trim()) && !/[+(]/.test(m[1])) continue;
    if (pct && /^\s*\d[\d,]*\s*$/.test(l)) continue;
    const chain = /^\s*[<>=≤≥≠]/.test(after) || /[<>=≤≥≠]\s*$/.test(t.slice(Math.max(0, m.index - 4), m.index));
    if (!pct && !/[-+*/^]/.test(l + r) && (!/^[<>]=?$/.test(m[2]) || chain)) continue;
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
    if (!f) continue;
    const lk = LINKED.exec(m[0]), link = lk ? lk[4] : '', after = t.slice(at.index + at[0].length);
    const aside = /\(/.test(link) && !/^\s*\)/.test(after);
    const choice = !aside && /\bor\b/i.test(link) && !/\(|\b(?:about|roughly|approximately|around|nearly)\b|~/i.test(link)
      && !(/,/.test(link) && /^\s*(?:[.;!?)]|$)/.test(after));
    const lead = t.slice(Math.max(0, at.index - 80), at.index), range = RANGE_BEFORE.test(lead) || RANGE_AFTER.test(after.slice(0, 80));
    const bound = !range && BOUND.test(lead), held = (choice || bound) && settleForm(f, at[0])[0] === 'FALSIFIED';
    const said = out.length ? at[0] : t;
    const sized = range || aside || held ? '' : otherSize(a, b, f, said) || ovenStep(a, b, f, said, t, change) || tempChange(a, b, f, said, lead, change);
    add(at, f, false, range ? OR_RANGE : aside ? OR_ASIDE : held ? (bound ? OR_BOUND : OR_CHOICE) : sized);
  }
  for (const re of PCHG) for (const m of t.matchAll(re)) { const f = pctChange(m.groups); if (f) add(m, f); }
  for (const m of PM_HEDGED.test(t) ? [] : t.matchAll(PMORE)) {
    const up = MORE.test(m.groups.cw), p = Number(plainNum(m.groups.p)), x = Number(plainNum(m.groups.b)), y = Number(plainNum(m.groups.a));
    if ((up ? p >= 100 : p > 100) || (Math.abs(x - y) === p && y !== 100)) continue;
    const f = pctChange({ ...m.groups, w: up ? 'rise' : 'drop' });
    if (f) add(m, f);
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
  + 'lease overtime at '
  + 'late estate estates loan loans debt debts hourly rate rates '
  + 'contingency security '
  + 'mediator mediators arbitrator arbitrators trustee executor contractor awarded charged share '
  + 'price prices sales revenue value profit profits income earnings went grew rose fell dropped climbed jumped declined').split(' '));
const LEAD_BILL = new Set('for our my your his her their us me worked spent spends charged invoiced invoices logged earned earns recorded billable'.split(' '));
const BILL_FORM = /^\(\s*\d[\d,]*(?:\.\d+)?\s*\*\s*\d[\d,]*(?:\.\d+)?\s*\)/;
const RATE_LEFT = new RegExp(String.raw`\b(?:an?|each|every)\s+(?:seconds?|minutes?|hours?|days?|weeks?|months?|years?|nights?|shifts?)\b`, 'gi');
export function unchecked(s, saids, typed) {
  const t0 = norm(s), m = t0.split('');
  for (const x of saids) for (let i = x ? t0.indexOf(x) : -1; i >= 0; i = t0.indexOf(x, i + 1)) m.fill(' ', i, i + x.length);
  const t = m.join('');
  const first = Math.min(...saids.map(x => (x ? t0.indexOf(x) : -1)).filter(i => i >= 0), t0.length);
  const lead = saids.find(x => x && t0.indexOf(x) === first), made = !!lead && BILL_FORM.test(lead) && typed != null && !norm(typed).includes(lead);
  const billLead = (l, i) => made && LEAD_BILL.has(l) && !/[,;:!?]/.test(t0.slice(i, first));
  const latin = [...t.matchAll(/[a-z]+/gi)].filter(x => { const l = x[0].toLowerCase(); return l.length > 1 && !GLUE.has(l) && !UNIT.has(l) && !TEMP[l] && !(x.index < first && (LEAD.has(l) || billLead(l, x.index))); }).map(x => x[0]);
  const other = (t.match(/[\p{L}\p{M}]+/gu) || []).filter(w => /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(w));
  const nums = t.match(/\d+(?:[.,]\d+)*/g) || [];
  const letters = [...t0.matchAll(/(?<=\d ?)[A-Za-z](?![A-Za-z'’])/g)].filter(x => t[x.index] !== ' ' && !(x[0] === x[0].toLowerCase() && UNIT.has(x[0]))).map(x => x[0]);
  const marks = t.match(/[⁰¹²³⁴-⁹⁺⁻½⅓⅔¼¾⅕-⅞✗✘✖❌❎×⃣]|(?![✔✅☑])\p{Extended_Pictographic}/gu) || [];
  const rates = t.match(RATE_LEFT) || [];
  return [...latin, ...other, ...nums, ...letters, ...marks, ...rates].join(' ');
}
const HOLDS = new Set(['PROVEN', 'ARITHMETIC-CHECKED']);
const cut80 = x => (x = String(x).trim()).length > 80 ? x.slice(0, 79) + '…' : x;
const DENIES = new RegExp(String.raw`\b(?:not|no|never|nobody|none|false|wrong|incorrect|untrue|myth|mistake|mistaken|error|nonsense|impossible|absurd|if|unless|suppose|supposing|assume|assuming|imagine|pretend|hypothetically)\b|[✗✘✖❌❎⛔]|👎|🚫`, 'i');
const RANGE = /\p{L}{2,}\.?\s+\d+\s?[-‐-―−]\s?\d+(?![\d-])/u;
const PART_OF = /\b(?:half|halves|thirds?|quarters?|fourths?|fifths?|tenths?|twice|double[ds]?|triple[ds]?|thrice|treble[ds]?|quadruple[ds]?)\b/i;
const PART_SAID = /\b(?:half|(?:a|one|two|three)\s+(?:thirds?|quarters?|fourths?|fifths?|tenths?)|twice|double[ds]?|triple[ds]?|thrice|treble[ds]?|quadruple[ds]?)\s+(?:of|the|his|her|their|our|my|your|its|this|that)\b/i;
export function whole(c, out) {
  if (c.unsure) return ['GUESS', 'reading', c.unsure];
  if (out[0] === 'FALSIFIED' && c.rest && RANGE.test(c.said)) return ['GUESS', 'none', 'two readings, so not checked: a dash between two numbers after a word could be a range (pages 5 to 10) or a minus'];
  if (out[0] === 'FALSIFIED' && c.rest && DENIES.test(c.rest))
    return ['GUESS', out[1], `the math "${c.form}" does not hold, but the sentence around it ("${c.rest.slice(0, 80)}") may deny it or only suppose it, so the sentence is not called false`];
  if (out[0] === 'FALSIFIED' && c.rest && PART_OF.test(c.rest) && PART_SAID.test(c.said))
    return ['GUESS', out[1], `the math "${c.form}" does not hold, but the sentence around it ("${c.rest.slice(0, 80)}") may take a part or a multiple of it, so the sentence is not called false`];
  if (out[0] !== 'PROVEN') return out;
  if (c.rest) return ['GUESS', out[1], `only the part "${c.form}" was checked, and it holds; the rest ("${c.rest.slice(0, 80)}") is not checked by math; look it up below`];
  for (const f of c.sib || []) {
    const [v] = f.unsure ? ['GUESS'] : settleForm(f.form, f.said);
    if (!HOLDS.has(v)) return ['GUESS', out[1], `the part read as "${cut80(c.form)}" holds, but another part of the same sentence, read as "${cut80(f.form)}", ${v === 'FALSIFIED' ? 'is false' : 'is not proven'}, as its own line shows`];
  }
  return out;
}

export function readClaims(text) {
  const out = [], all = splitSentences(text);
  let left = false;
  for (const [i, s] of all.entries()) {
    const eng = engineReads(s);
    if (eng) {
      out.push({ said: s, form: eng.form });
      if (out.length >= MAX_CLAIMS) { left = i + 1 < all.length; break; }
      continue;
    }
    const sp = spelled(s), forms = formsIn(sp.text);
    if (sp.typos.length) {
      out.push({ said: s, form: null, maybe: { ...sp.typos[0], form: forms[0].form } });
      if (out.length >= MAX_CLAIMS) { left = i + 1 < all.length; break; }
      continue;
    }
    const rest = forms.length ? unchecked(sp.text, forms.map(f => f.said), s) : '';
    const bare = !forms.length && /^[\s\d+\-*/^().,%<>=!≤≥≠−×÷·⁰¹²³⁴-⁹₀-₉͏]+$/.test(s) && twoWays(s) ? s.replace(/͏/g, '') : null;
    const why = f => f && f.unsure ? { unsure: f.unsure } : {};
    const first = { said: s, form: forms[0] ? forms[0].form : bare, ...why(forms[0]), ...(rest ? { rest } : {}) };
    if (forms.length > 1) Object.defineProperty(first, 'sib', { value: forms.slice(1) });
    out.push(first);
    for (const f of forms.slice(1)) out.push({ said: f.said, form: f.form, ...why(f) });
    if (out.length >= MAX_CLAIMS) { left = i + 1 < all.length; break; }
  }
  const kept = out.slice(0, MAX_CLAIMS);
  if (left || out.length > MAX_CLAIMS) kept.more = true;
  return kept;
}

const A1 = /^(?:a|an|one)\s+(?=[a-z°]+\s+(?:is|=|equals)\b)/i, HALF = /\bhalf of\s+(\d[\d,]*(?:\.\d+)?)/gi, MONEY = /[$€£](?=\s?\d)\s?/g;
const PAGE_READS = [
  s => s.replace(A1, '1 ')
    .replace(/(?<!\d)(\d+(?:\.\d+)?)\s*(?:%|percent)\s+off\s+[$€£]?\s?(\d[\d,]*(?:\.\d+)?)/gi, '$2 - $1/100 * $2')
    .replace(/\b(?:a|one)\s+(third|quarter|fifth|tenth)\s+of\s+[$€£]?\s?(\d[\d,]*(?:\.\d+)?)/gi, (m, f, n) => `${n} / ${{ third: 3, quarter: 4, fifth: 5, tenth: 10 }[f.toLowerCase()]}`)
    .replace(/\b(double|twice|triple)\s+[$€£]?\s?(\d[\d,]*(?:\.\d+)?)/gi, (m, w, n) => `${/triple/i.test(w) ? 3 : 2} * ${n}`)
    .replace(/(?<!\d)(\d[\d,]*(?:\.\d+)?)\s+(squared|cubed)\b/gi, (m, n, w) => `${n}^${/cubed/i.test(w) ? 3 : 2}`)
    .replace(/(?<!\d)(\d+)\s+dozen\b/gi, '$1 * 12')
    .replace(/(?<!\d)(\d+(?:\.\d+)?)\s*(?:%|percent)\s+(discount|reduction|decrease|cut|drop|markup|mark-up|raise|increase|rise|hike)\s+on\s+[$€£]?\s?(\d[\d,]*(?:\.\d+)?)(?=\s+(?:is|=|equals|comes\s+to)\s+[$€£]?\s?(\d[\d,]*(?:\.\d+)?))/gi,
      (m, p, w, x, y) => { const n = +x.replace(/,/g, ''), down = /^(?:dis|red|dec|cut|dro)/i.test(w), total = n + (down ? -1 : 1) * n * p / 100;
        return Math.abs(total - +y.replace(/,/g, '')) < 1e-9 * Math.max(1, n) ? `${x} ${down ? '-' : '+'} ${p}/100 * ${x}` : `${p}/100 * ${x}`; })
    .replace(/(?<!\d)(\d+(?:\.\d+)?)\s*(?:%|percent)(?:\s+[a-z]+){0,2}?\s+(?:of|on)\s+[$€£]?\s?(\d[\d,]*(?:\.\d+)?)(?![\d,.]|\s+(?:for|over|per|a|an|each|every|daily|weekly|monthly|quarterly|yearly|annually|compounded)\b)/gi, '$1/100 * $2')
    .replace(HALF, '$1 / 2').replace(MONEY, ''),
  s => s.replace(A1, '1 ').replace(/(?<!\d)(\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(\d[\d,]*(?:\.\d+)?)/gi, '$1/100 * $2').replace(HALF, '$1 / 2').replace(MONEY, ''),
];
export const pageReads = () => PAGE_READS.slice();
export const ownWords = s => s.replace(A1, '1 ').replace(MONEY, '');
const KIND_AT = /(?<!\p{L})(\p{Sc})\s?\d|\d\s?(\p{Sc})(?!\p{L})|\bUS(\$)\s?\d|\d\s?(dollars?|bucks?|euros?|quid|sterling|yen|yuan|renminbi|rupees?|usd|eur|gbp|jpy|cny|rmb|inr)\b|\b(usd|eur|gbp|jpy|cny|rmb|inr)\s?\d/giu;
const KIND_OF = { dollar: '$', dollars: '$', buck: '$', bucks: '$', usd: '$', euro: '€', euros: '€', eur: '€', quid: '£', sterling: '£', gbp: '£',
  yen: '¥', yuan: '¥', renminbi: '¥', jpy: '¥', cny: '¥', rmb: '¥', rupee: '₹', rupees: '₹', inr: '₹', '¢': '' };
export function mixedMoney(s) {
  const k = new Set();
  for (const m of String(s ?? '').normalize('NFKC').matchAll(KIND_AT)) { const w = m.slice(1).find(Boolean), c = KIND_OF[w.toLowerCase()] ?? w; if (c) k.add(c); }
  if (k.size < 2) return '';
  const all = [...k], n = { 2: 'two', 3: 'three' }[all.length] || 'several';
  return `it mixes ${n} kinds of money (${all.slice(0, -1).join(', ')} and ${all[all.length - 1]}), and this checker never changes one kind into another`;
}
const CENT_MONEY = /[$€£]\s?\d|\d\s?[€£]|\d\s*(?:dollars?|bucks?|euros?)\b/i;
const CENT_NOT = /\b(?:exact|exactly|precisely|to\s+the\s+(?:penny|cent)|on\s+the\s+nose|thousands?|millions?|billions?|trillions?|bn|mn)\b|\d\s*[kmb]\b/i;
export function toCent(form, said, head) {
  const h = String(head ?? '').normalize('NFKC'), m = /^([^=<>!~≈≠]*[^=<>!~≈≠\s])\s*=\s*(-?\d[\d,]*)\s*$/.exec(String(form ?? ''));
  if (!m || !CENT_MONEY.test(h) || CENT_NOT.test(h) || settleForm(form, said)[0] !== 'FALSIFIED') return '';
  const n = m[2].replace(/,/g, ''), r = settleForm(`${m[1]} = ${n}.00`, said);
  return r[0] === 'GUESS' && r[1] === 'rounded' ? r[2].replace(`; ${n}.00 is that rounded to its last digit, but`, `, which is ${n}.00 to the cent, as money is paid, but`) : '';
}
const DZ_MONEY = /[$€£]\s?(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s?(?:[€£]|(?:dollars?|bucks?|euros?|cents?|pence|pounds?|quid|usd|eur|gbp)\b)/gi;
const dzNum = s => Number(String(s).replace(/,/g, ''));
export function dozenMoney(form, head) {
  const m = /^([^=<>!~≈≠]*)=\s*(-?\d[\d,]*(?:\.\d+)?)\s*$/.exec(String(form ?? '')), h = String(head ?? '').normalize('NFKC');
  if (!m || !/dozen/i.test(h)) return '';
  const counts = new Set([...m[1].matchAll(/(?<![\d.,])(\d[\d,]*(?:\.\d+)?)\s*\*\s*12(?![\d.,])/g)].map(x => dzNum(x[1]))), y = Math.abs(dzNum(m[2]));
  for (const d of h.matchAll(/\b(?:(a|one)|(\d[\d,]*(?:\.\d+)?))\s+dozen\b/gi))
    if (counts.has(d[1] ? 1 : dzNum(d[2])) && [...h.slice(d.index + d[0].length).matchAll(DZ_MONEY)].some(x => dzNum(x[1] ?? x[2]) === y))
      return 'a dozen is read here as 12 things and the answer is an amount of money: a count is not a price, so no verdict is given; write the price as math, as in "4 * 3 = 12", and it is checked';
  return '';
}
const moneyAside = (f, head) => toCent(f.form, f.said, head) || dozenMoney(f.form, head);
export function centsAside(c, head, first) {
  if (first) for (const f of c.sib || []) { const u = f.form && !f.unsure ? moneyAside(f, head) : ''; if (u) f.unsure = u; }
  const u = c.form && !c.unsure ? moneyAside(c, head) : '';
  if (u) c.unsure = u;
}
const NOTE_LIFE = 60000;
function noted(text) {
  if (globalThis.HHH_NO_PAGE_GUARD) return null;
  for (let i = HEARD.length - 1; i >= 0; i--) {
    const e = HEARD[i];
    if (Date.now() - e.t > NOTE_LIFE) continue;
    if (e.s === text) return null;
    if (PAGE_READS.some(f => { try { return f(e.s) === text; } catch (x) { return false; } })) return e.s;
  }
  return null;
}
const TWO_READINGS = 'these words were read two ways that do not agree, so no verdict is given; ';
function agreed(page, careful) {
  const verdict = c => c && c.form ? whole(c, settleForm(c.form, c.said)) : ['GUESS', 'none', ''];
  const out = page.map((p, i) => {
    const P = verdict(p), c = page.length === careful.length ? careful[i] : null, C = verdict(c);
    if (P[0] !== 'PROVEN' && P[0] !== 'FALSIFIED') return c && (C[0] === 'PROVEN' || C[0] === 'FALSIFIED') ? c : p;
    if (c && P[0] === C[0] && (P[0] !== 'FALSIFIED' || P[2] === C[2])) return p;
    const why = c && c.form && C[0] === 'GUESS' && C[2] ? C[2]
      : c && c.form ? `${TWO_READINGS}written with math signs, "${c.form}" can be checked`
      : `${TWO_READINGS}write the math with signs and brackets and it can be checked`;
    return { said: p.said, form: (c && c.form) || p.form, unsure: why };
  });
  if (page.more) out.more = true;
  return out;
}
export function findClaims(text) {
  const said = noted(text), mine = said === null ? text : ownWords(said);
  const out = mine === text ? readClaims(text) : agreed(readClaims(text), readClaims(mine));
  let head = '', left = 0;
  for (const c of out) {
    let first = false;
    if (left > 0) left--; else { head = said ?? c.said; left = c.sib ? c.sib.length : 0; first = true; }
    const money = c.form ? mixedMoney(head) : '';
    if (money) c.unsure = money; else centsAside(c, head, first);
  }
  return out;
}
