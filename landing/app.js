import { findClaims, whole } from './finder.js';
import { mathAnswer } from './answer.js';
import { guessGrade } from './grade.js';
import { run, PROVEN, FALSIFIED } from './checker.js';
import { lookUp } from './wiki.js';
import { findNames, checkNames, REGISTRY } from './names.js';
import { receipt } from './receipt.js';
import { MAX_TEXT, builtinReady, splitBuiltin, splitOwn, PROVIDERS } from './ai.js';
import { traceFor } from './trace.js';
import { askButton } from './ask_open.js';
import { libraryCounts } from './library_counts.js';
import { factsOnce } from '/facts-once.js';
import { checkFood, looksFood } from './food.js';
import { checkKeeper, looksKeeper } from './keeper.js';
import { medlineLink } from './medline.js';
import { play } from './stampflow.js';

const $ = id => document.getElementById(id);
const EXAMPLE = 'Most adults need about 3.7 liters of water a day, which is roughly 15 cups. 2^31 - 1 = 2,147,483,647 is prime. '
  + 'Water boils at 100 °C, which is 212 °F. Mount Everest is 8,848.86 meters (29,031.7 feet) tall. 2^100 > 10^30. '
  + 'Drinking water is good for your skin.';
const TAG = { PROVEN: ['proven', 'PROVEN'], FALSIFIED: ['falsified', 'CHECK FAILED'], GUESS: ['guess', 'GUESS'], OPEN: ['guess', 'OPEN PROBLEM'] };
const TIP = { PROVEN: 'A machine check ran and held. It does not cover anything past that check.',
  FALSIFIED: 'The check did not match. It does not mean the rest of the answer is wrong.',
  CHECKED: 'A trusted source says the same thing, and its words are shown. Sources can be wrong, so never PROVEN.',
  REASONED: 'Sources were read and their words are shown, but they do not back the claim as written. It does not mean false.',
  GUESS: 'Not machine checked, and no source found so far. It does not mean false: the lookup on the row can check it.',
  OPEN: 'An unsolved problem: nobody has proved or disproved it. It does not mean true or false, and no lookup settles it.' };
const CHECK_NAME = { math: 'exact arithmetic', rounded: 'exact value, then the answer\'s rounding', defined: 'exact unit definitions',
  prime: 'exact prime test', none: 'no check', open: 'the open problems list', page: 'a web page lookup', wiki: 'a Wikipedia lookup', wikidata: 'a Wikidata lookup', event: 'a Wikidata lookup' };
const TRIED = 'exact arithmetic, exact unit definitions, rounding, the prime test, USDA\'s food table and USDA\'s FoodKeeper storage times; the Wikipedia lookup runs when you click it';

function tierNow() { return document.querySelector('input[name=tier]:checked').value; }
function showTier() {
  const t = tierNow(); $('own').hidden = t !== 'own'; $('builtin').hidden = t !== 'browser' || !$('builtin').dataset.ok;
}

function plainFix(check, why) {
  let m;
  if ((m = why.match(/^exact value (?:about )?([-\d.e+]+); the answer said (?:about )?([-\d.e+]+),/))) return `The exact number is ${+(+m[1]).toPrecision(6)}, not about ${m[2]}.`;
  if ((m = why.match(/left is (.+), right is (.+)$/))) return `The two sides are ${m[1]} and ${m[2]}, so they do not match.`;
  if (check === 'prime') return why.charAt(0).toUpperCase() + why.slice(1) + '.';
  return 'The check failed: ' + why + '.';
}

