import { REPO, tasks, pick, issueUrl } from '../help.js';

const $ = id => document.getElementById(id);
const get = url => fetch(url, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
const lib = get('/facts.json'), asked = get('/api/asked');
const el = (tag, text, cls) => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
const who = h => { const a = el('a', `@${h}`); a.href = `${REPO}/pulls?q=author%3A${h}`; a.rel = 'noopener'; a.target = '_blank'; return a; };

async function finder() {
  const d = await get('/api/founders');
  if (!d || !d.needs.length) return;
  $('needs').replaceChildren(...d.needs.map(n => {
    const r = el('div', '', 'row'); r.append(el('span', n.need));
    const s = el('small', n.matches.length ? 'Could help: ' : 'Open: no match so far');
    n.matches.forEach((h, i) => s.append(i ? ', ' : '', who(h)));
    r.append(s); return r;
  }));
  if (d.people.length) $('people').replaceChildren(...d.people.map(p => { const r = el('div', '', 'row'); r.append(who(p.handle), el('small', p.confirmed ? p.strength : `${p.strength} (name not yet confirmed)`)); return r; }));
}
finder();

const form = $('fc-form'), status = $('fc-status'), btn = form.querySelector('[type=submit]');
const DRAFT = 'hhh-fc-draft', FIELDS = ['strength', 'weakness', 'why', 'built', 'handle'], started = Date.now();
const store = { get: () => { try { return JSON.parse(localStorage.getItem(DRAFT)) || {}; } catch { return {}; } },
  set: v => { try { localStorage.setItem(DRAFT, JSON.stringify(v)); } catch { /* private mode: no draft */ } },
  clear: () => { try { localStorage.removeItem(DRAFT); } catch { /* nothing kept */ } } };
const draft = store.get();
for (const n of FIELDS) if (typeof draft[n] === 'string' && !form.elements[n].value) form.elements[n].value = draft[n];
if (draft.optin) form.elements.optin.checked = true;
if (FIELDS.some(n => draft[n])) status.textContent = 'Your answers from last time are back. Nothing was sent yet.';
const save = () => store.set({ ...store.get(), ...Object.fromEntries(FIELDS.map(n => [n, form.elements[n].value])), optin: form.elements.optin.checked });
form.addEventListener('input', save); form.addEventListener('change', save);
const key = () => { const d = store.get(); if (d.key) return d.key; const k = crypto.randomUUID().replace(/-/g, ''); store.set({ ...d, key: k }); return k; };

const sitekey = document.querySelector('meta[name=turnstile-sitekey]')?.content;
if (sitekey) {
  const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  s.onload = () => window.turnstile.render('#fc-turnstile', { sitekey }); s.async = true; document.head.append(s);
}

let busy = false;
const done = (msg) => { busy = false; btn.disabled = false; btn.removeAttribute('aria-busy'); status.textContent = msg; };
form.onsubmit = async e => {
  e.preventDefault();
  if (busy) return;
  busy = true; btn.disabled = true; btn.setAttribute('aria-busy', 'true'); save();
  const f = new FormData(form), [d, q] = await Promise.all([lib, asked]);
  const t = pick(tasks(d?.facts || [], q?.questions || []));
  if (!t) return done('The trial task did not load. Your answers are saved here. Send again.');
  status.textContent = 'Sending...';
  const body = { strength: f.get('strength'), weakness: f.get('weakness'), why: f.get('why'), built: f.get('built'), handle: f.get('handle'),
    optin: f.get('optin') === 'on', task: { kind: t.kind, title: t.title }, website: f.get('website') || '', started,
    ...(sitekey ? { 'cf-turnstile-response': f.get('cf-turnstile-response') || '' } : {}) };
  let r = null, a = {};
  try {
    r = await fetch('/api/founders', { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': key() }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    a = await r.json().catch(() => ({}));
  } catch (err) {
    return done(err && err.name === 'TimeoutError' ? 'No answer in 10 seconds. Your answers are saved here. Send again when you are ready.'
      : 'The connection dropped. Your answers are saved here. Send again when you are back online.');
  }
  if (!r.ok) { if (sitekey && window.turnstile) window.turnstile.reset('#fc-turnstile'); return done((a.error || 'It did not send.') + ' Your answers are saved here.'); }
  store.clear(); done(a.queued ? 'Sent. Today was busy, so yours is in the review line; your trial task is below.' : 'Sent. Your trial task is below: finish it and your work speaks for you.');
  $('fc-kind').textContent = t.kind; $('fc-title').textContent = t.title; $('fc-body').textContent = t.body;
  $('fc-issue').href = issueUrl(t); $('fc-task').hidden = false;
  finder();
};
