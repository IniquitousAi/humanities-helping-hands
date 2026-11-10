import { guessWhy } from './reasons.js';
import { OPEN, openProblem } from './open_problems.js';
export const PROVEN = 'PROVEN', FALSIFIED = 'FALSIFIED', GUESS = 'GUESS';
export { OPEN };

export const DEFINED = { c: '299792458', au: '149597870700', year: '31557600', lightyear: '9460730472580800', day: '86400',
  g0: '9.80665', atm: '101325', mile: '1609.344', foot: '0.3048', inch: '0.0254', pound: '0.45359237', gallon: '3.785411784' };
const WORDS = new Set(['sqrt', 'factorial', 'gcd', 'lcm', 'binomial', 'pi', 'E', 'mod', 'log', 'exp', 'sin', 'cos', 'tan', 'abs', 'Abs']);
const SYMBOLIC = new Set(['log', 'exp', 'sin', 'cos', 'tan']);
const MATH_CHARS = /^[0-9a-zA-Z_+\-*/^().,!%\s]+$/;
const RELATIONS = [['<=', 'le'], ['>=', 'ge'], ['!=', 'ne'], ['=', 'eq'], ['<', 'lt'], ['>', 'gt']];
export const FORMS = {
  page: /^(https?:\/\/\S+)\s+(?:says|contains|has)\s+["“](.+?)["”]\s*\.?$/i,
  wiki: /^wikipedia\s+["“](.+?)["”]\s+says\s+["“](.+?)["”]\s*\.?$/i,
  prime: /^(.+?)\s+is\s+(not\s+)?(?:a\s+)?prime\.?$/i,
  wikidata: /^wikidata\s+(Q\d+)\s*\(([^)]+)\)\s+(P\d+)\s*\(([^)]+)\)\s*(~=|=)\s*(.+?)\s*\.?$/i,
  wikidataNamed: /^wikidata\s+"([^"]{1,120})"\s+"([^"]{1,120})"\s*(~=|=)\s*(.+?)\s*\.?$/i,
  event: /^event\s+"([^"]{1,120})"\s+(on|began|ended)\s+(\d{4}-\d{2}-\d{2})\s*\.?$/i,
  approx: /^(.+?)\s*(?:~=|≈)\s*(?:\(\s*-\s*(?=[0-9][0-9,.]*\s*\))|-\s*)?([0-9][0-9,]*(?:\.\d+)?)\)?(?:\s*\*\s*10\^(-?\d+))?\s*\.?$/,
};

class Cant extends Error {}

const babs = x => (x < 0n ? -x : x);
const MAX_BITS = 400_000, GCD_WORK = 1.5e8, SMALL = 1n << 64n;
const bits = x => babs(x).toString(2).length;
const bgcd = (a, b) => {
  a = babs(a); b = babs(b);
  let left = a < SMALL || b < SMALL ? Infinity : Math.max(64, Math.floor(GCD_WORK / bits(a > b ? a : b)));
  while (b) { if (--left < 0) throw new Error('a number that big would freeze the gate'); [a, b] = [b, a % b]; }
  return a;
};
class Q {
  constructor(n, d = 1n) { if (d === 0n) throw new Error('division by zero'); if (d < 0n) { n = -n; d = -d; }
    if ((babs(n) > SMALL || d > SMALL) && bits(n) + bits(d) > MAX_BITS) throw new Error('a number that big would freeze the gate');
    const g = bgcd(n, d) || 1n; this.n = n / g; this.d = d / g; }
  static of(s) { const [w, f = ''] = String(s).split('.'); return new Q(BigInt((w || '0') + f), 10n ** BigInt(f.length)); }
  add(o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Q(this.n * o.n, this.d * o.d); }
  div(o) { if (o.n === 0n) throw new Error('division by zero'); return new Q(this.n * o.d, this.d * o.n); }
  cmp(o) { const x = this.n * o.d - o.n * this.d; return x < 0n ? -1 : x > 0n ? 1 : 0; }
  get int() { return this.d === 1n; }
  floor() { const q = this.n / this.d; return this.n < 0n && q * this.d !== this.n ? q - 1n : q; }
  pow(e) {
    if (!e.int) throw new Cant('a power that is not a whole number needs roots');
    const k = e.n; if (babs(k) > 100000n) throw new Error('a number that big would freeze the gate');
    if ((bits(this.n) + bits(this.d)) * Number(babs(k)) > MAX_BITS) throw new Error('a number that big would freeze the gate');
    const r = new Q(this.n ** babs(k), this.d ** babs(k)); return k < 0n ? new Q(1n).div(r) : r;
  }
  toString() { return this.int ? String(this.n) : `${this.n}/${this.d}`; }
  num() { return Number(this.n) / Number(this.d); }
}