function row(c) {
  let [verdict, check, why] = whole(c, run(c.form, c.said));
  if (c.maybe) {
    const [v] = run(c.maybe.form);
    why = `"${c.maybe.word}" is not a number word; if it means "${c.maybe.meant}", ${c.maybe.form} ${v === PROVEN ? 'holds' : v === FALSIFIED ? 'does not hold' : 'stays a guess'}`;
  }
  const li = document.createElement('li'), tag = document.createElement('span'), body = document.createElement('div');
  tag.className = 'tag ' + TAG[verdict][0]; tag.textContent = TAG[verdict][1]; tag.title = TIP[verdict];
  if (verdict === 'GUESS') tag.dataset.grade = guessGrade(why);
  const said = document.createElement(verdict === FALSIFIED ? 's' : 'span'); said.className = 'said'; said.textContent = c.said; body.append(said);
  if (verdict === FALSIFIED) { const f = document.createElement('span'); f.className = 'fix'; f.textContent = plainFix(check, why); body.append(f); }
  if (verdict === 'GUESS') { const w = document.createElement('span'); w.className = 'whyguess'; w.textContent = `(${why})`; body.append(w); }
  if (verdict === 'GUESS' && !c.maybe && !/^not a claim/.test(why)) body.append(findNames(c.said).length ? nameButton(c.said, li, tag, body) : wikiButton(c.said, li, tag, body));
  const d = document.createElement('details'), s = document.createElement('summary'), how = document.createElement('div');
  s.textContent = 'how this was checked'; how.className = 'how';
  if (verdict === 'GUESS') how.append(`Tried every checker on this page (${TRIED}). None of them settles this kind of claim by math, so it stays a guess; the line above says what settles it.`);
  else how.append(`${CHECK_NAME[check] || check}: ${why}.`);
  if (c.form) { how.append(document.createElement('br'), 'Checked form: '); const code = document.createElement('code'); code.textContent = c.form; how.append(code); }
  d.append(s, how); li.append(tag, body, d, shareRow(c.said, TAG[verdict][1]));
  const rec = addReceipt(how, c.said, verdict, c.form ? `${check}: ${c.form}` : check, why);
  if (verdict === 'GUESS' && looksKeeper(c.said)) keeperCheck(c.said, li, tag, body);
  else if (verdict === 'GUESS' && looksFood(c.said)) foodCheck(c.said, li, tag, body);
  else if (verdict === 'GUESS' && /^health/.test(why)) body.append(medlineLink(c.said));
  const card = { said: c.said, needsSeal: !/^(not a claim|a question, not a claim)/.test(why), receipt: rec,
    result: Promise.resolve({ label: TAG[verdict][1], check: check === 'none' ? '' : CHECK_NAME[check] || check, fix: verdict === FALSIFIED ? plainFix(check, why) : '' }) };
  return { li, verdict, card };
}

export const resultLink = said => `${location.origin}/?c=${encodeURIComponent(said.slice(0, 280))}#check`;
function shareRow(said, label) {
  const p = document.createElement('p'), copy = document.createElement('button'), x = document.createElement('a'), url = resultLink(said);
  p.className = 'share';
  copy.type = 'button'; copy.textContent = 'Copy link';
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(url); copy.textContent = 'Link copied'; } catch { prompt('Copy this link:', url); }
  });
  x.textContent = 'Post on X'; x.target = '_blank'; x.rel = 'noopener';
  x.href = 'https://x.com/intent/post?' + new URLSearchParams({ text: `"${said.slice(0, 180)}" checked: ${label}. Check any AI answer yourself:`, url });
  p.append(copy, x); return p;
}

function reasoned(tag) { tag.className = 'tag reasoned'; tag.textContent = 'REASONED'; tag.title = TIP.REASONED; delete tag.dataset.grade; }

