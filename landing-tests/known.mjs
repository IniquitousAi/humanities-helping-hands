import { run } from '../landing/checker.js';
import { findClaims } from '../landing/finder.js';

const FORMS = [
  ['17 * 23 = 391', 'PROVEN'], ['17 * 23 = 392', 'FALSIFIED'], ['2^10 > 1000', 'PROVEN'], ['2^100 < 10^30', 'FALSIFIED'],
  ['91 is not prime', 'PROVEN'], ['91 is prime', 'FALSIFIED'], ['2^61 - 1 is prime', 'PROVEN'], ['1 is prime', 'FALSIFIED'],
  ['pi > 3.15', 'FALSIFIED'], ['pi ~= 3.14', 'PROVEN'], ['sqrt(2) ~= 1.414', 'PROVEN'], ['sqrt(2) ~= 1.42', 'FALSIFIED'],
  ['10000 * 1.07^10 ~= 19671.51', 'PROVEN'], ['10000 * 1.07^10 ~= 19671.52', 'FALSIFIED'], ['au / c ~= 500', 'PROVEN'],
  ['(325 - 32) * 5 / 9 ~= 163', 'PROVEN'], ['2^1000000 > 1', 'GUESS'], ['log(10) > 2', 'GUESS'], ['1 / 0 = 1', 'GUESS'],
  ['wikipedia "Moon" says "The Moon is a natural satellite."', 'GUESS'], [null, 'GUESS'], ['hello = 3', 'GUESS'],
];
const TEXTS = [
  ['3.7 liters is roughly 18 cups.', 'FALSIFIED'], ['Most adults need about 3.7 liters of water a day, which is roughly 18 cups.', 'FALSIFIED'],
  ['3.7 liters is roughly 15 cups.', 'GUESS'],
  ['17 × 23 = 391.', 'PROVEN'], ['Water boils at 100 °C, which is 212 °F.', 'PROVEN'], ['It is 8,848.86 meters (29,031.7 feet) tall.', 'PROVEN'],
  ['Sound travels at about 343 meters per second (roughly 1,235 km/h or 767 mph).', 'PROVEN'],
  ['Drinking water is good for your skin.', 'GUESS'], ['2,147,483,647 is a prime number.', 'PROVEN'],
  ['3 plus eight = 11.', 'PROVEN'], ['Three plus eight equals eleven.', 'PROVEN'], ['3 plus eight = 12.', 'FALSIFIED'],
  ['Twenty-one divided by seven is equal to 3.', 'PROVEN'], ['Six times seven equals 41.', 'FALSIFIED'],
  ['3 plus geight = 11.', 'GUESS'], ['3 plus geight = 12.', 'GUESS'], ['Take one pill three times a day.', 'GUESS'],
  ['The weight is 5 kg, plus 2 kg of water, so 7 kg = 7 kg.', 'GUESS'],
];
const TYPOS = [
  ['3 plus geight = 11.', 'geight', 'eight', '3 + 8 = 11'], ['Fivve minus 2 = 3.', 'Fivve', 'five', '5 - 2 = 3'],
];
for (const [text, word, meant, form] of TYPOS) {
  const [c] = findClaims(text);
  if (c.form !== null || c.maybe?.word !== word || c.maybe?.meant !== meant || c.maybe?.form !== form) { miss++; console.log(`MISS typo "${text}": ${JSON.stringify(c)}`); }
}
let miss = 0;
for (const [form, want] of FORMS) { const [got, , why] = run(form); if (got !== want) { miss++; console.log(`MISS form ${form}: want ${want}, got ${got} (${why})`); } }
for (const [text, want] of TEXTS) {
  const cs = findClaims(text), verdicts = cs.map(c => run(c.form)[0]);
  const got = verdicts.find(v => v !== 'GUESS') || 'GUESS';
  if (got !== want) { miss++; console.log(`MISS text "${text}": want ${want}, got ${got} (${JSON.stringify(cs)})`); }
  if (want !== 'FALSIFIED' && verdicts.includes('FALSIFIED')) { miss++; console.log(`MISS text "${text}": a true claim was caught false`); }
}
console.log(JSON.stringify({ checks: FORMS.length + TEXTS.length, missed: miss }));
process.exit(miss ? 1 : 0);
