export const PASSED = new Set(['PROVEN', 'MEASURED', 'CHECKED', 'SOURCED']);

export function sealState(done) {
  const need = done.filter(d => d.needsSeal !== false);
  const missing = need.filter(d => !PASSED.has(d.label)).map(d => ({ said: d.said, label: d.label }));
  return { full: need.length > 0 && missing.length === 0, missing };
}

export async function run(cards, on) {
  on({ step: 'split', cards: cards.map(c => c.said) });
  cards.forEach((c, i) => on({ step: 'check', i, said: c.said }));
  const done = await Promise.all(cards.map(async (c, i) => {
    const r = await c.result;
    on({ step: 'label', i, label: r.label, check: r.check, fix: r.fix });
    const rec = await c.receipt;
    on({ step: 'receipt', i, sha256: rec.sha256 });
    return { said: c.said, needsSeal: c.needsSeal, label: r.label };
  }));
  const seal = sealState(done);
  on({ step: 'seal', ...seal, passed: done.filter(d => d.needsSeal !== false && PASSED.has(d.label)).length });
  return seal;
}

export function sealWords(e) {
  if (e.full) return 'Sealed: every claim passed its check. Verify this seal.';
  if (!e.missing.length) return null;
  const list = e.missing.map(m => `"${m.said}" is ${m.label}`).join('; ');
  if (!e.passed) return `No seal: nothing here passed a check (${list}).`;
  return `Partial seal: ${e.missing.length} claim${e.missing.length === 1 ? '' : 's'} did not pass (${list}). Verify what passed.`;
}

const TAGS = { PROVEN: 'proven', MEASURED: 'measured', CHECKED: 'checked', SOURCED: 'checked', REASONED: 'reasoned', GUESS: 'guess', 'CHECK FAILED': 'falsified' };

export function play(box, cards) {
  box.replaceChildren(); box.hidden = false; box.className = 'stampflow';
  const list = document.createElement('ol'), seal = document.createElement('a');
  list.className = 'sf-cards'; seal.className = 'sf-seal'; seal.href = '/verify/'; seal.hidden = true;
  box.append(list, seal);
  const li = [];
  return run(cards, e => {
    if (e.step === 'split') e.cards.forEach(s => {
      const c = document.createElement('li'), said = document.createElement('span'), how = document.createElement('span');
      said.className = 'sf-said'; said.textContent = s; how.className = 'sf-how'; how.textContent = 'checking...';
      c.className = 'sf-card'; c.append(said, how); list.append(c); li.push(c);
    });
    if (e.step === 'label') {
      const c = li[e.i], tag = document.createElement('span');
      tag.className = 'tag ' + (TAGS[e.label] || 'guess'); tag.textContent = e.label;
      c.querySelector('.sf-how').textContent = e.check ? `checked by ${e.check}` : 'no checker settles this';
      c.prepend(tag); c.classList.add('sf-labeled');
      if (e.label === 'CHECK FAILED') {
        c.querySelector('.sf-said').classList.add('sf-struck');
        if (e.fix) { const f = document.createElement('span'); f.className = 'sf-fix'; f.textContent = e.fix; c.append(f); }
      }
    }
    if (e.step === 'receipt') {
      const r = document.createElement('code'); r.className = 'sf-receipt'; r.textContent = 'receipt ' + e.sha256.slice(0, 12); li[e.i].append(r);
    }
    const words = e.step === 'seal' && sealWords(e);
    if (words) {
      seal.hidden = false; seal.classList.add(e.full ? 'sf-full' : 'sf-partial');
      const mark = document.createElement('span'), say = document.createElement('span');
      mark.className = 'sf-wax'; mark.textContent = 'HHH';
      say.className = 'sf-say';
      say.textContent = words;
      seal.append(mark, say);
    }
  });
}
