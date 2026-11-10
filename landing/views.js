const VIEWS = ['a', 'b', 'c'], KEY = 'hhh-view', QUIET_MS = 90;

export function segments(rows) {
  const out = [];
  for (const r of rows) {
    const prev = out[out.length - 1];
    if (prev && r.text !== prev.text && prev.text.includes(r.text)) prev.chips.push(r);
    else out.push({ text: r.text, struck: r.struck, chips: [r] });
  }
  return out;
}

export function pick(v) { return VIEWS.includes(v) ? v : 'c'; }

if (typeof document !== 'undefined') init();

function init() {
  const box = document.getElementById('check'), results = document.getElementById('results');
  if (!box || !results) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const group = document.createElement('div');
  group.className = 'viewbox'; group.id = 'viewbox'; group.hidden = true;
  group.innerHTML =
    '<div class="viewbar"><div class="viewkeys" role="radiogroup" aria-label="How to show the labels">' +
    '<button type="button" role="radio" class="vk" data-v="a">In your text</button>' +
    '<button type="button" role="radio" class="vk" data-v="b">Side by side</button>' +
    '<button type="button" role="radio" class="vk" data-v="c">One per line</button></div>' +
    '<button type="button" class="receipts-key" id="receipts-key" aria-controls="results" aria-expanded="false"></button></div>' +
    '<p class="inline-view" id="inline-view"></p>';
  results.before(group);
  const keys = [...group.querySelectorAll('.vk')], inline = group.querySelector('.inline-view'), rkey = group.querySelector('.receipts-key');

  let view = 'c', wasShown = null, anim = null, timer = 0, last = 0, peekTimer = 0, rows = [];

  function stored() { try { return localStorage.getItem(KEY); } catch { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch { /* private window: the choice just lasts this visit */ } }

  function set(v, { save = true, focus = false } = {}) {
    v = pick(v);
    if (v === view && box.dataset.view === v) { if (focus) keys.find((k) => k.dataset.v === v)?.focus(); return; }
    view = v; box.dataset.view = v;
    for (const k of keys) { const on = k.dataset.v === v; k.setAttribute('aria-checked', on ? 'true' : 'false'); k.tabIndex = on ? 0 : -1; }
    if (save) store(v);
    if (v !== 'c') build();
    show();
    if (focus) keys.find((k) => k.dataset.v === v)?.focus();
  }

  function show() {
    const now = view === 'c' ? results : inline;
    if (anim) { anim.cancel(); anim = null; }
    if (reduce.matches || !now.animate || !now.isConnected || wasShown === null) { wasShown = view; return; }
    wasShown = view;
    anim = now.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.7,.2,1)' });
    anim.onfinish = anim.oncancel = () => { anim = null; };
  }

  function readRows() {
    return [...results.children].map((li) => {
      const tag = li.querySelector('.tag'), said = li.querySelector('.said');
      return { li, text: (said?.textContent || '').trim(), tag: tag?.textContent || '', cls: tag?.className || 'tag guess', 'grade': tag ? tag.dataset.grade || '' : 'not weighed', title: tag?.title || '', struck: said?.tagName === 'S' };
    }).filter((r) => r.text);
  }

  function build() {
    rows = readRows();
    const segs = segments(rows), frag = document.createDocumentFragment();
    for (const s of segs) {
      const seg = document.createElement('span'); seg.className = 'seg' + (s.struck ? ' struck' : '');
      seg.append(document.createTextNode(s.text + ' '));
      for (const c of s.chips) {
        const b = document.createElement('button'); b.type = 'button';
        b.className = c.cls.replace(/\btag\b/, 'tag chipbtn'); b.textContent = c.tag; b.title = c.title ? c.title + ' (click to see the receipt)' : 'click to see the receipt';
        if (c.grade) b.dataset.grade = c.grade;
        b._li = c.li; seg.append(b, document.createTextNode(' '));
      }
      frag.append(seg);
    }
    inline.replaceChildren(frag);
    rkey.textContent = box.dataset.receipts ? 'Hide the receipts' : `Show the receipts (${rows.length})`;
    rkey.setAttribute('aria-expanded', box.dataset.receipts ? 'true' : 'false');
  }

  function sync() {
    const has = results.children.length > 0;
    group.hidden = !has;
    if (has) box.dataset.has = '1'; else { delete box.dataset.has; delete box.dataset.receipts; inline.replaceChildren(); }
    if (!has || view === 'c') return;
    const wait = QUIET_MS - (performance.now() - last);
    clearTimeout(timer);
    timer = setTimeout(() => requestAnimationFrame(() => { last = performance.now(); build(); }), Math.max(0, wait));
  }
  new MutationObserver(sync).observe(results, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'data-grade'] });

  keys.forEach((k) => {
    k.addEventListener('click', () => set(k.dataset.v));
    k.addEventListener('keydown', (e) => {
      const live = keys.filter((x) => x.offsetParent !== null), i = live.indexOf(k);
      const to = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? live[(i + 1) % live.length] : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? live[(i - 1 + live.length) % live.length]
        : e.key === 'Home' ? live[0] : e.key === 'End' ? live[live.length - 1] : null;
      if (to) { e.preventDefault(); set(to.dataset.v, { focus: true }); }
    });
  });

  rkey.addEventListener('click', () => {
    if (box.dataset.receipts) delete box.dataset.receipts; else box.dataset.receipts = '1';
    build();
  });

  inline.addEventListener('click', (e) => {
    const b = e.target.closest?.('.chipbtn'); if (!b || !b._li) return;
    box.dataset.receipts = '1'; build();
    const li = b._li; li.classList.add('peek');
    clearTimeout(peekTimer); peekTimer = setTimeout(() => results.querySelectorAll('.peek').forEach((x) => x.classList.remove('peek')), 1600);
    li.scrollIntoView({ block: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
  });

  const start = pick(new URLSearchParams(location.search).get('view') || stored());
  set(start, { save: false });
  sync();
  window.hhhViews = { set, get: () => view };
}