const qmin = (...a) => a.reduce((x, y) => (x.cmp(y) <= 0 ? x : y)), qmax = (...a) => a.reduce((x, y) => (x.cmp(y) >= 0 ? x : y));
class V {
  constructor(lo, hi = lo) { this.lo = lo; this.hi = hi; }
  get exact() { return this.lo.cmp(this.hi) === 0; }
  q() { if (!this.exact) throw new Cant('this needs an exact number, and a root or pi is only known between two bounds'); return this.lo; }
  add(o) { return new V(this.lo.add(o.lo), this.hi.add(o.hi)); }
  sub(o) { return new V(this.lo.sub(o.hi), this.hi.sub(o.lo)); }
  mul(o) { if (this.exact && o.exact) return new V(this.lo.mul(o.lo)); const p = [this.lo.mul(o.lo), this.lo.mul(o.hi), this.hi.mul(o.lo), this.hi.mul(o.hi)]; return new V(qmin(...p), qmax(...p)); }
  div(o) {
    if (o.exact) { const d = o.lo; return d.n < 0n ? new V(this.hi.div(d), this.lo.div(d)) : new V(this.lo.div(d), this.hi.div(d)); }
    if (o.lo.n <= 0n && o.hi.n >= 0n) throw new Cant('dividing by a range that holds zero');
    return this.mul(new V(new Q(1n).div(o.hi), new Q(1n).div(o.lo)));
  }
  neg() { return new V(new Q(0n).sub(this.hi), new Q(0n).sub(this.lo)); }
  cmp(o) { if (this.exact && o.exact) return this.lo.cmp(o.lo); if (this.hi.cmp(o.lo) < 0) return -1; if (this.lo.cmp(o.hi) > 0) return 1; throw new Cant('the two sides are too close to tell apart without exact algebra'); }
  pow(e) {
    const k = e.q();
    if (!k.int) {
      if (k.d > 12n) throw new Cant('a root that deep');
      return root(this, k.d).pow(new V(new Q(k.n)));
    }
    if (this.exact) return new V(this.lo.pow(k));
    if (k.n < 0n) return new V(new Q(1n)).div(this.pow(new V(new Q(-k.n))));
    const a = this.lo.pow(k), b = this.hi.pow(k);
    if (k.n % 2n === 0n && this.lo.n < 0n && this.hi.n > 0n) return new V(new Q(0n), qmax(a, b));
    return new V(qmin(a, b), qmax(a, b));
  }
}
const SCALE = 10n ** 30n;
function iroot(n, k) {
  if (n < 2n) return n; let x = 1n << BigInt(Math.ceil(bits(n) / Number(k)) + 1);
  for (;;) { const y = ((k - 1n) * x + n / x ** (k - 1n)) / k; if (y >= x) break; x = y; }
  while (x ** k > n) x--; while ((x + 1n) ** k <= n) x++; return x;
}
function root(v, k) {
  if (v.lo.n < 0n) throw new Cant('the root of a negative number');
  const exactRoot = q => { const a = iroot(q.n, k), b = iroot(q.d, k); return a ** k === q.n && b ** k === q.d ? new Q(a, b) : null; };
  if (v.exact) { const r = exactRoot(v.lo); if (r) return new V(r); }
  const S = SCALE ** k, lo = iroot(v.lo.n * S / v.lo.d, k), hiN = v.hi.n * S, hiD = v.hi.d;
  return new V(new Q(lo, SCALE), new Q(iroot((hiN + hiD - 1n) / hiD, k) + 1n, SCALE));
}
const PI40 = '3.1415926535897932384626433832795028841971', E40 = '2.7182818284590452353602874713526624977572';
const ULP = new Q(1n, 10n ** 40n), CONST = { pi: new V(Q.of(PI40), Q.of(PI40).add(ULP)), E: new V(Q.of(E40), Q.of(E40).add(ULP)) };