let foodData;
async function foodCheck(said, li, tag, body) {
  try {
    foodData ||= fetch('food.json').then(r => r.ok ? r.json() : null);
    const r = checkFood(said, await foodData); if (!r) return;
    body.querySelector('.whyguess')?.remove(); body.querySelector('.lookup-box')?.remove();
    const out = document.createElement('div'), head = document.createElement('span'), line = document.createElement('span'), a = document.createElement('a');
    if (r.verdict === 'CHECKED') {
      tag.className = 'tag checked'; tag.textContent = 'CHECKED'; tag.title = TIP.CHECKED; delete tag.dataset.grade;
      const how = li.querySelector('.how');
      if (how) addReceipt(how, said, 'CHECKED', `food: USDA FoodData Central ${r.food.id} "${r.food.name}", ${r.basis}`, r.why);
    } else reasoned(tag);
    head.className = r.verdict === 'CHECKED' ? 'source-head' : 'whyguess';
    head.textContent = r.verdict === 'CHECKED' ? `(${r.why}. A lab table is a source, and one food is not every food, so never PROVEN)` : `(${r.why}. Read the source below; this never means false)`;
    line.className = 'source ' + (r.verdict === 'CHECKED' ? 'supports' : 'opposes');
    a.href = r.food.url; a.rel = 'noopener'; a.target = '_blank'; a.textContent = `USDA FoodData Central, "${r.food.name}" (food ${r.food.id})`;
    line.append(a); out.append(head, line); body.append(out);
    tally();
  } catch { /* (no table: the row stays the guess it already explains) */ }
}

let keeperData;
async function keeperCheck(said, li, tag, body) {
  try {
    keeperData ||= fetch('keeper.json').then(r => r.ok ? r.json() : null);
    const d = await keeperData, r = checkKeeper(said, d); if (!r) return;
    body.querySelector('.whyguess')?.remove(); body.querySelector('.lookup-box')?.remove();
    const out = document.createElement('div'), head = document.createElement('span'), line = document.createElement('span'), a = document.createElement('a');
    if (r.verdict === 'CHECKED') {
      tag.className = 'tag checked'; tag.textContent = 'CHECKED'; tag.title = TIP.CHECKED; delete tag.dataset.grade;
      const how = li.querySelector('.how');
      if (how) addReceipt(how, said, 'CHECKED', `storage: USDA FSIS FoodKeeper product ${r.product.id} "${r.product.name}", ${r.usda} (${r.place})`, r.why);
    } else reasoned(tag);
    head.className = r.verdict === 'CHECKED' ? 'source-head' : 'whyguess';
    head.textContent = r.verdict === 'CHECKED' ? `(${r.why}. A food safety guideline is a source, not a law of nature, so never PROVEN)` : `(${r.why}. Read the source below; this never means false)`;
    line.className = 'source ' + (r.verdict === 'CHECKED' ? 'supports' : 'opposes');
    a.href = d.url; a.rel = 'noopener'; a.target = '_blank'; a.textContent = `USDA FSIS FoodKeeper, "${r.product.name}" (product ${r.product.id})`;
    line.append(a); out.append(head, line); body.append(out);
    tally();
  } catch { /* (no table: the row stays the guess it already explains) */ }
}

const runId = () => new Date().toISOString().slice(0, 19);
async function addReceipt(how, claim, label, check, evidence) {
  const r = await receipt(claim, label, check, runId(), evidence), line = document.createElement('span'), code = document.createElement('code');
  how.querySelector('.receipt')?.remove();
  line.className = 'receipt'; code.textContent = r.sha256.slice(0, 12); code.title = JSON.stringify(r);
  line.append(document.createElement('br'), 'Receipt: ', code, ' (claim, label, check, time, evidence and credit, hashed the same way on every checker)',
    document.createElement('br'), r.credit);
  how.append(line);
  return r;
}

