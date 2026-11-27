import { check, view } from './real-check.js';
const SUMS = ['2 + 2 = 4', '3 + 3 = 7', '5 + 5 = 10', '10 - 3 = 6', '4 x 2 = 8', 'Nine plus one is ten', '6 + 2 = 9', '7 + 7 = 14'];
const makes = r => (r.why.match(/it comes to (.+?), not /) || [])[1];
const yes = r => { const v = view(r); return v.label === 'PROVEN' && v.holds !== 'false'; };
const key = document.getElementById('k-key');
let asked = false;
const showKey = (el, k) => {
  if (!key || (el.id !== 'k-mine' && asked)) return;
  if (el.id === 'k-mine') asked = true;
  for (const b of key.querySelectorAll('[data-key]')) b.hidden = b.dataset.key !== k;
};
const left = f => String(f || '').split(/\s*(?:~?=|<=|>=|!=|<|>|≤|≥|≠)\s*/)[0].replace(/\s*\*\s*/g, ' × ').trim();
const sum = f => String(f || '').replace(/\s*\*\s*/g, ' × ').replace(/\s*\/\s*/g, ' ÷ ').trim();
const part = r => r.kind === 'part', bang = r => /could be a factorial/.test(r.why || '');
const say = (el, rs) => {
  const mine = el.id === 'k-mine' ? ' k-mine' : '', all = rs.length > 1, bad = rs.find(r => r.label === 'FALSIFIED');
  if (bad) {
    el.className = 'k-answer proven' + mine;
    el.textContent = !all ? (makes(bad) ? `No, not true! It makes ${makes(bad)}.` : 'No, not true!')
      : makes(bad) && left(bad.form) ? `Not all true! ${left(bad.form)} makes ${makes(bad)}.` : 'Not all true!';
    showKey(el, 'no');
    return;
  }
  if (rs.every(r => yes(r) || part(r))) {
    const only = rs.some(part) ? ' The robot only checks the math.' : '';
    el.className = 'k-answer proven' + mine;
    el.textContent = (all ? 'Yes, all true!' : only ? `Yes, ${sum(rs[0].form)} is true!` : 'Yes, true!') + only;
    showKey(el, 'yes');
    return;
  }
  if (rs.every(r => yes(r) || part(r) || view(r).label === 'REASONED')) {
    el.className = 'k-answer reasoned' + mine;
    el.textContent = 'Experts say so! The robot only checked the numbers in it.';
    showKey(el, 'reasoned');
    return;
  }
  el.className = 'k-answer guess' + mine;
  showKey(el, 'guess');
  el.textContent = rs.some(bang) ? `The robot isn't sure what the ! means. Try your ${all ? 'sums' : 'sum'} without it.`
    : `The robot can't check ${all ? 'all of that' : 'that one'} yet. That does not mean it is wrong.`;
};
const wait = ms => new Promise(r => setTimeout(r, ms));
const q = document.getElementById('k-q'), mine = document.getElementById('k-mine');

const robot = document.querySelector('[data-machine="kids"]');
const claim = robot.querySelector('[data-k="claim"]'), answer = robot.querySelector('[data-k="answer"]');
const unloaded = (el, then) => { el.className = 'k-answer plain' + (el.id === 'k-mine' ? ' k-mine' : ''); el.textContent = `The robot did not load. ${then}`; };
(async () => {
  for (const s of SUMS) {
    while (document.hidden || document.activeElement === q) await wait(400);
    claim.textContent = s; answer.className = 'k-answer wait'; answer.textContent = 'Checking…';
    await wait(1400);
    let rs;
    try { rs = await check(s); } catch { unloaded(answer, 'Reload the page to try again.'); return; }
    say(answer, rs);
    await wait(2600);
  }
})();

document.getElementById('k-ask').addEventListener('submit', async e => {
  e.preventDefault();
  if (!q.value.trim()) { mine.className = 'k-answer wait k-mine'; mine.textContent = 'Type a sum first, like 7 + 5 = 12.'; q.focus(); return; }
  if ([...q.value].length > 300) { mine.className = 'k-answer plain k-mine'; mine.textContent = 'That is too long for the robot. Try a short sum.'; return; }
  mine.className = 'k-answer wait k-mine'; mine.textContent = 'Checking…';
  const asked = q.value;
  let rs;
  try { rs = await check(asked); } catch { if (asked === q.value) unloaded(mine, 'Press CHECK to try again.'); return; }
  if (asked !== q.value) return;
  say(mine, rs.length ? rs : [{ label: 'NOT CHECKED', why: '' }]);
});
