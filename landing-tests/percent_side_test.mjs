import { findClaims, whole as wholeF } from '../landing/finder.js';
import { run as settle } from '../landing/checker.js';

const fails = []; let checks = 0;
const ok = (c, m) => { checks++; if (!c) fails.push(m); };
const labels = s => findClaims(s).filter(c => c.form).map(c => settle(c.form, c.said)[0]);
for (const s of ['3/4 is 75%.', '1/2 = 50%', '0.5 is 50 percent.', '7/8 = 87.5%', '2/5 is 40%.', '1/4 equals 25%'])
  ok(labels(s).length === 1 && labels(s)[0] === 'PROVEN', `"${s}" is not PROVEN: forms ${JSON.stringify(findClaims(s).map(c => c.form))}, labels ${labels(s)}`);
ok(labels('3/4 is 70%.')[0] === 'FALSIFIED', `"3/4 is 70%." is not FALSE: ${JSON.stringify(findClaims('3/4 is 70%.'))}`);
for (const s of ['3/4 is 50 + 25%.', '10 + 5% = 10.5', '100 is 10% of 1000.', '100 is 10%  of 1000.', '5 is 50% of 10', '12 = 15% on 80'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
const TRUE = [
  '50% is 1/2.', '75% = 3/4', '25 percent is 0.25.', '200% of 4 is 8.', '1.5 = 150%', '0.1% = 0.001',
  '2 x 3 = 6', '6 ÷ 2 = 3', '10 - 3 - 2 = 5', '2^10 = 1024', '-3 + 5 = 2', '1,000 + 1 = 1,001', '3.50 + 1.25 = 4.75',
  '1/3 + 1/3 = 2/3', '22/7 > 3.14', '0.333 < 1/3', '10 > 9', '1e3 = 1000', '(2 + 3) * 4 = 20', '2 + 3 * 4 = 14',
  '1 mile is 5280 feet.', '1 foot is 12 inches.', '100 cm is 1 m.', '1 hour is 3600 seconds.', '0 °C is 32 °F.', '1 inch is 2.54 cm.',
  '5 feet is 60 inches.', '2 + 2 is 4, and 3 + 3 is 6.', 'It is 7 pm, and 2 + 2 = 4.', 'Page 3: 1 + 1 = 2', '3 apples + 4 apples = 7 apples',
  'Version 2.0 is out and 2 * 2 = 4.', 'Of 10 people, 3 + 7 = 10.', '1/2 + 1/4 = 3/4', '12:30 is lunch; 5 + 5 = 10', '$5 + $5 = $10',
  'A dozen eggs is 12 eggs.', '1 kg = 1000 g', '1 km is 1000 m.', '1 pound is 16 ounces.', '9.99 rounds to 10.', '0.5 + 0.25 = 0.75',
  '2 to the power of 3 is 8.', '10 squared is 100.', '17 is prime.', '1 is not prime.', '2 is prime.', '100 is 10%  of 1000.',
  '1-4 is -3', '3 - -2 = 5', '4 / 2 / 2 = 1', '2^3^2 = 512', '-2^2 = -4', '7 mod 3 = 1'];
const wrong = TRUE.filter(s => labels(s).includes('FALSIFIED'));
ok(!wrong.length, `true sentences labeled FALSE: ${wrong.join(' | ')}`);
const whole = s => findClaims(s).filter(c => c.form && !c.rest).map(c => settle(c.form, c.said)[0]);
for (const s of ['It is not true that 2 + 2 = 4.', '2 + 2 = 4 million.', '2 + 2 = 4 thousand', '3 + 3 = 6 billion people.', '2 + 2 = 4 more than 3.', '2 + 2 = 4 less than 10.'])
  ok(!whole(s).includes('PROVEN'), `"${s}" is PROVEN as a whole: ${JSON.stringify(findClaims(s))}`);
for (const s of ['-40 °C is 104 °F.', 'It was -10 °C, or 50 °F.', '-5 km is 5000 m', 'minus 40 °C is 104 °F', '5-10 km is 10000 m'])
  ok(!whole(s).includes('PROVEN'), `"${s}" is PROVEN: ${JSON.stringify(findClaims(s))}`);
for (const s of ['-40 °C is -40 °F.', '-10 °C is 14 °F.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" is FALSE: ${JSON.stringify(findClaims(s))}`);
ok(labels('-10 °C is 14 °F.')[0] === 'PROVEN', `"-10 °C is 14 °F." is not PROVEN: ${JSON.stringify(findClaims('-10 °C is 14 °F.'))}`);
ok(labels('-40 °C is -40 °F.')[0] === 'PROVEN', `"-40 °C is -40 °F." is not PROVEN: ${JSON.stringify(findClaims('-40 °C is -40 °F.'))}`);
ok(labels('-40 °C is 40 °F.')[0] === 'FALSIFIED' && labels('5 °F is -15 °C.')[0] === 'PROVEN', 'a negative answer is read wrong');
for (const [s, want] of [['The sum of 3 and 4 is 7.', 'PROVEN'], ['The sum of three and four is 8.', 'FALSIFIED'], ['The product of 3 and 4 is 12.', 'PROVEN'],
  ['The product of 2.5 and 4 is 11.', 'FALSIFIED'], ['2 * the sum of 3 and 4 = 14', 'PROVEN'], ['The sum of -3 and 5 is 2.', 'PROVEN']])
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['Twenty percent of 50 is 10.', 'PROVEN'], ['Twenty percent of 50 is 15.', 'FALSIFIED'], ['20% of 50 is 10', 'PROVEN'],
  ['A third of 9 is 3.', 'PROVEN'], ['A quarter of 20 is 6.', 'FALSIFIED'], ['Half of 10 is 5.', 'PROVEN'], ['One fifth of 25 is 5.', 'PROVEN'],
  ['2 * half of 10 = 10', 'PROVEN'], ['10 percent of 1,000 is 100.', 'PROVEN']])
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
for (const s of ['50% of 50% is 25%', '20% of 50 people is 10 people.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['1 week is 168 hours.', 'PROVEN'], ['2 weeks is 15 days.', 'FALSIFIED'], ['1 tonne is 1000 kg.', 'PROVEN'],
  ['500 mg is 0.5 g.', 'PROVEN'], ['1500 ms is 1.5 seconds.', 'PROVEN'], ['250 milligrams is 2.5 grams.', 'FALSIFIED']])
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
for (const s of ['1 Ms is 1000000 seconds.', '5 Mg is 5000 kg.', '3 Mm is 3000 km.', '1 MS is 1000000 s', '2 MG is 2000 kg'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const s of ['5 mm is 0.5 cm.', '2 KG is 2000 g', '1 Km is 1000 m', '250 ms is 0.25 s'])
  ok(labels(s)[0] === 'PROVEN', `"${s}" is not PROVEN: ${JSON.stringify(findClaims(s))}`);
for (const s of ['1 pint is 568 ml.', '1 gallon is 4.546 liters.', '1 quart is 1.137 litres.', '1 cup is 250 ml.', '1 tablespoon is 20 ml.',
  '2 pints is about 1.1 litres.', '1 l is 1.76 pints.', '1 pint of milk is 568 ml.', '1 cup is 284 ml'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['1 pint is 473 ml.', 'PROVEN'], ['1 gallon is 3.785 liters.', 'PROVEN'], ['4 quarts is 1 gallon.', 'PROVEN'],
  ['1 pint is 300 ml.', 'FALSIFIED'], ['1 gallon is 6 liters.', 'FALSIFIED'], ['1 cup is 100 ml.', 'FALSIFIED']])
  ok(labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['5 ft 10 in is 178 cm.', 'PROVEN'], ['He is 6 feet 2 inches, or 188 cm.', 'PROVEN'], ['1 lb 8 oz is 680 g.', 'PROVEN'],
  ['5 feet 10 inches is about 1.78 m.', 'PROVEN'], ['2 hours 30 minutes is 150 minutes.', 'PROVEN'], ['5 ft 10 in is 160 cm.', 'FALSIFIED'], ['1 h 30 min is 90 min', 'PROVEN']])
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
for (const s of ['1 oz of gold is 31.1 g.', '10 in 5 ft is 178 cm.', '1 m 80 cm is 180 cm.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const s of ['1/3 = 0.333...', '2/3 = 0.666…', '10 / 4 = 2 r 2', '7 / 2 = 3 remainder 1', '17 / 5 = 3 R 2', '22/7 = 3.142857...'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
ok(labels('2 + 2 = 4...')[0] === 'PROVEN' && labels('7 / 2 = 3.5')[0] === 'PROVEN' && labels('1/3 = 0.5...')[0] !== 'PROVEN', 'trailing dots read wrong');
for (const s of ['2(3 + 4) = 14', '3 (2 + 1) = 9', '1 in 3 = 33%', '1 out of 4 = 25%', '2 per 5 = 40%', '1 in 4 is 25%.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
ok(labels('(3 + 4) = 7')[0] === 'PROVEN' && labels('2 * (3 + 4) = 14')[0] === 'PROVEN' && labels('So (2 + 3) * 4 = 20')[0] === 'PROVEN', 'a plain bracket is no longer read');
for (const [s, want] of [['Ten times ten is one hundred.', 'PROVEN'], ['One hundred minus one is ninety-nine.', 'PROVEN'],
  ['Two hundred and five minus five is two hundred.', 'PROVEN'], ['Fifty plus fifty is a hundred.', 'PROVEN'], ['Ten times ten is two hundred.', 'FALSIFIED'],
  ['Forty-two plus eight is fifty.', 'PROVEN'], ['Ninety-nine plus one is one hundred.', 'PROVEN']])
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
for (const s of ['It warmed by 5 °C, or 9 °F.', 'A rise of 10 °C (18 °F).', 'Heat 2 cups (480 ml) of water.', 'I am 180 cm (5 ft 11 in) tall.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['180 cm is 5 ft 11 in.', 'PROVEN'], ['180 cm is 5 ft 2 in.', 'FALSIFIED'], ['1.5 hours is 1 hour 30 minutes.', 'PROVEN'],
  ['20 °C is 68 °F.', 'PROVEN'], ['20 °C is 36 °F.', 'FALSIFIED']])
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
for (const s of ['1 234 + 1 = 1 235', '10 000 / 10 = 1 000', '2^20 ≈ 1 million', '2^30 is about 1 billion.', '5 * 200 = 1 thousand'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
ok(labels('In 2024 2 + 2 = 4')[0] === 'PROVEN' && labels('2 + 2 = 4 apples')[0] === 'PROVEN' && labels('2 + 2 = 5 apples')[0] === 'FALSIFIED', 'plain sums near numbers changed');
for (const s of ['Mark 10:45 = 2 + 3?', 'At 10:45 = 40 + 5 minutes past', '2 + 2 = 4:1 odds', 'Score 3:2 + 1 = 4'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
ok(labels('Note: 2 + 2 = 4')[0] === 'PROVEN' && labels('Sum: 2 + 2 = 5')[0] === 'FALSIFIED', 'a colon after a word changed');
for (const [s, want] of [['1 acre is 4047 m².', 'PROVEN'], ['1 hectare is 2.47 acres.', 'PROVEN'], ['100 m² is 1076 sq ft.', 'PROVEN'],
  ['1 sq ft is 0.093 m²', 'PROVEN'], ['1 square mile is 640 acres.', 'PROVEN'], ['1 km² is 100 hectares.', 'PROVEN'], ['1 acre is 5000 m².', 'FALSIFIED'],
  ['1 m³ is 1000 l', 'PROVEN'], ['1000 cc is 1 liter', 'PROVEN'], ['500 cc is 0.5 liters.', 'PROVEN'], ['1 cubic foot is 28.3 liters.', 'PROVEN'],
  ['1 stone is 14 lb', 'PROVEN'], ['10 stone is 63.5 kg.', 'PROVEN'], ['1 stone is 10 kg.', 'FALSIFIED'], ['2 square meters is 20 square feet.', 'FALSIFIED']])
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['Three squared is nine.', 'PROVEN'], ['5 squared is 25.', 'PROVEN'], ['9 squared is 18.', 'FALSIFIED'], ['2 cubed = 8', 'PROVEN'],
  ['The square root of 16 is 4.', 'PROVEN'], ['The square root of 2 is about 1.414.', 'PROVEN'], ['The cube root of 27 is 3.', 'PROVEN'], ['√16 = 4', 'PROVEN'],
  ['The square root of 2 is 1.5.', 'FALSIFIED'], ['Double 7 is 14.', 'PROVEN'], ['Twice 7 is 15.', 'FALSIFIED'], ['Triple 3 is 9.', 'PROVEN'], ['3 dozen is 36.', 'PROVEN'],
  ['1 sq. ft. is 144 sq. in.', 'PROVEN'], ['5 cubic yards is 3.8 m³.', 'PROVEN'], ['2 squared plus 3 squared is 13.', 'PROVEN']])
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
for (const s of ['4 squared is 16 square meters.', 'Double down on 2 + 2 = 4.', 'I doubled 7 to get 14.', 'A double 7 is 14 points in dominoes.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['3/4 of 100 is 75.', 'PROVEN'], ['2/3 of 9 is 6.', 'PROVEN'], ['1/4 of 100 is 30.', 'FALSIFIED'], ['The average of 2 and 4 is 3.', 'PROVEN'],
  ['The mean of 1, 2 and 3 is 2.', 'PROVEN'], ['The average of 1, 2, 3, and 10 is 4.', 'PROVEN'], ['The average of 2 and 4 is 4.', 'FALSIFIED'],
  ['The difference of 10 and 4 is 6.', 'PROVEN'], ['The quotient of 10 and 2 is 5.', 'PROVEN'], ['The difference between 10 and 4 is 6.', 'PROVEN']])
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
for (const s of ['The average of 2 and 4 people is 3.', 'On 3/4 of the days, 2 + 2 = 4.', 'The difference of 4 and 10 is 6.', '1/2 of 1/2 is 1/4.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const s of ['Double 7 squared is 98.', 'Twice 3 squared is 18.', 'The difference of 10 and 4 squared is 6.', 'Half of 3 squared is 4.5.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['The average of 1,000 and 3,000 is 2,000.', 'PROVEN'], ['The average of 1, 2 and 3 is 2.', 'PROVEN'], ['The average of 1,000 and 3,000 is 1,500.', 'FALSIFIED'],
  ['4 squared is 16, and 16 squared is 256.', 'PROVEN'], ['2 plus double 3 is 8.', 'PROVEN']])
  ok(labels(s).every(l => l === want) && labels(s).length, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
for (const s of ['Solving x^2 - 4.5 = 0 gives x.', 'Profit(200) = 1,012,000 - 2,006,000 - 15', "Marginal Profit'(200) = 1,012,000 - 10030", 'Q(p=40) = 16 - 2 - 8 + 4',
  'At P(x = 200) = -2,194,000', 'f(40) = 16 - 2 - 8 + 4', 'the slopes RS (-3/2) and PQ (0.75) is (-3/2) * 0.75 = -9/8',
  '(37,441 x 4) / 6 = 24,960.67', '-42.7474 / 185 = -0.2311', '24/7 = 3.43', '2/3 = 0.67'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const [s, want] of [['176.3396 / 185 = 0.9529', 'FALSIFIED'], ['98.0 * 1.7982 - 87.0 * 1.0366 = 176.3396', 'FALSIFIED'], ['24/7 = 3.42', 'FALSIFIED'],
  ['0.1 + 0.2 = 0.3', 'PROVEN'], ['10 / 4 = 2.5', 'PROVEN'], ['So (2 + 3) * 4 = 20', 'PROVEN'], ['2^3 - 3 = 5', 'PROVEN']])
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
ok(/≈/.test(settle('24/7 = 3.43', '24/7 = 3.43')[2]), `a rounded "=" does not say to write ≈: ${settle('24/7 = 3.43', '24/7 = 3.43')}`);
for (const s of ['1 ton is 1000 kg.', '1 ton is 2000 pounds.', '1 year is 365 days.', '1 year is 365.25 days.'])
  ok(!labels(s).length, `"${s}" was checked, but its unit has more than one meaning: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['10/3 is about 3.33.', 'PROVEN'], ['22/7 is approximately 3.14.', 'PROVEN'], ['22/7 is roughly 3.15.', 'FALSIFIED'],
  ['2/3 is around 0.67', 'PROVEN'], ['2/3 is about 0.66', 'FALSIFIED'], ['A third of 10 is about 3.33.', 'PROVEN'], ['10/3 is about 3', 'PROVEN']])
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
const money = s => labels(s.replace(/[$€£](?=\s?\d)\s?/g, ''));
for (const [s, want] of [['The 25% fee on $80,000 is $20,000.', 'PROVEN'], ['The 25% fee on $80,000 is $25,000.', 'FALSIFIED'],
  ['A 40% contingency fee on a $250,000 verdict is $100,000.', 'PROVEN'], ['The 6% sales tax on $1,200 is $72.', 'PROVEN'],
  ['A one-third fee on $90,000 is $30,000.', 'PROVEN'], ['Half of the $18,000 estate is $9,000.', 'PROVEN'], ['Half of the $18,000 estate is $9,500.', 'FALSIFIED'],
  ['20% of the $500 budget is $100.', 'PROVEN'], ['A 15% tip on $60 is $9.', 'PROVEN'], ['33% of $300 is $99.', 'PROVEN'], ['33% of $45,000 is $16,000.', 'FALSIFIED'],
  ['33% of $45,000 is $20,000.', 'FALSIFIED'], ['The 33% fee on $45,000 is $14,850.', 'PROVEN']])
  ok(money(s).length === 1 && money(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const s of ['33% of $45,000 is $15,000.', 'The 33% contingency fee on $45,000 is $15,000.', '67% of $90,000 is $60,000.', '66% of 300 is 200.',
  '33% of $100,000 is $33,333.', '33% of $100,000 is $33,333.33', '33.3% of $45,000 is $15,000.'])
  ok(money(s).length === 1 && money(s)[0] === 'GUESS', `"${s}" (a third, said as 33% or 67%) is not left unchecked: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const s of ['A 10% raise on $50 is $55.', 'Interest of 5% on $10,000 for 3 years is $1,500.', '5% interest on $10,000 for 3 years is $1,500.',
  'A 20% markup on $50 is $60.', '5% interest on $10,000 monthly is $41.67.', 'A 10% discount on $50 is $45.', '12 = 15% on 80'])
  ok(!money(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const [s, want] of [['The 33% fee on $45,000 would be $14,850.', 'PROVEN'], ['20% of $50 will be $10.', 'PROVEN'], ['3 * 4 comes to 12.', 'PROVEN'],
  ['3 * 4 was 13.', 'FALSIFIED'], ['2,400 + 350 + 125 comes to 2,875.', 'PROVEN'], ['Half of the $18,000 estate would be $9,000.', 'PROVEN']])
  ok(money(s).length === 1 && money(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['The total of $2,400 + $350 + $125 is $2,875.', 'PROVEN'], ['The total of 2,400 + 350 + 125 is 2,975.', 'FALSIFIED'],
  ['The cost of 3 * $12 is $36.', 'PROVEN'], ['The balance of 500 - 120 is 380.', 'PROVEN']])
  ok(money(s).length === 1 && money(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['The log of 2 + 6 = 3', 'Half of 10 + 2 = 7', '7 mod 4 + 1 = 4'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['Two-thirds of $90,000 is $60,000.', 'PROVEN'], ['Two thirds of 9 is 3.', 'FALSIFIED'], ['Three quarters of 200 is 150.', 'PROVEN'],
  ['$18,000 divided among 3 heirs is $6,000 each.', 'PROVEN'], ['The $18,000 estate split 3 ways is $6,000 each.', 'PROVEN'],
  ['$18,000 split 3 ways is $5,000.', 'FALSIFIED'], ['$900 shared equally between 2 partners is $450.', 'PROVEN'],
  ['$5,000 - $3,250 leaves $1,750.', 'PROVEN'], ['$5,000 - $3,250 leaves $1,850.', 'FALSIFIED'], ['3 * 4 gives 12.', 'PROVEN']])
  ok(money(s).length === 1 && (money(s)[0] === want || (want === 'PROVEN' && findClaims(s.replace(/[$]/g, ''))[0].form)), `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.rest, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['10 divided among 3 is not even.', 'Split 3 ways, 10 is a lot.', '18000 split 3 ways leaves 6000 each and 0 over.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['12 hours at $250 an hour is $3,000.', 'PROVEN'], ['At $250 per hour, 12 hours is $3,000.', 'PROVEN'], ['12 hours x $250 = $3,000.', 'PROVEN'],
  ['12 hours at $250 an hour is $3,500.', 'FALSIFIED'], ['3 nights at $120 a night comes to $360.', 'PROVEN'], ['40 copies at $0.25 each... no', null],
  ['10 hrs at $300/hour = $3,000', 'PROVEN'], ['100 shares at $12.50 per share is $1,250.', 'PROVEN']].filter(([, w]) => w))
  ok(money(s).length === 1 && money(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['12 days at $250 an hour is $3,000.', '2 weeks at $500 a day is $5,000.', 'At $250 per hour, 12 days is $3,000.'])
  ok(!labels(s.replace(/[$]/g, '')).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['Simple interest of 5% on $10,000 for 3 years is $1,500.', 'PROVEN'], ['5% simple interest on $10,000 for 3 years is $1,500.', 'PROVEN'],
  ['Simple interest at 6% a year on $2,000 for 6 months is $60.', 'PROVEN'], ['Simple interest of 5% on $10,000 for 3 years is $1,576.25.', 'FALSIFIED'],
  ['Simple interest of 4.5% per year on a $8,000 loan over 2 years comes to $720.', 'PROVEN']])
  ok(money(s).length === 1 && money(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['5% interest on $10,000 for 3 years is $1,576.25.', 'Interest of 5% on $10,000 for 3 years is $1,576.25.', '5% compounded on $10,000 for 3 years is $1,576.25.'])
  ok(!money(s).includes('FALSIFIED'), `"${s}" (compound reading) came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['30 days from March 1, 2026 is March 31, 2026.', 'PROVEN'], ['30 days after January 31, 2026 is March 2, 2026.', 'PROVEN'],
  ['30 days after January 31, 2024 is March 1, 2024.', 'PROVEN'], ['30 days after January 31, 2024 is March 2, 2024.', 'FALSIFIED'],
  ['2 weeks from November 8, 2026 is November 22, 2026.', 'PROVEN'], ['14 days before December 1, 2026 is November 17, 2026.', 'PROVEN'],
  ['21 days after Nov 8, 2026 is Nov 28, 2026.', 'FALSIFIED'], ['21 days after Nov 8, 2026 is Dec 2, 2026.', 'FALSIFIED'],
  ['21 days after Nov 8, 2026 is Nov 30, 2026.', 'GUESS'], ['60 days before 2026-09-30 is 2026-07-31.', 'GUESS'],
  ['14 days after service on May 1, 2026 is May 15, 2026.', 'PROVEN'], ['14 days after service on May 1, 2026 is May 16, 2026.', 'FALSIFIED'],
  ['30 days after the order dated March 2, 2026 is April 2, 2026.', 'FALSIFIED'],
  ['Prejudgment interest at 9% simple on 50,000 for 2 years is 9,000.', 'PROVEN'], ['5% simple interest on 10,000 for 3 years is 1,600.', 'FALSIFIED'],
  ['Interest at 10% simple on 1,000 for 3 years is 300 per year.', null],
  ['The answer is due 21 days after November 8, 2026, which is November 29, 2026.', null],
  ['60 days after December 15, 2026 falls on February 13, 2027.', 'PROVEN'], ['90 days from October 1, 2026 is a Wednesday, December 30, 2026.', 'PROVEN']].filter(([, w]) => w))
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const s of ['30 days from March 1 is March 31.', '10 business days from March 2, 2026 is March 13, 2026.', '30 days from February 30, 2026 is April 1, 2026.',
  '30 court days after March 2, 2026 is April 1, 2026.'])
  ok(!labels(s).length, `"${s}" was checked: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['Child support of $850 per month for 18 months is $15,300.', 'PROVEN'], ['$1,200 a month for 12 months is $14,400.', 'PROVEN'],
  ['Payments of $1,250.00 per month for 12 months total $15,000.00.', 'PROVEN'], ['$500 a week for 6 weeks comes to $3,500.', 'FALSIFIED'],
  ['Mileage of 120 miles at $0.67 per mile is $80.40.', 'PROVEN'], ['2 + 3 totals 5.', 'PROVEN'], ['2 + 3 totals 6.', 'FALSIFIED']])
  ok(money(s).length === 1 && money(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['$850 per month for 18 years is $15,300.', '$100 a day for 3 weeks is $300.', '120 miles at $0.67 per hour is $80.40.', '10 miles at 60 miles per hour is 10 minutes.', 'The 3 payments total 2 + 3 months.', 'Items 1-4 total 3 boxes.'])
  ok(!money(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['Late fee of 5% on a $2,000 balance is $100.', 'PROVEN'], ['A late fee of 5% on the $2,000 balance is $150.', 'FALSIFIED'],
  ['The 25% attorney fee on a $40,000 settlement is $10,000.', 'PROVEN'], ["A 40% attorney's fee on $50,000 is $20,000.", 'PROVEN'],
  ['A 30% contingency on $90,000 is $27,000.', 'PROVEN'], ['Sales tax of 8% on $250 is $25.', 'FALSIFIED']])
  ok(money(s).length === 1 && money(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['Late fee of 5% per month on a $2,000 balance is $100.', 'Interest of 5% on $10,000 for 3 years is $1,576.25.', 'A fee of 5% on 2,000 shares is 100 shares a year.'])
  ok(!money(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['Of the $12,000 estate, each of the 4 heirs receives $3,000.', 'PROVEN'], ['Of the $12,000 estate, each of the 3 heirs gets $3,000.', 'GUESS'],
  ['Of the $45,000 judgment, each of the 3 defendants owes $15,000.', 'PROVEN'], ['Of $900, each of 2 partners takes $450.', 'PROVEN']])
  ok(money(s).length === 1 && money(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['Of the $12,000 estate, each of the 4 heirs receives $3,000 a year.', 'Of the 12 jurors, each of the 4 alternates sat 3 days.',
  'Of the $12,000 estate, each of the 4 heirs receives at least $2,000.'])
  ok(!money(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['He worked 37.5 hours at $24 an hour, earning $900.', 'PROVEN'], ['She billed 12 hours at $250 an hour, for a total of $3,000.', 'PROVEN'],
  ['He worked 40 hours at $20 an hour, earning $900.', 'GUESS'], ['The firm spent 6 hours at $300 per hour, totaling $1,800.', 'PROVEN']])
  ok(money(s).length === 1 && money(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['He worked 37.5 hours at $24 an hour, earning $900 a week.', 'He worked 40 hours at $20 an hour, earning overtime after 8.', 'He worked 37.5 days at $24 an hour, earning $900.'])
  ok(!money(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['The filing fee is $405 and the service fee is $75, for a total of $480.', 'PROVEN'],
  ['The filing fee is $405 and the service fee is $75, for a total of $490.', 'GUESS'], ['Rent is $1,200 and the deposit is $600, totaling $1,800.', 'PROVEN']])
  ok(money(s).length === 1 && money(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['The fee is $405 and the service fee is $75, for a total of $480 a month.', 'The fee is 5% and the cap is $75, for a total of $80.',
  'The fee is $405 and the service fee is $75 per hour, for a total of $480.'])
  ok(!money(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['$850 to $900 per month for 18 months is $15,300 to $16,200.', 'Two kids at $850 per month for 18 months is $30,600.',
  'For 2 children, $850 per month for 18 months is $30,600.', 'Investing $100 a month for 12 months is $1,227.89 at 5% interest.',
  'Saving $100 a month for 12 months gives $1,227.89 with 5% interest compounded monthly.', '$2,000 a month for 6 months gives $10,000 after the $2,000 credit.',
  '$1,200 per month for 12 months is $13,200 after the free month.', 'Invoices 1-3 total $900.',
  'A commission of 6% on a $400,000 sale is $12,000 per side.', 'A commission of 6% on a $400,000 sale is $12,000 for each agent.',
  'Management fee of 1% on a $500,000 portfolio is $416.67 a month.', 'A penalty of 18% on a $1,000 balance is $15 a month.', 'Royalty of 10% on 1,000 copies is $1,500.',
  'Of the $100,000 estate, each of the 3 children receives $25,000.', 'Of the 20 apples, each of the 4 kids gets 3.', 'Of the 1,000 acres, each of the 2 sons inherits 300.',
  'Of the 30 students, each of the 5 teachers takes 4.', 'Of the $12,000 estate, each of the 4 heirs owes $300.', 'Of the 2025 budget, each of the 4 teams gets $3,000.',
  'Of the 2026 grant, each of the 5 schools receives $10,000.', 'Of the $10,000 estate, each of the 3 heirs receives $3,333.',
  'He worked 45 hours at $20 an hour, earning $950.', 'Two workers put in 10 hours at $20 an hour, earning $400.',
  'The rent is $1,000, the deposit is $500 and the pet fee is $200, for a total of $1,700.', 'Rent is $1,000, water is $50 and power is $150, for a total of $1,200.',
  'The charge is $500 and the refund is $100, for a total of $400.', 'The bill is $200 and the discount is $20, for a total of $180.',
  'For two adults and a child, the adult ticket is $20 and the child ticket is $10, for a total of $50.',
  'The first payment is $500 and each later payment is $250, for a total of $3,000.', 'The deposit is $500 and the monthly rent is $1,000, for a total of $3,500.',
  'The price is $200 and the tax rate is 8, for a total of $216.', '30 days after 01/15/2026 is 02/14/2026.', '30 days after 15/01/2026 is 14/02/2026.',
  '30 days after 1/15/26 is 2/14/26.', '30 days after 2026/01/15 is 2026/02/14.'])
  ok(!money(s).includes('FALSIFIED'), `"${s}" (true under a common reading) came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$€£](?=\s?\d)\s?/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['$850 per month for 18 months is $15,300 per year.', 'Of the 2024 budget, each of the 4 teams gets $506.'])
  ok(!money(s).includes('PROVEN'), `"${s}" (false) came back PROVEN: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['120 days after 2026-01-15 is 2026-05-15.', 'PROVEN'], ['30 days after 2024-01-31 is 2024-03-02.', 'FALSIFIED'],
  ['2 weeks from 2026-11-08 is 2026-11-22.', 'PROVEN'], ['30 days from March 1, 2026 is 2026-03-31.', 'PROVEN']])
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const s of ['2026-01-15 is 2026-05-15.', 'The hearing on 2026-01-15 was 2026-05-15 in the old notice.', 'Filed 2026-01-15, served 2026-02-01, the gap is 17 days.',
  '30 business days after 2026-03-02 is 2026-04-13.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
ok(/Counted on the calendar: 30 calendar days after January 31, 2024 is March 1, 2024, not March 2, 2024/.test(settle('2024-01-31 + 30 days = 2024-03-02')[2]), `the date reason: ${settle('2024-01-31 + 30 days = 2024-03-02')}`);
for (const [s, want] of [['A 1/3 fee on $90,000 is $30,000.', 'PROVEN'], ['A 2/5 share on $50,000 is $25,000.', 'FALSIFIED'],
  ['Damages of $12,000 trebled are $36,000.', 'PROVEN'], ['Treble damages on $12,000 are $36,000.', 'PROVEN'], ['Damages of $12,000 doubled are $36,000.', 'FALSIFIED'],
  ['Treble damages on $12,000 come to $36,000.', 'PROVEN'], ['3 + 4 are 7.', 'PROVEN'], ['2 * 3 were 7.', 'FALSIFIED']])
  ok(money(s).length === 1 && money(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['Ages 3-5 are 2 groups.', 'Items 1-4 are 3 boxes.', 'Treble damages are 3 times the actual damages.', 'The 1990-2000 years were 10 good ones.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['The judgment of $50,000 plus $2,500 in costs is $52,500.', 'PROVEN'], ['The judgment of $50,000 plus $2,500 in costs is $55,000.', 'FALSIFIED'],
  ['The retainer of $5,000 minus $3,250 billed leaves $1,750.', 'PROVEN'], ['$40,000 in damages + $5,000 in fees = $45,000', 'PROVEN'],
  ['The award of $10,000 + $800 interest is $10,800.', 'PROVEN']])
  ok(money(s).length >= 1 && money(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['2 + 3 km is 5 m.', 'He paid 2 + 2 fees is odd.'])
  ok(!labels(s).includes('PROVEN'), `"${s}" came back PROVEN: ${JSON.stringify(findClaims(s))}`);
for (const s of ['2 + 3 km is 5000 m.', 'He walked 2 + 3 km, which is 5000 m.', '10 - 4 kg is 6000 g', '2 * 3 ft is 6 ft.', 'Half of 4 km is 2000 m.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
ok(labels('3 km is 3000 m.')[0] === 'PROVEN' && labels('3 km is 300 m.')[0] === 'FALSIFIED' && labels('It is 5 km, which is 5000 m.')[0] === 'PROVEN', 'a plain conversion changed');
for (const s of ['1990-2000 was 10 years.', '1990-2000 is 10 years.', 'Ages 3-5 will be 2 groups.', 'Ages 3-5 is 2 groups.', 'Pages 10-20 is 11 pages.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" (a range) came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['1-4 is -3', 'PROVEN'], ['10-15 is -5', 'PROVEN'], ['5-3 is 2', 'PROVEN'], ['5-3 is 3', 'FALSIFIED']])
  ok(labels(s).length === 1 && labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
ok(!labels('2 + 2 is about to change.').length && !labels('5 * 5 is about 25 percent of 100').includes('FALSIFIED'), '"is about" read where it is no number');
ok(!labels('The sum of 3 and 4 and 5 is 7.').includes('PROVEN'), '"the sum of 3 and 4 and 5 is 7" is PROVEN');
ok(labels('2 + 2 = 4')[0] === 'PROVEN' && labels('2 + 2 = 5')[0] === 'FALSIFIED', 'plain arithmetic changed');
const verdict = s => findClaims(s.replace(/[$]/g, '')).filter(c => c.form).map(c => wholeF(c, settle(c.form, c.said))[0]);
for (const s of ['A 20% tip on a $45 dinner is $9, so the total is $60.', 'A 20% tip on a $45 dinner is $9, so the total is $54.',
  'The 10% fee on $500 is $50, leaving $400.', '2 + 2 = 4, so 7.', '2 + 2 = 4, which is prime.', '2 + 2 = 4, a prime number.'])
  ok(verdict(s)[0] !== 'PROVEN', `"${s}" came back PROVEN with a number never checked: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['A 20% tip on a $45 dinner is $9.', '2 + 2 = 4', '3 km is 3000 m.', 'It is 5 km, which is 5000 m.', '-40 °C is -40 °F.'])
  ok(verdict(s)[0] === 'PROVEN', `"${s}" is no longer PROVEN: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
ok(verdict('2^31 - 1 = 2147483647 is prime').join() === 'PROVEN,PROVEN', `"2^31 - 1 = 2147483647 is prime" is ${verdict('2^31 - 1 = 2147483647 is prime')}`);
ok(verdict('2^31 - 5 = 2147483647 is prime').includes('FALSIFIED'), `"2^31 - 5 = 2147483647 is prime" is ${verdict('2^31 - 5 = 2147483647 is prime')}`);
ok(verdict('5 tickets at $12 each is $65.')[0] !== 'PROVEN', '"5 tickets at $12 each is $65." came back PROVEN');
for (const [s, want] of [['5 tickets at $12 each is $60.', 'PROVEN'], ['10 gallons at $3.50 a gallon is $35.', 'PROVEN'],
  ['40 hours at $15 an hour earns $600.', 'PROVEN'], ['40 hours at $15 an hour earns $650.', 'FALSIFIED'], ['3 nights at $120 a night costs $360.', 'PROVEN'],
  ['At $15 an hour for 40 hours, you earn $600.', 'PROVEN'], ['At $15 an hour for 40 hours, you earn $500.', 'FALSIFIED'], ['4 boxes at $2.50 each come to $10.', 'PROVEN']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['5 tickets at $12 each is $60 a week.', '40 hours at $15 an hour earns $600 a week.', 'At $15 an hour for 40 days, you earn $600.',
  '10 gallons at $3.50 a liter is $35.', 'At $15 an hour for 40 hours, you earn $600 plus tips.', '2 kids at $12 each is $24 after tax.'])
  ok(!verdict(s).includes('FALSIFIED') && verdict(s)[0] !== 'PROVEN', `"${s}" (more than the math) was read: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['10% off $50 is $45.', 'PROVEN'], ['10% off $50 is $5.', 'PROVEN'], ['10% off $50 is $40.', 'FALSIFIED'], ['15% off a $40 shirt is $34.', 'PROVEN'],
  ['A 20% discount on $60 is $48.', 'PROVEN'], ['A 20% discount on $60 is $12.', 'PROVEN'], ['A 10% raise on $50,000 is $55,000.', 'PROVEN'], ['A 50% markup on $20 is $10.', 'PROVEN'],
  ['$50 plus 8% tax is $54.', 'PROVEN'], ['$50 plus 8% tax is $55.', 'FALSIFIED'], ['$50 with a 20% tip is $60.', 'PROVEN'],
  ['An increase from 50 to 75 is 50%.', 'PROVEN'], ['A drop from 80 to 60 is 25%.', 'PROVEN'], ['The percent increase from 50 to 75 is 50%.', 'PROVEN'], ['Growth from 1,000 to 1,250 was 25%.', 'PROVEN']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['A 20% discount on $60 is $50.', 'An increase from 50 to 75 is 25%.', 'A drop from 80 to 60 is 20%.'])
  ok(verdict(s)[0] !== 'PROVEN', `"${s}" came back PROVEN: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['10% off $50 is $45 with the coupon.', '$50 plus 8% tax is $54 a month.', 'An increase from 50 to 75 is 50 points.', 'Prices rose 10% off a low base.', '25% off $39.99 is $29.99.', 'A rise from 3 to 4 is 33%.'])
  ok(!verdict(s).includes('FALSIFIED'), `"${s}" (more than the math, or rounded) came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['180 miles in 3 hours is 60 miles per hour.', '150 km in 2 hours is 75 km/h.', 'Driving 60 miles per hour for 3 hours covers 180 miles.', 'Walking at 3 mph for 2 hours covers 6 miles.',
  'At 60 mph, 180 miles takes 3 hours.', 'There are 24 hours in a day.', 'There are 5280 feet in a mile.', 'A week has 7 days.', 'A meter has 100 centimeters.'])
  ok(verdict(s)[0] === 'PROVEN', `"${s}" is not PROVEN: ${JSON.stringify(findClaims(s))}`);
ok(verdict('There are 25 hours in a day.')[0] === 'FALSIFIED', '"There are 25 hours in a day." is not FALSE');
for (const s of ['180 miles in 3 hours is 50 mph.', 'Driving 60 mph for 3 hours covers 200 miles.', 'At 60 mph, 180 km takes 3 hours.', '180 miles in 3 hours is 60 km/h.'])
  ok(verdict(s)[0] !== 'PROVEN', `"${s}" came back PROVEN: ${JSON.stringify(findClaims(s))}`);
for (const s of ['There are 365 days in a year.', 'There are 4 weeks in a month.', 'A year has 365 days.', 'A ton has 2000 pounds.', 'A car has 4 wheels.', 'There are 3 people in a car.',
  'There are 100 pennies in a dollar.', 'A dozen has 12 eggs.', '180 miles in 3 hours is 60 mph on average.'])
  ok(!verdict(s).includes('FALSIFIED'), `"${s}" (loose, or more than the math) came back FALSE: ${JSON.stringify(findClaims(s))}`);
for (const [s, want] of [['If 3 apples cost $1.50, one apple costs $0.50.', 'PROVEN'], ['If 3 apples cost $1.50, one apple costs $0.60.', 'FALSIFIED'],
  ['If 2 tickets cost $30, 3 tickets cost $45.', 'PROVEN'], ['If 2 tickets cost $30, 3 tickets cost $40.', 'FALSIFIED'], ['4 pens cost $6, so each pen costs $1.50.', 'PROVEN'],
  ['If 1,000 bricks cost $500, one brick costs $0.50.', 'PROVEN'], ['From 9 am to 5 pm is 8 hours.', 'PROVEN'], ['From 10 pm to 6 am is 8 hours.', 'PROVEN'],
  ['From 8:30 am to 5 pm is 8.5 hours.', 'PROVEN'], ['A shift from 7 am to 3 pm is 8 hours.', 'PROVEN'], ['From 9:15 am to 10 am is 45 minutes.', 'PROVEN'],
  ['From 12 pm to 1 pm is 1 hour.', 'PROVEN'], ['From 12 am to 1 am is 1 hour.', 'PROVEN']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['From 9 am to 5 pm is 9 hours.', 'From 9:15 am to 10 am is 40 minutes.'])
  ok(verdict(s)[0] !== 'PROVEN', `"${s}" came back PROVEN`);
for (const s of ['If 3 apples cost $1.50, one pear costs $0.50.', 'If 3 apples cost $1.50, one apple costs $0.50 at the market.', 'From 9 am to 5 pm is 8 hours a day.', 'From 13 pm to 5 pm is 4 hours.'])
  ok(!verdict(s).includes('FALSIFIED') && verdict(s)[0] !== 'PROVEN', `"${s}" was read: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['$100 split 4 ways is $25 each.', '$18,000 divided among 3 heirs is $6,000 each.', 'A $60 pizza shared between 4 friends is $15 each.', '$90 split 3 ways is $30 apiece.', '$120 shared among 4 people is $30 per person.'])
  ok(verdict(s)[0] === 'PROVEN', `"${s}" is not PROVEN: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['$100 split 4 ways is $20 each.', '$100 split 4 ways is $25 each week.', '$100 split 4 ways is $25 each, plus tips.'])
  ok(verdict(s)[0] !== 'PROVEN' && !verdict(s).includes('FALSIFIED'), `"${s}" was PROVEN or FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['35 doubled is 70.', 'PROVEN'], ['40 doubled is 90.', 'FALSIFIED'], ['12 tripled is 36.', 'PROVEN'], ['35 halved is 17.5.', 'PROVEN'],
  ['$50 doubled is $100.', 'PROVEN'], ['1,500 doubled is 3,000.', 'PROVEN'], ['80 halved is 30.', 'FALSIFIED']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['In 2020 sales doubled to 80.', 'Sales of 40 doubled is a lot.', 'Room 12 tripled is booked.', '3.5 doubled is 7 roughly.'])
  ok(!verdict(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['20% of the 50 thousand is 10,000.', 'PROVEN'], ['The 25% fee on 80 thousand is 20,000.', 'PROVEN'], ['A 1/3 fee on 90 thousand is 30,000.', 'PROVEN'],
  ['Half of the 2 dozen is 12.', 'PROVEN'], ['Half of the $2 million is $1,000,000.', 'PROVEN'], ['10% of 2.5 million is 250,000.', 'PROVEN'], ['1.5 dozen is 18.', 'PROVEN'],
  ['20% of the 50 thousand is 12,000.', 'FALSIFIED'], ['Half of the 2 million is 2,000,000.', 'FALSIFIED']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['2^20 ≈ 1 million', '2^10 is about 1 thousand.', '20% of the 50 thousand is 10 thousand.', 'Half of the 1.5 dozen is 9.', 'Half of 3.1234 thousand is 1561.7.', '3 million people live there, and 2 + 2 = 4.', 'A dozen eggs is 12 eggs.'])
  ok(!verdict(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const [s, want] of [['20% of a $50 bill is $10.', 'PROVEN'], ['10% of a $300 paycheck is $30.', 'PROVEN'], ['30% of my $2,000 income is $600.', 'PROVEN'],
  ['Half of my 30 students is 15.', 'PROVEN'], ['A quarter of our $8,000 budget is $2,000.', 'PROVEN'], ['20% of a $50 bill is $15.', 'FALSIFIED'], ['Half of my 30 students is 20.', 'FALSIFIED']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['10% of a 5 km race is 500 meters.', 'Half of a 2 hour movie is 60 minutes.', 'Half of my 30 students is 15 kids.', '20% of a 40 hour week is 8 hours.',
  '50% of a 2 liter bottle is 1 liter.', 'Half of my 30 is 15 or so.'])
  ok(!verdict(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const [s, want] of [['20% of 50 dollars is 10 dollars.', 'PROVEN'], ['A 20% tip on 50 dollars is 10 dollars.', 'PROVEN'], ['5 dollars + 3 dollars = 8 dollars.', 'PROVEN'],
  ['20 bucks times 3 is 60 bucks.', 'PROVEN'], ['Half of 50 dollars is 25.', 'PROVEN'], ['20% of 50 dollars is 15 dollars.', 'FALSIFIED'], ['5 dollars + 3 dollars = 9 dollars.', 'FALSIFIED']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['Half of 2 dollars is 100 cents.', '1 dollar is 100 cents.', '10 dollars is 1,500 yen.', '10 dollars times 2 is 2,000 cents.', '20% of 50 dollars is 10 euros.',
  '2 dollars + 3 dollars is 500 pennies.', 'Half of 50 dollars is 2 quarters short of 25.', 'Half of the 20 euros is 15 dollars.', '20% of the 50 euros is 12 dollars.'])
  ok(!verdict(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const [s, want] of [['If you double 35 you get 70.', 'PROVEN'], ['35 times 2 makes 70.', 'PROVEN'], ['35 times 2 gives you 70.', 'PROVEN'],
  ['If you add 2 and 3 you get 5.', 'PROVEN'], ['If you multiply 6 by 7 you get 42.', 'PROVEN'], ['If you divide 20 by 4, you get 5.', 'PROVEN'],
  ['If you subtract 3 from 10 you get 7.', 'PROVEN'], ['Add 2 and 3 and you get 5.', 'PROVEN'], ['When you halve 50 you get 25.', 'PROVEN'], ['2 + 2 makes 4.', 'PROVEN'], ['If you double 1,250, you get 2,500.', 'PROVEN'],
  ['If you double 35 you get 80.', 'FALSIFIED'], ['If you multiply 6 by 7 you get 48.', 'FALSIFIED'], ['If you subtract 3 from 10 you get 13.', 'FALSIFIED'], ['3 + 4 makes 8.', 'FALSIFIED']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0], c.rest]))}`);
for (const s of ['3 eggs makes 12 cookies.', 'If you add 2 cups and 3 cups you get 5 cups.', 'If you add 2 and 3 you get 5 apples.', 'If you double 35 you get 70 or so.',
  '2 + 2 makes 4 pies.', 'If you divide 20 into 4 parts you get 5.', 'If you add 2 to 3 you get 6 points less than 11.'])
  ok(!verdict(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const s of ['2 + 3 is 6 less than 11.', '2 + 3 is 6 points less than 11.', '10 * 3 = 5 more than 25.', '50 / 2 is 2 short of 27.', '4 * 5 is 2 times as much as 10.',
  '12 + 8 is 5 dollars cheaper than 25.', '3 + 4 is 1 fewer than 8.'])
  ok(!verdict(s).includes('FALSIFIED') && verdict(s)[0] !== 'PROVEN', `"${s}" was read as its first number: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const [s, want] of [['2 + 3 is 5, less than 11.', 'GUESS'], ['2 + 3 = 6.', 'FALSIFIED'], ['2 + 3 is 5 and 5 is less than 11.', 'GUESS']])
  ok(verdict(s)[0] === want || (want === 'GUESS' && verdict(s)[0] !== 'FALSIFIED'), `"${s}" is not ${want}: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const s of ['2 + 2 = 5 is wrong.', '2 + 2 = 5 is false.', 'It is false that 2 + 2 = 5.', 'Nobody believes 2 + 2 = 5.', 'If 2 + 2 = 5, then pigs fly.',
  'Suppose 2 + 2 = 5.', 'Unless 2 + 2 = 5, we are fine.', 'It is a myth that 10% of 50 is 6.', 'Saying 3 + 3 = 7 is a mistake.', 'Never write 2 + 2 = 5.', 'Assuming 2 + 2 = 5, all of math breaks.'])
  ok(!verdict(s).includes('FALSIFIED'), `"${s}" (denied or supposed) came back FALSE: ${JSON.stringify(findClaims(s).map(c => [c.form, c.rest, c.form && settle(c.form, c.said)]))}`);
for (const s of ['He claimed 2 + 2 = 5.', 'Is 2 + 2 = 5?', '2 + 2 = 5', 'The 25% fee on $80,000 is $25,000.', 'My teacher says 2 + 2 = 5.', 'Clearly 7 * 8 = 54.', 'If 3 apples cost $1.50, one apple costs $0.60.'])
  ok(verdict(s)[0] === 'FALSIFIED', `"${s}" is no longer FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.rest]))}`);
for (const s of ['2 + 2 = 4 is wrong.', 'If 2 + 2 = 4, then pigs fly.', 'It is false that 2 + 2 = 4.'])
  ok(verdict(s)[0] !== 'PROVEN', `"${s}" came back PROVEN: ${JSON.stringify(findClaims(s).map(c => [c.form, c.rest]))}`);
for (const s of ['8 slices shared by 4 people is 2 slices each.', '8 slices shared between 4 people is 2 slices each.', '12 cookies divided among 3 kids is 4 cookies each.',
  '12 cookies shared equally by 3 kids is 4 each.', 'A $60 bill split evenly among 4 friends is $15 each.', '$90 split evenly 3 ways is $30 each.'])
  ok(verdict(s)[0] === 'PROVEN', `"${s}" is not PROVEN: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.rest]))}`);
for (const s of ['8 slices shared by 4 people is 3 slices each.', '8 slices shared by 4 people is 2 cookies each.', '8 slices shared by 4 people is 2 slices each day.',
  '12 cookies divided among 3 kids is 4 cookies each, plus milk.'])
  ok(verdict(s)[0] !== 'PROVEN' && !verdict(s).includes('FALSIFIED'), `"${s}" was PROVEN or FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.rest]))}`);
for (const [s, want] of [['There are 60 minutes in an hour, so 2.5 hours is 150 minutes.', 'PROVEN'], ['A week has 7 days, so 3 weeks have 21 days.', 'PROVEN'],
  ['3 weeks have 21 days.', 'PROVEN'], ['12 inches make 1 foot.', 'PROVEN'], ['3 weeks have 20 days.', 'FALSIFIED'], ['There are 60 minutes in an hour, so 2.5 hours is 160 minutes.', 'FALSIFIED'],
  ['There are 70 minutes in an hour, so 2 hours is 140 minutes.', 'FALSIFIED']])
  ok(want === 'PROVEN' ? verdict(s).every(v => v === 'PROVEN') && verdict(s).length > 0 : verdict(s).includes('FALSIFIED') && verdict(s)[0] !== 'PROVEN', `"${s}" is not ${want}: ${JSON.stringify(findClaims(s).map(c => [c.form, c.rest, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['3 weeks have 20 work days.', '4 weeks have 20 weekdays.', '2 days have 16 waking hours.', 'There are 60 minutes in an hour, so we have time.', '3 people have 6 hands.'])
  ok(!verdict(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const s of ['A 20% tip on $50 is $10 per hour.', '2 + 2 = 4 per day.', '10% of 50 is 5 per week.', 'A 20% tip on 50 dollars is 10 dollars per hour.',
  '3 * 4 = 12 an hour.', '3 * 4 = 12 a day.', '2 + 2 = 4 every week.', '3 * 4 = 12 each month.'])
  ok(verdict(s)[0] !== 'PROVEN', `"${s}" came back PROVEN: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.rest]))}`);
for (const s of ['$120 shared among 4 people is $30 per person.', '180 miles in 3 hours is 60 miles per hour.', '60 mph for 3 hours is 180 miles.', 'At $15 per hour, 8 hours is $120.', '$15 an hour for 8 hours is $120.', '$20 a day for 5 days is $100.'])
  ok(verdict(s)[0] === 'PROVEN', `"${s}" is no longer PROVEN: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.rest]))}`);
for (const [s, want] of [['The 33 1/3% contingency fee on $90,000 is $30,000.', 'PROVEN'], ['33 1/3% of $90,000 is $30,000.', 'PROVEN'], ['33 1/3 percent of 300 is 100.', 'PROVEN'],
  ['66 2/3% of 90 is 60.', 'PROVEN'], ['12 1/2% of 80 is 10.', 'PROVEN'], ['A 33 1/3% fee on a $90,000 settlement is $30,000.', 'PROVEN'],
  ['33 1/3% of $90,000 is $33,000.', 'FALSIFIED'], ['The 33 1/3% fee on $90,000 is $27,000.', 'FALSIFIED']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)[0]]))}`);
for (const s of ['A 33 1/3% raise on $90 is $120.', 'Rates rose 33 1/3% to 4 = 4.', 'The 33 1/3% rule: 2 + 2 = 4.', '33 1/3% + 66 2/3% = 100%.', 'It went up 12 1/2% so 80 is now 90.'])
  ok(!verdict(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const [s, want] of [['Billing 12.5 hours at $400 an hour is $5,000.', 'PROVEN'], ['Liquidated damages of $500 a day for 14 days is $7,000.', 'PROVEN'],
  ['The retainer of $10,000 less $7,250 billed leaves $2,750.', 'PROVEN'], ['$10,000 less $7,250 is $2,750.', 'PROVEN'], ['Fees of $500 a day for 14 days is $7,000.', 'PROVEN'],
  ['The penalty of $250 a day for 4 days is $1,000.', 'PROVEN'], ['Statutory damages of $750 + $750 is $1,500.', 'PROVEN'],
  ['Billing 12.5 hours at $400 an hour is $5,500.', 'FALSIFIED'], ['Liquidated damages of $500 a day for 14 days is $6,000.', 'FALSIFIED'], ['$10,000 less $7,250 is $3,750.', 'FALSIFIED']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.rest, c.form && settle(c.form, c.said)[0]]))}`);
for (const [s, want] of [['The partner billed 0.3 hours at $600, which is $180.', 'PROVEN'], ['Six months of rent at $1,500 is $9,000.', 'PROVEN'],
  ['Two nights at $189 is $378.', 'PROVEN'], ['12 hours at $250 = $3,000.', 'PROVEN'],
  ['6 months at $1,500 is $8,000.', 'FALSIFIED'], ['The partner billed 0.3 hours at $600, which is $200.', 'FALSIFIED']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.rest]))}`);
for (const s of ['3 hours at 60 mph is 180 miles.', '3 hours at $60 is $180 a day.', '2 days at 9 is 18 hours.', '6 months at $1,500 is $9,000 per year.'])
  ok(!verdict(s).includes('PROVEN') && !verdict(s).includes('FALSIFIED'), `"${s}" was read: ${JSON.stringify(verdict(s))}`);
for (const [s, want] of [['Half of the $500,000 marital estate is $250,000.', 'PROVEN'], ['25% of the $80,000 gross settlement is $20,000.', 'PROVEN'],
  ['Court costs of $350 and filing fees of $400 total $750.', 'PROVEN'], ['Rent of $1,200 and a deposit of $1,200 come to $2,400.', 'PROVEN'],
  ['Half of the $500,000 marital estate is $200,000.', 'FALSIFIED'], ['Court costs of $350 and filing fees of $400 total $800.', 'FALSIFIED']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.rest]))}`);
for (const s of ['Costs of $350 and fees of $400 total $750 a month.', 'A man of 30 and a woman of 40 are 70.', 'Half of the 10 more apples is 5.',
  '10% of the $500 gross per month is $50.'])
  ok(!verdict(s).includes('PROVEN') && !verdict(s).includes('FALSIFIED'), `"${s}" was read: ${JSON.stringify(verdict(s))}`);
for (const [s, want] of [['Splitting the $90,000 estate among three heirs gives each $30,000.', 'PROVEN'], ['Dividing $1,200 equally between 2 parents leaves each $600.', 'PROVEN'],
  ['The client owes $4,200 for 14 hours at $300 per hour.', 'PROVEN'], ['She billed $1,500 for 6 hours at $250 an hour.', 'PROVEN'],
  ['Splitting the $90,000 estate among three heirs gives each $40,000.', 'GUESS'], ['The client owes $5,000 for 14 hours at $300 per hour.', 'GUESS']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.rest]))}`);
