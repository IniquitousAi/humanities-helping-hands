import { REPO, tasks, pick, issueUrl, contributors } from '../help.js';

const $ = id => document.getElementById(id);
const get = url => fetch(url, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
const lib = get('/facts.json'), asked = get('/api/asked');

lib.then(d => {
  const people = contributors(d?.facts || []);
  if (!people.length) return;
  $('people').replaceChildren(...people.map(p => {
    const r = document.createElement('div'), a = document.createElement('a'), s = document.createElement('small');
    r.className = 'row'; a.href = `${REPO}/pulls?q=author%3A${p.handle}`; a.rel = 'noopener'; a.target = '_blank'; a.textContent = `@${p.handle}`;
    s.textContent = `${p.count} accepted ${p.count === 1 ? 'proof' : 'proofs'}`;
    r.append(a, s); return r;
  }));
});

$('task-go').onclick = async () => {
  const [d, q] = await Promise.all([lib, asked]);
  const t = pick(tasks(d?.facts || [], q?.questions || []));
  if (!t) { $('task-status').textContent = 'The task list did not load. Try the button again.'; return; }
  $('task-kind').textContent = t.kind; $('task-title').textContent = t.title; $('task-body').textContent = t.body;
  $('task-issue').href = issueUrl(t); $('task').hidden = false; $('task-status').textContent = '';
  $('task-go').firstChild.textContent = 'Give me another';
};
