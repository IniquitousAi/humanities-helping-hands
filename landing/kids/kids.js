const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const rand = n => Math.floor(Math.random() * n), shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

function say(text, then) {
  const s = window.speechSynthesis;
  if (!s) { if (then) setTimeout(then, 1200); return; }
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85; u.pitch = 1.1;
  if (then) u.onend = () => setTimeout(then, 500);
  s.speak(u);
}

const SHAPES = {
  circle: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>',
  square: '<svg viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76"/></svg>',
  triangle: '<svg viewBox="0 0 100 100"><polygon points="50,8 92,88 8,88"/></svg>',
};
const PICTURES = {
  sun: '<svg viewBox="0 0 100 100"><g stroke="#d1006b" stroke-width="6" stroke-linecap="round"><line x1="50" y1="4" x2="50" y2="18"/><line x1="50" y1="82" x2="50" y2="96"/><line x1="4" y1="50" x2="18" y2="50"/><line x1="82" y1="50" x2="96" y2="50"/><line x1="17" y1="17" x2="27" y2="27"/><line x1="73" y1="73" x2="83" y2="83"/><line x1="17" y1="83" x2="27" y2="73"/><line x1="73" y1="27" x2="83" y2="17"/></g><circle cx="50" cy="50" r="24" fill="#d1006b"/></svg>',
  moon: '<svg viewBox="0 0 100 100"><path d="M64 8 A42 42 0 1 0 64 92 A50 50 0 0 1 64 8 Z" fill="#5b1fa8"/></svg>',
  ball: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#1c3fc4"/><path d="M14 40 Q50 58 86 40 M14 62 Q50 80 86 62" fill="none" stroke="#fbf6ea" stroke-width="6"/></svg>',
  tree: '<svg viewBox="0 0 100 100"><rect x="43" y="58" width="14" height="36" fill="#1d1a2e"/><circle cx="50" cy="40" r="32" fill="#00733f"/></svg>',
};
const LETTERS = [
  { glyph: 'S', sound: 'sss', word: 'sun' }, { glyph: 'M', sound: 'mmm', word: 'moon' },
  { glyph: 'B', sound: 'buh', word: 'ball' }, { glyph: 'T', sound: 'tuh', word: 'tree' },
];
const DOT_COLORS = ['#1c3fc4', '#d1006b', '#5b1fa8'];

function show(name) {
  $$('[data-kid]').forEach(el => { el.hidden = el.dataset.kid !== name; });
  if (name === 'hub') say('What do you want to play?');
  else ({ count, shapes, letters })[name]();
}
const backToHub = () => setTimeout(() => show('hub'), 900);

function count() {
  const n = 2 + rand(4), field = $('#countField'), answer = $('#countAnswer'), color = DOT_COLORS[rand(DOT_COLORS.length)];
  let done = 0;
  field.innerHTML = ''; answer.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const b = document.createElement('button');
    b.className = 'thing'; b.type = 'button'; b.setAttribute('aria-label', 'Count me');
    b.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="${color}"/></svg>`;
    b.onclick = () => {
      if (b.classList.contains('counted')) { say('You counted that one. Find one you have not touched.'); return; }
      b.classList.add('counted'); done++;
      answer.appendChild(document.createElement('i'));
      if (done < n) say(String(done));
      else say(`${done}. You found ${n}!`, backToHub);
    };
    field.appendChild(b);
  }
  say('Touch each one and we count together.');
}

function shapes() {
  const names = shuffle(Object.keys(SHAPES)), target = names[rand(3)];
  $('#shapeModel').innerHTML = SHAPES[target];
  const field = $('#shapeField');
  field.innerHTML = '';
  for (const name of names) {
    const b = document.createElement('button');
    b.className = 'choice'; b.type = 'button'; b.dataset.shape = name; b.setAttribute('aria-label', name);
    b.innerHTML = SHAPES[name];
    b.onclick = () => {
      if (name === target) { b.classList.add('right'); say(`Yes, that is a ${name}. They match.`, backToHub); return; }
      b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
      say(`That one is a ${name}. Find the ${target}.`);
      hint(field.querySelector(`[data-shape="${target}"]`));
    };
    field.appendChild(b);
  }
  say(`Find the ${target}.`);
}

function letters() {
  const pair = shuffle(LETTERS).slice(0, 2), it = pair[0], big = $('#letterBig'), field = $('#letterField');
  big.textContent = it.glyph;
  const ask = () => say(`${it.glyph} says ${it.sound}, like ${it.word}. Which one starts with ${it.sound}?`);
  big.onclick = ask;
  field.innerHTML = '';
  for (const p of shuffle(pair)) {
    const b = document.createElement('button');
    b.className = 'choice'; b.type = 'button'; b.dataset.word = p.word; b.setAttribute('aria-label', p.word);
    b.innerHTML = PICTURES[p.word];
    b.onclick = () => {
      if (p === it) { b.classList.add('right'); say(`${it.word}. ${it.word} starts with ${it.sound}.`, backToHub); return; }
      b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
      say(`That is a ${p.word}. ${p.word} starts with ${p.sound}. Which one starts with ${it.sound}?`);
      hint(field.querySelector(`[data-word="${it.word}"]`));
    };
    field.appendChild(b);
  }
  ask();
}

function hint(el) { if (!el) return; el.classList.remove('hint'); void el.offsetWidth; el.classList.add('hint'); }

function start() {
  say('');
  $('#parent').hidden = true; $('#kid').hidden = false;
  try { document.documentElement.requestFullscreen?.().catch(() => {}); } catch {}
  show('hub');
}
function stop() {
  window.speechSynthesis?.cancel();
  $('#kid').hidden = true; $('#parent').hidden = false;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
function holdToLeave(btn) {
  let timer = 0;
  const cancel = () => { clearTimeout(timer); btn.classList.remove('holding'); };
  btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.classList.add('holding'); timer = setTimeout(() => { cancel(); stop(); }, 2000); });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, cancel);
  btn.addEventListener('contextmenu', e => e.preventDefault());
}

$('#go').onclick = start;
holdToLeave($('#leave'));
$$('[data-go]').forEach(b => { b.onclick = () => show(b.dataset.go); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