for (const s of ['Splitting $100 between 4 friends gives each $25 a week.', 'He paid $300 for 3 days at $100 an hour.', 'The client owes $4,200 for 14 hours at $300 per hour plus costs.'])
  ok(!verdict(s).includes('PROVEN') && !verdict(s).includes('FALSIFIED'), `"${s}" was read: ${JSON.stringify(verdict(s))}`);
for (const [s, want] of [['Prejudgment interest of 9% on $40,000 for one year is $3,600.', 'PROVEN'], ['9% interest on $40,000 for a year is $3,600.', 'PROVEN'],
  ['After the 33% fee, the client keeps $67,000 of a $100,000 settlement.', 'PROVEN'], ['After a 25% cut, she gets $75 of $100.', 'PROVEN'],
  ['Prejudgment interest of 9% on $40,000 for one year is $4,000.', 'GUESS'], ['After the 33% fee, the client keeps $70,000 of a $100,000 settlement.', 'GUESS']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.rest]))}`);
for (const s of ['9% interest on $40,000 for 3 years is $10,800.', 'After the 33% fee, the client keeps $67,000 of a $100,000 settlement a year.',
  'After the 33.5% fee, the client keeps $66,500 of $100,000.'])
  ok(!verdict(s).includes('PROVEN') && !verdict(s).includes('FALSIFIED'), `"${s}" was read: ${JSON.stringify(verdict(s))}`);
for (const [s, want] of [['The $2,500 security deposit minus $400 in damages leaves $2,100.', 'PROVEN'], ['A $50,000 judgment plus $5,000 interest is $55,000.', 'PROVEN'],
  ['The $2,500 deposit minus $400 leaves $2,200.', 'FALSIFIED']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.rest]))}`);
