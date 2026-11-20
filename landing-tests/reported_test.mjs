import { readFileSync } from 'node:fs';
import { run } from '../landing/checker.js';
import { findClaims } from '../landing/finder.js';

const cases = JSON.parse(readFileSync(new URL('./reported.json', import.meta.url), 'utf8'));
let miss = 0;
for (const { issue, sentence, want } of cases) {
  const verdicts = findClaims(sentence).map(c => run(c.form)[0]);
  const got = verdicts.find(v => v !== 'GUESS') || 'GUESS';
  if (got !== want) { miss++; console.log(`MISS issue ${issue}: "${sentence}" wants ${want}, got ${got}`); }
}
console.log(JSON.stringify({ checks: cases.length, missed: miss }));
process.exit(miss ? 1 : 0);
