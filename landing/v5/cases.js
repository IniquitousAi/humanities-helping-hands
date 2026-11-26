const root = document.getElementById('cases-body');
const tabs = document.getElementById('cases-tabs');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CHIP = { PROVEN: 'proven', MEASURED: 'measured', REASONED: 'reasoned', GUESS: 'guess' };

function draw(c, anon) {
  const status = c.status === 'open' ? '<span class="case-status" title="Still being argued. A label can change when new facts come in.">Open case</span>' : '';
  const open = c.status === 'open' ? ' <b>Open case</b> means it is still being argued, so a label can change when new facts come in.' : '';
  root.innerHTML = `<div class="case-head"><h3 class="h3">${esc(c.title)}</h3>${status}</div><p class="case-sum">${esc(c.summary)}${open}</p>
    <div class="case-cols" aria-hidden="true"><span>What was said</span><span>How sure we can be, and why</span></div>
    <ol class="case-list">${c.entries.map(e => `<li class="panel case-row">
      <div class="case-said"><span class="case-who">${esc(anon ? e.who : (e.handle || e.who))} said</span><p>${esc(e.said)}</p></div>
      <div class="case-verdict"><span class="chip ${CHIP[e.label] || 'guess'}">${esc(e.label[0] + e.label.slice(1).toLowerCase())}</span>
        <p>${esc(e.why)}${e.source ? ` <span class="case-src">Source: ${e.sourceLink ? `<a href="${esc(e.sourceLink)}" rel="noopener noreferrer" target="_blank">${esc(e.source)}</a>` : esc(e.source)}.</span>` : ''}${e.link ? ` <a href="${esc(e.link)}">See the proof</a>` : ''}</p></div></li>`).join('')}</ol>
    ${c.takeaway ? `<p class="case-take"><b>The lesson:</b> ${esc(c.takeaway)}</p>` : ''}`;
}

fetch(new URL('cases.json', import.meta.url)).then(r => r.json()).then(d => {
  const anon = d.anonymizeHandles !== false;
  tabs.innerHTML = d.cases.map((c, i) => `<button role="tab" id="case-t-${esc(c.id)}" aria-controls="cases-body" aria-selected="${i === 0}" ${i ? 'tabindex="-1"' : ''}>${esc(c.tab)}</button>`).join('');
  const pick = i => {
    [...tabs.children].forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
    root.setAttribute('aria-labelledby', tabs.children[i].id);
    draw(d.cases[i], anon);
  };
  [...tabs.children].forEach((b, i) => b.addEventListener('click', () => pick(i)));
  tabs.addEventListener('keydown', e => {
    const i = [...tabs.children].findIndex(b => b.getAttribute('aria-selected') === 'true');
    const n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
    if (n === null) return;
    const k = (n + d.cases.length) % d.cases.length; pick(k); tabs.children[k].focus();
  });
  pick(0);
}).catch(() => { root.innerHTML = '<p class="muted">The examples could not load.</p>'; });
