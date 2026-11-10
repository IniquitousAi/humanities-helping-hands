import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { run } from '../landing/checker.js';

const here = path.dirname(fileURLToPath(import.meta.url)), src = fs.readFileSync(path.resolve(here, '../landing/finder.js'), 'utf8');
const CASES = [['1-4 is -3', 'PROVEN'], ['1 - 4 = -3', 'PROVEN'], ['-3 = 1-4', 'PROVEN'], ['10-15 is -5', 'PROVEN'], ['1-4 is 3', 'FALSIFIED'],
  ['2 * -3 = -6', 'PROVEN'], ['2^31 - 1 = 2,147,483,647 is prime.', 'PROVEN']];
const load = code => import('data:text/javascript;base64,' + Buffer.from(code.replace(/from '\.\/([\w.]+)'/g,
  (m, f) => `from '${pathToFileURL(path.resolve(here, '../landing', f)).href}'`)).toString('base64'));
const misses = finder => CASES.flatMap(([text, want]) => {
  const c = finder.findClaims(text)[0] || { said: text, form: null }, got = run(c.form, c.said)[0];
  return got === want ? [] : [`${text}: ${got} (want ${want}, read as ${c.form})`];
});

const bad = misses(await load(src));
for (const [text, want] of CASES) console.log(`${want.padEnd(9)} ${text}`);
const PLANTS = [['leading minus taken out', s => s.replace('(?:(?<![\\d.)])-\\s*)?', '')],
                ['"is" taken out', s => s.replace('|\\bis\\b|\\bequals\\b', '')]];
for (const [name, mutate] of PLANTS) {
  const code = mutate(src);
  if (code === src) { bad.push(`planted bug "${name}" no longer applies: update this test`); continue; }
  const caught = misses(await load(code));
  console.log(`planted: ${name}: ${caught.length ? `caught (${caught.length} wrong)` : 'NOT caught'}`);
  if (!caught.length) bad.push(`planted bug "${name}" was not caught`);
}
if (bad.length) { console.log('FAIL\n' + bad.join('\n')); process.exit(1); }
console.log(`PASS: ${CASES.length} of ${CASES.length} exact, ${PLANTS.length} of ${PLANTS.length} planted bugs caught`);