function factorial(q) {
  if (!q.int || q.n < 0n) throw new Error('factorial needs a whole number'); if (q.n > 100000n) throw new Error('a number that big would freeze the gate');
  let r = 1n; for (let i = 2n; i <= q.n; i++) r *= i; return new Q(r);
}
const exactQ = f => args => new V(f(args.map(a => a.q())));
const FUNCS = {
  sqrt: ([x]) => root(x, 2n),
  factorial: exactQ(([x]) => factorial(x)),
  gcd: exactQ(([a, b]) => { if (!a.int || !b.int) throw new Cant('gcd of fractions'); return new Q(bgcd(a.n, b.n)); }),
  lcm: exactQ(([a, b]) => { if (!a.int || !b.int) throw new Cant('lcm of fractions'); const g = bgcd(a.n, b.n); return new Q(g ? babs(a.n * b.n) / g : 0n); }),
  binomial: exactQ(([n, k]) => { if (!n.int || !k.int || n.n < 0n) throw new Cant('binomial of fractions'); if (k.n < 0n || k.n > n.n) return new Q(0n); if (n.n > 100000n) throw new Error('a number that big would freeze the gate'); let r = 1n; for (let i = 0n; i < k.n; i++) r = r * (n.n - i) / (i + 1n); return new Q(r); }),
  abs: ([x]) => (x.lo.n >= 0n ? x : x.hi.n <= 0n ? x.neg() : new V(new Q(0n), qmax(x.hi, x.neg().hi))),
  mod: exactQ(([a, b]) => mod(a, b)),
};
FUNCS.Abs = FUNCS.abs;
const mod = (a, b) => a.sub(b.mul(new Q(a.div(b).floor())));

export function expr(text) {
  text = text.trim();
  if (!text || !MATH_CHARS.test(text)) throw new Error('only numbers and math signs can be checked');
  for (const w of text.match(/[A-Za-z_][A-Za-z_0-9]*/g) || []) {
    if (!WORDS.has(w) && !(w in DEFINED)) throw new Error(`"${w}" is not a math word the gate knows`);
    if (SYMBOLIC.has(w)) throw new Cant(`"${w}" needs symbolic algebra`);
  }
  const toks = text.match(/\d+\.?\d*|\.\d+|[A-Za-z_][A-Za-z_0-9]*|\*\*|[-+*/^%!(),]/g) || [];
  let i = 0;
  const peek = () => toks[i], eat = t => { if (toks[i] !== t) throw new Error('the math could not be read'); i++; };
  const primary = () => {
    const t = toks[i++];
    if (t === undefined) throw new Error('the math could not be read');
    if (t === '(') { const v = sum(); eat(')'); return v; }
    if (/^[\d.]/.test(t)) return new V(Q.of(t));
    if (t in DEFINED) return new V(Q.of(DEFINED[t]));
    if (t in CONST && peek() !== '(') return CONST[t];
    if (t in FUNCS && peek() === '(') { i++; const args = [sum()]; while (peek() === ',') { i++; args.push(sum()); } eat(')'); return FUNCS[t](args); }
    throw new Error('the math could not be read');
  };
  const postfix = () => { let v = primary(); while (peek() === '!') { i++; v = new V(factorial(v.q())); } return v; };
  const power = () => { const b = postfix(); if (peek() === '^' || peek() === '**') { i++; return b.pow(unary()); } return b; };
  const unary = () => { if (peek() === '-') { i++; return unary().neg(); } if (peek() === '+') { i++; return unary(); } return power(); };
  const product = () => {
    let v = unary();
    for (;;) {
      const t = peek();
      if (t === '*') { i++; v = v.mul(unary()); } else if (t === '/') { i++; v = v.div(unary()); }
      else if (t === '%' || t === 'mod') { i++; v = new V(mod(v.q(), unary().q())); } else return v;
    }
  };
  const sum = () => { let v = product(); for (;;) { if (peek() === '+') { i++; v = v.add(product()); } else if (peek() === '-') { i++; v = v.sub(product()); } else return v; } };
  const v = sum();
  if (i !== toks.length) throw new Error('the math could not be read');
  return v;
}