const getRegistry = async url => { const r = await fetch(url); return { status: r.status, json: r.ok ? await r.json() : null }; };
function nameButton(said, li, tag, body) {
  const b = document.createElement('button'), note = document.createElement('span'), found = findNames(said);
  const where = [...new Set(found.map(n => REGISTRY[n.registry]))].join(' and '), LABEL = `Check the package name on ${where}`;
  b.type = 'button'; b.className = 'lookup'; b.textContent = LABEL;
  note.className = 'lookup-note'; note.textContent = `(sends only ${found.map(n => `"${n.name}"`).join(', ')} to ${where})`;
  const box = document.createElement('div'); box.className = 'lookup-box'; box.append(b, note);
  b.addEventListener('click', async () => {
    b.disabled = true; b.textContent = 'Checking the name...';
    try {
      const r = await checkNames(said, getRegistry), out = document.createElement('div');
      body.querySelector('.whyguess')?.remove();
      if (r.verdict !== 'CHECKED' && (r.sources || r.names || []).length) reasoned(tag);
      if (r.verdict === 'CHECKED') {
        tag.className = 'tag checked'; tag.textContent = 'CHECKED'; tag.title = TIP.CHECKED; delete tag.dataset.grade;
        const how = li.querySelector('.how');
        if (how) addReceipt(how, said, 'CHECKED', `names: ${r.names.map(n => `${n.registry} ${n.name}`).join(', ')}`, r.names.map(n => `${n.name} ${n.version}`).join(', '));
      }
      const head = document.createElement('span'); head.className = r.verdict === 'CHECKED' ? 'source-head' : 'whyguess';
      head.textContent = `(${r.why}${r.verdict === 'CHECKED' ? '; a listed package can still be the wrong one, so never PROVEN' : ''})`;
      out.append(head);
      for (const n of r.names.filter(n => n.found)) {
        const line = document.createElement('span'), a = document.createElement('a');
        line.className = 'source supports'; a.href = n.url; a.rel = 'noopener'; a.target = '_blank'; a.textContent = `${REGISTRY[n.registry]}, "${n.name}"`;
        line.append(a, ` lists it${n.version ? `, newest version ${n.version}` : ''}`); out.append(line);
      }
      box.replaceWith(out);
    } catch (e) { b.disabled = false; b.textContent = LABEL; note.textContent = `(${e.message || 'the check failed'}; click to try again)`; }
    tally();
  });
  return box;
}

const getJSON = async url => { const r = await fetch(url); if (!r.ok) throw new Error('Wikipedia did not answer'); return r.json(); };
function wikiButton(said, li, tag, body) {
  const b = document.createElement('button'), note = document.createElement('span');
  const LABEL = 'Look it up in Wikipedia and Grokipedia';
  b.type = 'button'; b.className = 'lookup'; b.textContent = LABEL;
  note.className = 'lookup-note'; note.textContent = '(sends this one sentence to Wikipedia, and the article names to Grokipedia)';
  const box = document.createElement('div'); box.className = 'lookup-box'; box.append(b, note);
  b.addEventListener('click', async () => {
    b.disabled = true; b.textContent = 'Looking it up...';
    try {
      const r = await lookUp(said, getJSON), out = document.createElement('div');
      body.querySelector('.whyguess')?.remove();
      if (r.verdict !== 'CHECKED' && (r.sources || r.names || []).length) reasoned(tag);
      if (r.verdict === 'CHECKED') {
        tag.className = 'tag checked'; tag.textContent = 'CHECKED'; tag.title = TIP.CHECKED; delete tag.dataset.grade;
        const how = li.querySelector('.how'), s0 = r.sources[0];
        if (how) addReceipt(how, said, 'CHECKED', `wiki: ${s0.name} "${s0.title}" ${s0.url || ''} read ${new Date().toISOString().slice(0, 10)}`.replace(/\s+/g, ' '), s0.sentence);
      }
      const head = document.createElement('span'); head.className = r.verdict === 'CHECKED' ? 'source-head' : 'whyguess';
      head.textContent = r.verdict === 'CHECKED' ? `(${r.why}: the sentence below holds every main word and number of the claim, in nearly the same order. It does not mean the claim is true: an encyclopedia can be wrong, so never PROVEN)`
        : r.sources.length ? `(${r.why})` : `(not found${r.tried.length ? ' on ' + r.tried.map(t => `"${t}"`).join(', ') : ''}; still a guess, which never means false)`;
      out.append(head);
      for (const s of r.sources) {
        const line = document.createElement('span'), a = document.createElement('a'), q = document.createElement('q');
        line.className = 'source ' + s.stance; a.href = s.url; a.rel = 'noopener'; a.target = '_blank'; a.textContent = `${s.name}, "${s.title}"`;
        q.textContent = s.sentence; line.append(a, s.stance === 'supports' ? ' says: ' : ' says otherwise: ', q); out.append(line);
      }
      box.replaceWith(out);
    } catch (e) { b.disabled = false; b.textContent = LABEL; note.textContent = `(${e.message || 'the lookup failed'}; click to try again)`; }
    tally();
  });
  return box;
}
function tally() {
  const tags = [...$('results').querySelectorAll('.tag')].map(t => t.textContent), n = k => tags.filter(t => t === k).length;
  const parts = [`<b>${tags.length}</b> claim${tags.length === 1 ? '' : 's'}`, `${n('PROVEN')} proven`];
  if (n('CHECKED')) parts.push(`${n('CHECKED')} checked by a source`);
  if (n('REASONED')) parts.push(`${n('REASONED')} reasoned`);
  parts.push(`${n('CHECK FAILED')} failed the check`, `${n('GUESS')} still a guess`);
  $('status').innerHTML = parts.join(', ') + '.';
}