for (const s of ['The total minus $400 is $2,100.', 'Rent - 400 = 2100.', 'The 5 apples minus 2 pears is 3.', 'My balance times 2 is 600.', 'Our share + 50 = 150.'])
  ok(!verdict(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => c.form))}`);
for (const [s, want] of [['Child support of $850 per month for 18 months is $15,300.', 'PROVEN'], ['Mileage of 120 miles at $0.67 per mile is $80.40.', 'PROVEN'],
  ['Paying $350 a month for 24 months comes to $8,400.', 'PROVEN'], ['Spousal support of $1,500 a month for 36 months is $54,000.', 'PROVEN'],
  ['The tenant paid $1,200 a month for 12 months, which is $14,400.', 'PROVEN'], ['Installments of $200 a week for 10 weeks total $2,000.', 'PROVEN'],
  ['Dues of $50 a month for 12 months is $600.', 'PROVEN'], ['The tenant paid $1,200 a month for 12 months, which is $15,400.', 'FALSIFIED'],
  ['Installments of $200 a week for 10 weeks total $3,000.', 'FALSIFIED'], ['Child support of $850 per month for 18 months is $15,000.', 'FALSIFIED']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['The tenant paid $1,200 a month for 12 years, which is $14,400.', 'Child support of $850 per month for 18 months is $15,300 per child.',
  'Installments of $200 a week for 10 months total $2,000.', 'Dues of $50 a month for 12 months is $600 a year.'])
  ok(verdict(s)[0] !== 'PROVEN' && !verdict(s).includes('FALSIFIED'), `"${s}" is not left unproven: ${verdict(s)} ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['Alimony of $2,000 a month is $24,000 a year.', 'PROVEN'], ['$24,000 a year is $2,000 a month.', 'PROVEN'],
  ['$100 a day is $700 a week.', 'PROVEN'], ['$300 a quarter is $1,200 a year.', 'PROVEN'], ["The firm's 30% share of $45,000 is $13,500.", 'PROVEN'],
  ['A lease of 36 months at $1,100 a month totals $39,600.', 'PROVEN'], ['Overtime at 1.5 times $20 an hour is $30 an hour.', 'PROVEN'],
  ["The firm's 30% share of $45,000 is $15,000.", 'FALSIFIED'], ['A lease of 36 months at $1,100 a month totals $40,000.', 'FALSIFIED'],
  ['Overtime at 1.5 times $20 an hour is $35 an hour.', 'FALSIFIED'],
  ['$100 a day is $800 a week.', 'GUESS'], ['Alimony of $2,000 a month is $25,000 a year.', 'GUESS']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${verdict(s)} ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['$500 a week is $26,000 a year.', '$500 a week is $26,071 a year.', 'Overtime at 1.5 times $20 an hour is $30 a day.',
  '$2,000 a month is $24,000 a year in alimony.', '$2,000 a month is $24,000 a week.', 'A lease of 36 months at $1,100 a year totals $39,600.'])
  ok(verdict(s)[0] !== 'PROVEN' && !verdict(s).includes('FALSIFIED'), `"${s}" is not left unproven: ${verdict(s)} ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['$50,000 reduced by 40% is $30,000.', 'PROVEN'], ['The award was reduced by 40%, from $50,000 to $30,000.', 'PROVEN'],
  ['Rent of $1,000 increased by 5% is $1,050.', 'PROVEN'], ['Rent was raised by 5% from $1,000 to $1,050.', 'PROVEN'],
  ['$80,000 minus a 25% fee is $60,000.', 'PROVEN'], ['The settlement of $80,000 minus the 25% fee leaves $60,000.', 'PROVEN'],
  ['$50,000 reduced by 40% is $20,000.', 'FALSIFIED'], ['The award was reduced by 40%, from $50,000 to $35,000.', 'FALSIFIED'],
  ['The settlement of $80,000 minus the 25% fee leaves $55,000.', 'FALSIFIED']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${verdict(s)} ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['The rate was reduced by 2%, from 5% to 3%.', '$50,000 reduced by 40% is $30,000 a year.', '$100 less 10% is $90.',
  '$50,000 reduced by 40% of the damages is $30,000.', 'Rent was raised by 5% from $1,000 to $1,050 a month.'])
  ok(verdict(s)[0] !== 'PROVEN' && !verdict(s).includes('FALSIFIED'), `"${s}" is not left unproven: ${verdict(s)} ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['Each of 4 partners puts in $25,000, for a total of $100,000.', 'PROVEN'], ['Each of the 3 heirs receives $30,000, totaling $90,000.', 'PROVEN'],
  ['Each of 12 jurors was paid $50 for a total of $600.', 'PROVEN'], ['Each of 4 partners puts in $25,000, for a total of $120,000.', 'GUESS']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${verdict(s)} ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['Each of 4 partners puts in $25,000, for a total of $100,000 a year.', 'Each of the 3 children receives $25,000 of a $100,000 estate.',
  'Each of 4 partners puts in $25,000 and a $5,000 fee, for a total of $100,000.'])
  ok(verdict(s)[0] !== 'PROVEN' && !verdict(s).includes('FALSIFIED'), `"${s}" is not left unproven: ${verdict(s)}`);