const sci = q => {
  const n = babs(q.n), sc = 12 - (n.toString().length - q.d.toString().length);
  const digits = (sc >= 0 ? n * 10n ** BigInt(sc) / q.d : n / (q.d * 10n ** BigInt(-sc))).toString(), exp = digits.length - 1 - sc;
  const mant = (digits[0] + '.' + digits.slice(1, 12)).replace(/\.?0+$/, '');
  return `${q.n < 0n ? '-' : ''}${mant} x 10^${exp}`;
};
const show = v => { if (v instanceof Q) v = new V(v); if (v.exact && v.lo.int) return String(v.lo.n); const m = (v.lo.num() + v.hi.num()) / 2;
  const tiny = m === 0 && (v.lo.n !== 0n || v.hi.n !== 0n), huge = !Number.isFinite(m);
  if (tiny || huge) return 'about ' + sci(v.exact ? v.lo : v.lo.add(v.hi).div(new Q(2n)));
  return (v.exact ? '' : 'about ') + String(+m.toPrecision(12)); };

const SOFT = /\beach\s+of\s+(?:the\s+)?\d|\bfor\s+a\s+total\s+of\b|\btotall?ing\b|,\s*(?:earning|making|costing)\b|\b(?:refunds?|discounts?|credits?|rebates?|overtime|(?<!simple\s)interest|compound\w*|each|side|monthly|weekly|annual\w*|yearly|later)\b/i;
const softReading = (left, said, claim) => said && said !== claim && /^\s*\([^()]*\)\s*$/.test(left) && /[a-z]{3}/i.test(said)
  && (SOFT.test(said) || !(OTHER_MONEY.test(said) ? /\d\s*[.!;]?\s*$/ : /\d\s*(?:(?:dollars?|bucks)\s*)?[.!;]?\s*$/i).test(said.trim()));
