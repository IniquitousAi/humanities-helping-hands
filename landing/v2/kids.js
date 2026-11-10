import { checkPublic } from '/public_check.js';
const SUMS = ['2 + 2 = 4', '3 + 3 = 7', '5 + 5 = 10', '10 - 3 = 6', '4 x 2 = 8', '9 + 1 = 10', '6 + 2 = 9', '7 + 7 = 14'];
const WORDS = { PROVEN: ['proven', 'Yes, true!'], FALSIFIED: ['guess', 'No, not true!'] };
const say = (el, r) => { const [c, w] = WORDS[r.label] || ['plain', 'The robot can\'t check that one yet. That does not mean it is wrong.']; el.className = `k-answer ${c}${el.id === 'k-mine' ? ' k-mine' : ''}`; el.textContent = w; };
const wait = ms => new Promise(r => setTimeout(r, ms));

const robot = document.querySelector('[data-machine="kids"]');
const claim = robot.querySelector('[data-k="claim"]'), answer = robot.querySelector('[data-k="answer"]');
(async () => {
  for (let i = 0; ; i++) {
    while (document.hidden) await wait(500);
    const s = SUMS[i % SUMS.length];
    claim.textContent = s; answer.className = 'k-answer wait'; answer.textContent = 'Checking…';
    await wait(1400);
    say(answer, await checkPublic(s, [], 'kids'));
    await wait(2600);
  }
})();

const mine = document.getElementById('k-mine'), q = document.getElementById('k-q');
document.getElementById('k-ask').addEventListener('submit', async e => {
  e.preventDefault();
  if (!q.value.trim()) { mine.className = 'k-answer wait k-mine'; mine.textContent = 'Type a sum first, like 7 + 5 = 12.'; q.focus(); return; }
  mine.className = 'k-answer wait k-mine'; mine.textContent = 'Checking…';
  const asked = q.value, r = await checkPublic(asked, [], 'kids');
  if (asked !== q.value) return;
  if (r.error) { mine.className = 'k-answer plain k-mine'; mine.textContent = 'That is too long for the robot. Try a short sum.'; return; }
  say(mine, r);
});