async function check() {
  const text = $('answer').value.trim().slice(0, MAX_TEXT), tier = tierNow();
  $('results').innerHTML = ''; $('stamp').hidden = true;
  if (!text) { $('status').textContent = 'Type a claim or a question first, or click one of the examples.'; return; }
  $('go').disabled = true;
  $('padlock').hidden = true;
  try {
    let claims;
    if (tier === 'own') {
      const key = $('key').value.trim(); if (!key) throw new Error('paste your key first');
      $('status').textContent = 'Your AI is finding the claims...';
      claims = await splitOwn(text, $('provider').value, key, $('model').value.trim());
    } else if ($('use-builtin').checked) {
      $('status').textContent = "Chrome's built-in AI is finding the claims...";
      claims = await splitBuiltin(text, p => { $('status').textContent = `Chrome is downloading its AI model: ${Math.round(100 * p)}%`; });
    } else claims = findClaims(mathAnswer(text) || text);
    const rows = claims.map(row);
    for (const r of rows) $('results').append(r.li);
    tally();
    if (claims.more) $('status').append(` Only the first ${claims.length} claims were checked. Paste the rest to check them too.`);
    if (rows.length) play($('stamp'), rows.map(r => r.card)).catch(() => { $('stamp').hidden = true; });
    fetch('/hit?event=check', { method: 'POST' }).catch(() => {});
    const found = await traceFor(text);
    if (found && rows.every(r => r.verdict === 'GUESS')) {
      $('results').innerHTML = ''; $('stamp').hidden = true;
      $('status').innerHTML = `<b>${found}</b> proven fact${found === 1 ? '' : 's'} in the library for this. Click one to see how it was proven.`;
    }
    const settled = rows.length > 0 && rows.every(r => r.verdict !== 'GUESS');
    if (settled && !found) $('trace-none').hidden = true;
    $('ask-open').replaceChildren(...(found || settled ? [] : [askButton(text)]));
  } catch (e) {
    $('status').textContent = 'Could not finish: ' + (e && e.message ? e.message : e) + '.';
  } finally { $('go').disabled = false; }
}

export function northStar(n) {
  const d = document.createElement('details'), s = document.createElement('summary'), p = document.createElement('div');
  d.className = 'north'; s.textContent = 'toward the north star'; p.className = 'north-body';
  const tag = document.createElement('span'); tag.className = 'mini ' + n.label.toLowerCase(); tag.textContent = n.label;
  p.append(n.does + ' Limit now: ' + n.limit + ' ', tag); d.append(s, p); return d;
}
async function labelFeatures() {
  let f = {};
  try { const r = await fetch('features.json', { cache: 'no-store' }); if (r.ok) f = (await r.json()).features || {}; } catch { /* unread: all unbuilt */ }
  for (const spot of document.querySelectorAll('.state[data-feature]')) {
    const s = f[spot.dataset.feature], built = s && s.status === 'BUILT';
    spot.className = 'state ' + (built ? 'built' : 'unbuilt');
    spot.textContent = built ? 'Built: proven to work and brick tested' : `Not fully built yet (${s && s.why ? s.why.split('; ').pop() : 'its label could not be read'})`;
    const baked = spot.nextElementSibling && spot.nextElementSibling.matches('details.north') ? spot.nextElementSibling : null; // feature_status.mjs bakes it in
    if (s && s.north) baked ? baked.replaceWith(northStar(s.north)) : spot.after(northStar(s.north)); else if (baked) baked.remove();
  }
}