const OTHER_MONEY = /\b(?:cents?|pennies|penny|pence|yen|euros?|pounds?|pesos?|rupees?|yuan|francs?|quarters?|dimes?|nickels?|cad|aud|gbp|eur|jpy|usd|canadian|australian)\b|[€£¥₹¢]/i;
const GROUP_WORD = /\b(?:double|twice|triple|thrice|half|thirds?|quarters?|fourths?|fifths?|tenths?|times|percent)\b|%\s+of\b/i;
function checkMath(claim, said) {
  const body = claim.trim().replace(/\.$/, '').replace('==', '=');
  let op, left, right;
  for (const [sym, o] of RELATIONS) if (body.includes(sym)) { const k = body.indexOf(sym); left = body.slice(0, k); right = body.slice(k + sym.length); op = o; break; }
  if (!op) return null;
  if (['lt', 'gt', 'le', 'ge'].includes(op) && /[=<>]/.test(right)) return null;
  const a = expr(left), b = expr(right), c = a.cmp(b);
  const ok = { eq: c === 0, ne: c !== 0, lt: c < 0, gt: c > 0, le: c <= 0, ge: c >= 0 }[op];
  if (op === 'eq' && !ok && /^\s*\(?\s*-?\s*[\d,]*\.\d+\s*\)?\s*$/.test(right)) {
    let r = null; try { r = checkRounded(`${left} ~= ${right.trim()}`); } catch (e) { r = null; }
    if (r && r[0] === PROVEN) return [GUESS, 'rounded', `the exact value is ${show(a)}; ${right.trim()} is that rounded to its last digit, but "=" says exactly equal: write ≈ for a rounded answer and it is PROVEN`];
  }
  const THIRD = /(?<![\d.])(33(?:\.3+)?|66(?:\.6+)?|67|66\.7)\/100\s*\*/g;
  if (op === 'eq' && !ok && THIRD.test(left)) {
    const asThird = left.replace(THIRD, (all, p) => `${p.startsWith('33') ? 1 : 2}/3 *`);
    let held = false;
    try { held = expr(asThird).cmp(b) === 0; } catch (e) { held = false; }
    if (!held && /\./.test(right)) { try { const r = checkRounded(`${asThird} ~= ${right.trim()}`); held = !!r && r[0] === PROVEN; } catch (e) { held = false; } }
    else if (!held) { try { const v = expr(asThird), w = Number(right.replace(/[\s,()]/g, '')); held = v.exact && Number.isFinite(w) && Math.abs(v.lo.num() - w) <= 0.5; } catch (e) { held = false; } }
    if (held) return [GUESS, 'thirds', `exactly, it is ${show(a)}; ${right.trim()} is right if the percent means a third (or two thirds), as it often does: write "one third" and it is PROVEN`];
  }
  const REWRITTEN = /^\s*\d[\d,]*(?:\.\d+)?\s*\/\s*2\s*[+-]|^\s*\d+(?:\.\d+)?\/100\s*\*/;
  if (op === 'eq' && !ok && said && said !== claim && (GROUP_WORD.test(said) || (REWRITTEN.test(left) && !/=/.test(said) && /\b(?:is|was|equals|comes\s+to)\b/i.test(said)))) {
    const n = String.raw`(\d[\d,]*(?:\.\d+)?)`;
    const m = left.match(new RegExp(String.raw`^\s*\(?\s*((?:${n}\/100|${n})\s*\*)\s*${n}\s*\)?\s*([+-])\s*${n}\s*$`)), d = left.match(new RegExp(String.raw`^\s*\(?\s*${n}\s*\/\s*${n}\s*\)?\s*([+-])\s*${n}\s*$`));
    const alt = m ? `${m[1]} (${m[4]} ${m[5]} ${m[6]})` : d ? `(${d[1]} ${d[3]} ${d[4]}) / ${d[2]}` : null;
    let held = false;
    if (alt) { try { held = expr(alt).cmp(b) === 0; } catch (e) { held = false; } }
    if (held) return [GUESS, 'grouping', `read in the usual order, the math gives ${show(a)}, not ${right.trim()}; ${right.trim()} is right if the sum is worked out first: write brackets, as in "${alt.replace(/\s+/g, ' ')} = ${right.trim()}", and it is PROVEN`];
  }
  if (op === 'eq' && !ok && softReading(left, said, claim))
    return [GUESS, 'reading', `read from the words, the math gives ${show(a)}, not ${right.trim()}; the sentence may count something this check does not read (other shares, overtime, more items, a refund, interest, a different period), so it is not called false: write the math out and it is checked`];
  return [ok ? PROVEN : FALSIFIED, 'math', `exact fractions: left is ${show(a)}, right is ${show(b)}`];
}

const MR_LIMIT = 3317044064679887385961981n, MR_BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n];
const powmod = (b, e, m) => { let r = 1n; b %= m; while (e) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; };
export function isPrime(n) {
  if (n < 2n) return false;
  for (const p of MR_BASES) { if (n === p) return true; if (n % p === 0n) return false; }
  if (n >= MR_LIMIT) throw new Cant('a number this big needs a prime test the browser cannot finish exactly');
  let d = n - 1n, s = 0n; while (!(d & 1n)) { d >>= 1n; s++; }
  for (const a of MR_BASES) {
    let x = powmod(a, d, n); if (x === 1n || x === n - 1n) continue;
    let comp = true; for (let r = 1n; r < s; r++) { x = x * x % n; if (x === n - 1n) { comp = false; break; } }
    if (comp) return false;
  }
  return true;
}