for (const s of ['Double 2 + 3 is 10.', 'Half of 4 + 6 is 5.', 'Three times 2 + 3 is 15.', 'Twice 5 - 1 is 8.', 'A third of 3 + 6 is 3.',
  'Half of 10 minus 2 is 4.', '2 times 3 + 4 is 14.', '10% of 50 + 50 is 10.'])
  ok(verdict(s)[0] === 'GUESS', `"${s}" (true when the sum is grouped first) is not left unchecked: ${verdict(s)} ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['Double 2 + 3 is 7.', 'PROVEN'], ['Double 2 + 3 is 9.', 'FALSIFIED'], ['Half of 4 + 6 is 9.', 'FALSIFIED'],
  ['2 * 3 + 4 = 14', 'FALSIFIED'], ['Three times 2 + 3 is 9.', 'PROVEN']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${verdict(s)} ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const [s, want] of [['Double the $5,000 deposit is $10,000.', 'PROVEN'], ['Twice the $1,500 monthly rent is $3,000.', 'PROVEN'],
  ['Triple the $20,000 award is $60,000.', 'PROVEN'], ['Double the $5,000 deposit is $12,000.', 'FALSIFIED']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${verdict(s)} ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['Double the $5,000 deposit is $10,000 a year.', 'Twice the $1,500 rent and fees is $3,000.'])
  ok(verdict(s)[0] !== 'PROVEN' && !verdict(s).includes('FALSIFIED'), `"${s}" is not left unproven: ${verdict(s)}`);
for (const [s, want] of [['9 of 12 jurors is 75%.', 'PROVEN'], ['9 out of 12 jurors is 75%.', 'PROVEN'], ['45 of the 50 claims was 90%.', 'PROVEN'],
  ['3 of 4 is 75%.', 'PROVEN'], ['9 of 12 jurors is 80%.', 'GUESS']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${verdict(s)} ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['10 of 12 jurors is 83%.', '3 of 10 is 30% of the book.', '1 of 4 people is 25% of the time.'])
  ok(verdict(s)[0] !== 'PROVEN' && !verdict(s).includes('FALSIFIED'), `"${s}" is not left unproven: ${verdict(s)}`);
for (const [s, want] of [['A $250,000 estate split equally among 5 heirs gives each $50,000.', 'PROVEN'],
  ['$1,200 divided between 2 parents leaves each $600.', 'PROVEN'], ['$90 split 3 ways gives each one $30.', 'PROVEN'],
  ['A $250,000 estate split equally among 5 heirs gives each $60,000.', 'GUESS'], ['$90 split 3 ways gives each one $20.', 'GUESS']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${verdict(s)} ${JSON.stringify(findClaims(s.replace(/[$]/g, '')))}`);