async function showLibrary() {
  try {
    const { facts } = await factsOnce;
    for (const [k, v] of Object.entries(libraryCounts(facts))) $('fact-' + k).textContent = v;
    const last = facts.reduce((a, f) => (f.added || '') > a ? f.added : a, '');
    for (const f of facts.filter(f => (f.added || '') === last).slice(0, 3)) {
      const li = document.createElement('li'), tag = document.createElement('span'), said = document.createElement('span');
      const real = document.createElement('span'), cl = f.claim_label === 'OPEN' ? 'OPEN' : 'GUESS';
      tag.className = 'tag proven'; tag.textContent = cl === 'OPEN' ? 'Math: ARITHMETIC-CHECKED' : 'Math: PROVEN (Lean)'; real.className = 'tag ' + cl.toLowerCase(); real.textContent = 'Real-world claim: ' + cl;
      said.textContent = f.claim; const tags = document.createElement('span'); tags.className = 'tags2';
      tags.append(tag, real); li.className = 'tagged'; li.append(tags, said); $('newest').append(li);
    }
  } catch { $('newest').closest('section').querySelector('.newest-head').hidden = true; }
  try {
    const ix = await (await fetch('index.json')).json();
    if (ix.change_pct == null) return;
    const t = $('ticker'), name = document.createElement('span'), up = document.createElement('span'), why = document.createElement('span');
    name.className = 'name'; name.textContent = 'Humanity Index';
    up.className = 'up' + (ix.verdict.color ? ' ' + ix.verdict.color : '');
    up.textContent = `${ix.change_pct >= 0 ? '▲' : '▼'} ${Math.abs(ix.change_pct)}%`;
    const since = new Date(ix.since).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const g = ix.growth, rate = g ? ` Over the last ${Math.round(g.hours)} hours: ${g.facts_per_hour} new facts an hour, about ${g.cost_s_per_fact.toLocaleString('en-US')} machine seconds of checking per new fact.` : '';
    why.className = 'why'; why.textContent = `Proven facts since ${since}, measured from the library's own record.${rate}${ix.verdict.color ? ' Growth against the cost of a new fact: ' + ix.verdict.why + '.' : ''}`;
    t.append(name, up, why); t.hidden = false;
  } catch {}
  try {
    const u = await (await fetch('updated.json')).json();
    if (!u.every_check_passed) return;
    $('updated').textContent = `Updated ${new Date(u.at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}`;
    $('updated').hidden = false;
  } catch {}
}

addEventListener('DOMContentLoaded', async () => {
  labelFeatures(); showLibrary();
  document.querySelectorAll('input[name=tier]').forEach(r => r.addEventListener('change', showTier));
  $('provider').addEventListener('change', () => { $('model').value = PROVIDERS[$('provider').value].model; });
  $('model').value = PROVIDERS[$('provider').value].model;
  $('example').addEventListener('click', () => { $('answer').value = EXAMPLE; $('answer').dispatchEvent(new Event('input')); if (tierNow() === 'own') $('answer').focus(); else check(); });
  $('ask').addEventListener('submit', e => { e.preventDefault(); check(); });
  $('answer').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('ask').requestSubmit(); } });
  const grow = () => { const t = $('answer'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + t.offsetHeight - t.clientHeight, 320) + 'px'; };
  $('answer').addEventListener('input', grow); addEventListener('resize', grow);
  for (const b of document.querySelectorAll('[data-try]')) b.addEventListener('click', () => { $('answer').value = b.dataset.try; grow(); $('ask').requestSubmit(); });
  const shared = new URLSearchParams(location.search).get('c');
  if (shared) { $('answer').value = shared.slice(0, MAX_TEXT); grow(); check(); }
  if (await builtinReady()) { $('builtin').dataset.ok = '1'; showTier(); }
});