const DATEFORM = /^(\d{4}-\d{2}-\d{2})\s+([+-])\s+(\d{1,5})\s+days\s*=\s*(\d{4}-\d{2}-\d{2})\.?$/;
const LONG = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
function checkDate(claim) {
  const m = claim.trim().match(DATEFORM); if (!m) return null;
  const [, a, sign, n, b] = m, t = Date.parse(a + 'T00:00:00Z') + (sign === '-' ? -1 : 1) * Number(n) * 86400000;
  const got = new Date(t).toISOString().slice(0, 10);
  const what = `${n} calendar days ${sign === '-' ? 'before' : 'after'} ${LONG(a)} is ${LONG(got)}`;
  if (got === b) return [PROVEN, 'date', `Counted on the calendar: ${what}. Court deadlines may skip weekends and holidays; this counts every day.`];
  const step = sign === '-' ? -1 : 1, dow = s => new Date(s + 'T00:00:00Z').getUTCDay(), day = k => new Date(t + k * step * 86400000).toISOString().slice(0, 10);
  for (let k = 1, weekdays = 0; k <= 4; k++) {
    if (![0, 6].includes(dow(day(k - 1)))) weekdays++;
    if (weekdays > 1 || weekdays === 1 && k === 1) break;
    if (day(k) === b && ![0, 6].includes(dow(b)))
      return [GUESS, 'reading', `Counted on the calendar: ${what}, a ${new Date(t).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long' })}. ${LONG(b)} is that date moved off ${weekdays ? 'a weekend and a possible holiday' : 'the weekend'}, as court rules do (FRCP 6(a)). Which court and which holidays apply is not read here, so it is not called false and not proven.`];
  }
  return [FALSIFIED, 'date', `Counted on the calendar: ${what}, not ${LONG(b)}. Court deadlines may skip weekends and holidays; this counts every day.`];
}
function checkPrime(claim) {
  const m = claim.trim().match(FORMS.prime); if (!m) return null;
  const q = expr(m[1]).q(); if (!q.int) throw new Error('a prime check needs a whole number');
  const n = q.n, is = isPrime(n), want = !m[2];
  let shown = `${n} ${is ? 'is' : 'is not'} prime`;
  if (!is && n > 3n) for (let d = 2n; d <= 1000000n && d * d <= n; d++) if (n % d === 0n) { shown += `: ${d} x ${n / d} = ${n}`; break; }
  return [is === want ? PROVEN : FALSIFIED, 'prime', shown];
}

const HEDGE = /\b(about|around|roughly|approximately|approx|nearly|almost|circa|some)\b|~|≈/i;
const qabs = q => (q.n < 0n ? new Q(-q.n, q.d) : q);
function nearEnough(exact, off, said) {
  const r = HEDGE.test(said) ? new Q(1n, 10n) : new Q(1n, 50n);
  const exLo = exact.lo.n <= 0n && exact.hi.n >= 0n ? new Q(0n) : qmin(qabs(exact.lo), qabs(exact.hi)), exHi = qmax(qabs(exact.lo), qabs(exact.hi));
  if (exHi.n === 0n) return true;
  const offHi = qmax(qabs(off.lo), qabs(off.hi)), offLo = off.lo.n <= 0n && off.hi.n >= 0n ? new Q(0n) : qmin(qabs(off.lo), qabs(off.hi));
  if (offHi.cmp(r.mul(exLo)) <= 0) return true;
  if (offLo.cmp(r.mul(exHi)) > 0) return false;
  throw new Cant('the value sits too close to the edge of how far a rounded answer may be off to tell without exact algebra');
}