for (const s of ['$90 split 3 ways gives each $30 a week.', 'A $250,000 estate split among 5 heirs gives each $50,000 after taxes.'])
  ok(verdict(s)[0] !== 'PROVEN' && !verdict(s).includes('FALSIFIED'), `"${s}" is not left unproven: ${verdict(s)}`);
for (const s of ['2 + 2 = 4 fees.', '2 + 2 = 4 in damages per day.', '$500 less $100 is $400 a month.', '2 + 2 = 4, less 1.'])
  ok(verdict(s)[0] !== 'PROVEN', `"${s}" came back PROVEN`);
for (const s of ['Half of 10 is 5 less than 11.', '2 + 3 is 1 less than 6.', 'Half of (10 + 2) is 6.', 'The net of $10,000 less fees is $9,000.', 'Pay $100 less 10% is $90.',
  '5 is less than 10.', 'Spend 2 hours less, about 3 = 3.'])
  ok(!verdict(s).includes('FALSIFIED'), `"${s}" came back FALSE: ${JSON.stringify(findClaims(s.replace(/[$]/g, '')).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const s of ['2/3 is 67%', '2/3 is 66.7%', '1/6 is 17%', '1/7 is 14.3%', '5/8 is 63%', '50 is 50%.', '100 is 100%', 'My score of 45 is 90%.', '12 is 60% of the goal.'])
  ok(!labels(s).includes('FALSIFIED'), `"${s}" (a rounded percent) came back FALSE: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const [s, want] of [['3/4 is 70%', 'FALSIFIED'], ['2/3 is 60%', 'FALSIFIED'], ['5/8 is 62.5%', 'PROVEN'], ['3/4 is 75%', 'PROVEN'], ['1/2 is 150%', 'FALSIFIED'],
  ['3/2 is 150%', 'PROVEN'], ['1/200 is 0.5%', 'PROVEN'], ['1/1000 is 0.1%', 'PROVEN'], ['0.5 is 50%.', 'PROVEN'], ['0.25 is 20%', 'FALSIFIED']])
  ok(labels(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s).map(c => [c.form, c.form && settle(c.form, c.said)]))}`);
for (const [s, want] of [['3 out of 4 is 75%.', 'PROVEN'], ['7 out of 8 equals 87.5%', 'PROVEN'], ['45 out of 50 = 90%', 'PROVEN']])
  ok(verdict(s)[0] === want, `"${s}" is not ${want}: ${JSON.stringify(findClaims(s))}`);
for (const s of ['3 out of 4 is 70%.', '1 out of 3 is 30%.'])
  ok(verdict(s)[0] !== 'PROVEN', `"${s}" came back PROVEN: ${JSON.stringify(findClaims(s))}`);
for (const s of ['1 out of 4 people agree.', '9 out of 10 dentists agree.', '1 out of 4 is a rate.'])
  ok(!findClaims(s).some(c => c.form), `"${s}" (a rate) was read: ${JSON.stringify(findClaims(s))}`);
for (const s of ['2 + 2 = 4k', '2 * 3 = 6M', '2 + 2 = 4 B', '2 + 2 = 4x', '2 + 2 = 4²', '2 + 2 = 4½', '2 + 2 = 4 ❌', '2 + 2 = 4 ✗'])
  ok(verdict(s)[0] !== 'PROVEN', `"${s}" came back PROVEN: ${JSON.stringify(findClaims(s))}`);
for (const s of ['2 + 2 = 4 m', '3 km is 3000 m.', "It's true that 2 + 2 = 4.", '2 + 2 = 4 ✓'])
  ok(verdict(s)[0] === 'PROVEN', `"${s}" is no longer PROVEN: ${JSON.stringify(findClaims(s))}`);
for (const s of ['2^31 - 5 = 2147483647 is prime', '2 + 3 = 5 and 3 + 4 = 9.', '6 * 7 = 42, and 42 / 6 = 8.'])
  ok(verdict(s)[0] !== 'PROVEN' && verdict(s).includes('FALSIFIED'), `"${s}" shows ${verdict(s)}: its first line PROVEN over a false part`);
ok(verdict('2 + 3 = 5 and 3 + 4 = 7.').join() === 'PROVEN,PROVEN', `"2 + 3 = 5 and 3 + 4 = 7." is ${verdict('2 + 3 = 5 and 3 + 4 = 7.')}`);
ok(!verdict('2^31 - 1 = 2147483647, which is prime').includes('FALSIFIED') && verdict('2 + 2 = 4 is prime').includes('FALSIFIED'), 'a prime claim after a sum changed');
console.log(fails.length ? `FAIL ${fails.length} of ${checks}\n  ${fails.join('\n  ')}` : `PASS ${checks} checks`);
process.exit(fails.length ? 1 : 0);
