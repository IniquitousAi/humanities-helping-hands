const LEVELS = ['kids', 'everyone', 'technical'], KEY = 'hhh-level', NAMES = { kids: 'Kids', everyone: 'Everyone', technical: 'Technical' };
const saved = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const save = v => { try { localStorage.setItem(KEY, v); } catch {} };

function pick() {
  const asked = new URLSearchParams(location.search).get('level');
  if (LEVELS.includes(asked)) { save(asked); return asked; }
  return LEVELS.includes(saved()) ? saved() : 'everyone';
}

function set(level) {
  document.documentElement.dataset.level = level;
  for (const b of document.querySelectorAll('.level-switch button')) b.setAttribute('aria-pressed', String(b.dataset.pick === level));
}

function build() {
  const fixed = document.querySelector('nav.site-nav .level-switch');
  if (fixed) { fixed.addEventListener('click', onPick); return; }
  const host = document.querySelector('header.mast') || document.querySelector('main') || document.body;
  const box = document.createElement('div');
  box.className = 'level-switch'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Reading level');
  const one = !document.querySelector('body [data-level]');
  box.innerHTML = '<p class="level-ask"><span data-level="kids">How do you want to read this?</span><span data-level="everyone">Reading level</span>'
    + '<span data-level="technical">Reading level</span></p><p class="level-keys">'
    + LEVELS.map(l => `<button type="button" data-pick="${l}" aria-pressed="false">${NAMES[l]}</button>`).join('') + '</p>'
    + '<p class="level-note">Same facts on every level. Only the words change.</p>'
    + (one ? '<p class="level-note">This page has one level for now.</p>' : '');
  host.appendChild(box);
  box.addEventListener('click', onPick);
}
function onPick(e) {
  const b = e.target.closest('button[data-pick]'); if (!b) return;
  save(b.dataset.pick); set(b.dataset.pick);
  const u = new URL(location.href); u.searchParams.set('level', b.dataset.pick); history.replaceState(null, '', u);
}

build(); set(pick());

const THEME = 'hhh-theme', dark = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (document.documentElement.dataset.theme || 'dark') === 'dark';
const showTheme = () => { for (const k of document.querySelectorAll('[data-theme-key]')) k.setAttribute('aria-pressed', String(isDark())); };
for (const k of document.querySelectorAll('[data-theme-key]')) k.addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME, next); } catch {}
  showTheme();
});
dark.addEventListener('change', showTheme);
showTheme();