function checkRounded(claim, text = claim) {
  const m = claim.trim().match(FORMS.approx); if (!m) return null;
  const digits = m[2].replace(/,/g, ''), power = BigInt(m[3] || 0);
  let unit;
  if (digits.includes('.')) unit = new Q(1n, 10n ** BigInt(digits.split('.')[1].length));
  else { const z = /[1-9]/.test(digits) ? digits.length - digits.replace(/0+$/, '').length : 0; unit = new Q(10n ** BigInt(z)); }
  const scale = power >= 0n ? new Q(10n ** power) : new Q(1n, 10n ** -power);
  const neg = /(?:~=|≈)\s*\(?\s*-/.test(claim);
  const said = Q.of(digits).mul(scale).mul(new Q(neg ? -1n : 1n)); unit = unit.mul(scale);
  const exact = expr(m[1]), off = exact.sub(new V(said)), half = unit.div(new Q(2n)), nhalf = new Q(0n).sub(half);
  let ok;
  if (off.lo.cmp(nhalf) >= 0 && off.hi.cmp(half) <= 0) ok = true;
  else if (off.lo.cmp(half) > 0 || off.hi.cmp(nhalf) < 0) ok = false;
  else throw new Cant('the value sits too close to the edge of the rounding to tell without exact algebra');
  if (ok && !nearEnough(exact, off, text)) {
    const pct = Math.round(100 * Math.abs(off.lo.add(off.hi).num() / 2 / ((exact.lo.add(exact.hi).num() / 2) || 1)));
    return [FALSIFIED, 'rounded', `exact value ${show(exact)}; the answer said ${show(said)}, which is ${pct}% off, more than a rounded answer may be (${HEDGE.test(text) ? '10% when it says about' : '2%, or 10% when it says about'})`];
  }
  return [ok ? PROVEN : FALSIFIED, 'rounded', `exact value ${show(exact)}; the answer said ${show(said)}, which allows up to ${show(half)} either way`];
}

const WEB = { page: 'page', wiki: 'wiki', wikidata: 'wikidata', wikidataNamed: 'wikidata', event: 'event' };

export function run(form, said = form) {
  const open = openProblem(said);
  if (open) return [OPEN, 'open', open];
  if (!form) return [GUESS, 'none', guessWhy(said)];
  const SOURCE = { page: 'web page', wiki: 'Wikipedia', wikidata: 'Wikidata', event: 'Wikidata' };
  for (const [k, name] of Object.entries(WEB)) if (FORMS[k].test(form.trim())) return [GUESS, name, `${SOURCE[name]} claim: settled by a lookup, not by math; look it up below`];
  for (const [check, name] of [[checkDate, 'date'], [checkPrime, 'prime'], [checkRounded, 'rounded'], [checkMath, 'math']]) {
    let out;
    try { out = check(form, said); }
    catch (e) { return [GUESS, name, e instanceof Cant ? `past exact arithmetic: ${e.message}; look it up below` : `the math in it could not be read: ${e.message === 'the math could not be read' ? 'a sign or a bracket is out of place' : e.message}`]; }
    if (out) {
      const names = new Set(form.match(/[A-Za-z_][A-Za-z_0-9]*/g) || []);
      if ((out[1] === 'math' || out[1] === 'rounded') && [...names].some(w => w in DEFINED)) return [out[0], 'defined', out[2]];
      return out;
    }
  }
  return [GUESS, 'none', guessWhy(said)];
}

export function readable(form, text = '') {
  if (!form) return null;
  const f = String(form).trim().slice(0, 300), page = f.match(FORMS.page);
  if (page && !text.includes(page[1])) return null;
  const ok = page || FORMS.wiki.test(f) || FORMS.prime.test(f) || FORMS.approx.test(f) || FORMS.wikidata.test(f) || FORMS.wikidataNamed.test(f) || FORMS.event.test(f)
    || (RELATIONS.some(([s]) => f.includes(s)) && /\d/.test(f) && MATH_CHARS.test(f.replace(/[<>=!]/g, ' ')));
  return ok && stated(f, text) ? f : null;
}

function stated(f, text) {
  if (!text) return true;
  const flat = text.replace(/(?<=\d),(?=\d{3})/g, ''), m = f.match(FORMS.approx);
  const said = m ? m[2].replace(/,/g, '') : (!FORMS.prime.test(f) && /^[^<>]*=[^=]/.test(f) && !/[A-Za-z]/.test(f) ? f.split('=').pop().trim() : null);
  if (said === null || !/^\d+(\.\d+)?$/.test(said)) return true;
  const seen = new Set(), SCALE = { thousand: 3n, million: 6n, billion: 9n, trillion: 12n };
  for (const m of flat.matchAll(/(?<![\d.])(\d+(?:\.\d+)?)(?:\s*(%|percent)|\s+(thousand|million|billion|trillion))?/gi)) {
    const q = Q.of(m[1]); seen.add(String(q));
    if (m[2]) seen.add(String(q.div(new Q(100n))));
    if (m[3]) seen.add(String(q.mul(new Q(10n ** SCALE[m[3].toLowerCase()]))));
  }
  return seen.has(String(Q.of(said)));
}
