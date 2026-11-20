import { check } from './real-check.js';
const SUMS = ['2 + 2 = 4', '3 + 3 = 7', '5 + 5 = 10', '10 - 3 = 6', '4 x 2 = 8', 'Nine plus one is ten', '6 + 2 = 9', '7 + 7 = 14'];
const makes = r => (r.why.match(/it comes to (.+?), not /) || [])[1];
const say = (el, r) => {
  const mine = el.id === 'k-mine' ? ' k-mine' : '';
  if (r.label === 'PROVEN') { el.className = 'k-answer proven' + mine; el.textContent = 'Yes, true!'; return; }
  if (r.label === 'FALSIFIED') { el.className = 'k-answer guess' + mine; el.textContent = makes(r) ? `No, not true! It makes ${makes(r)}.` : 'No, not true!'; return; }
  el.className = 'k-answer plain' + mine; el.textContent = 'The robot can\'t check that one yet. That does not mean it is wrong.';
};
const wait = ms => new Promise(r => setTimeout(r, ms));
const q = document.getElementById('k-q'), mine = document.getElementById('k-mine');

const robot = document.querySelector('[data-machine="kids"]');
const claim = robot.querySelector('[data-k="claim"]'), answer = robot.querySelector('[data-k="answer"]');
(async () => {
  for (const s of SUMS) {
    while (document.hidden || document.activeElement === q) await wait(400);
    claim.textContent = s; answer.className = 'k-answer wait'; answer.textContent = 'Checking…';
    await wait(1400);
    say(answer, (await check(s))[0]);
    await wait(2600);
  }
})();

document.getElementById('k-ask').addEventListener('submit', async e => {
  e.preventDefault();
  if (!q.value.trim()) { mine.className = 'k-answer wait k-mine'; mine.textContent = 'Type a sum first, like 7 + 5 = 12.'; q.focus(); return; }
  if ([...q.value].length > 300) { mine.className = 'k-answer plain k-mine'; mine.textContent = 'That is too long for the robot. Try a short sum.'; return; }
  mine.className = 'k-answer wait k-mine'; mine.textContent = 'Checking…';
  const asked = q.value, r = (await check(asked))[0];
  if (asked !== q.value) return;
  say(mine, r || { label: 'NOT CHECKED', why: '' });
});
