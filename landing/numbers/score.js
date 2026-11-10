import { SHOW, LABELS } from '../score_words.js';
import { getJSON, failed } from '../getjson.js';
const $ = id => document.getElementById(id);

async function start() {
  let b;
  try { b = await getJSON('/scoreboard.json', { shape: d => d?.now && Array.isArray(d.history) && d.rules }); }
  catch { const p = document.createElement('p'); $('score-note').after(p); failed(p, "Today's live numbers (the tiles show the last build's)", '/scoreboard.json', () => { p.remove(); start(); }); return; }
  const prev = b.history.length > 1 ? b.history.at(-2) : null;
  for (const [id, list] of [['score-grid', SHOW], ['label-grid', LABELS]]) {
    const grid = $(id); grid.replaceChildren();
    for (const [k, words] of list) {
      const cell = document.createElement('div'), n = document.createElement('b'), w = document.createElement('span'), d = document.createElement('small');
      cell.className = 'score-cell'; cell.title = b.rules[k];
      n.textContent = b.now[k] == null ? 'not measured' : b.now[k].toLocaleString('en-US');
      if (b.now[k] == null) n.className = 'none';
      w.textContent = words;
      if (prev && b.now[k] != null && prev[k] != null) { const ch = b.now[k] - prev[k]; d.textContent = `${ch >= 0 ? '+' : ''}${ch} since ${prev.day}`; }
      cell.append(n, ' ', w, d); grid.append(cell);
    }
  }
  const when = document.createElement('p'); when.className = 'note';
  when.textContent = `Last counted ${new Date(b.made).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`;
  $('score-note').parentElement.after(when);
  try {
    const s = await getJSON('/stamp.json', { retries: 0, shape: d => typeof d?.sha256 === 'string' }), p = document.createElement('p'), c = document.createElement('code');
    p.className = 'note'; c.textContent = s.sha256.slice(0, 12); c.title = s.sha256;
    p.append(`This build (${s.files} files) was timestamped on ${s.day}, fingerprint `, c, `. ${s.how}.`);
    $('score-note').after(p);
  } catch { /* no stamp yet: nothing shown, never a made-up one */ }
  try {
    const u = await getJSON('/updated.json', { retries: 0, shape: d => typeof d?.at === 'string' });
    const at = new Date(u.at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const speed = u.q2p?.median_min != null ? ` A new fact reaches the front page in about ${u.q2p.median_min} minutes (the middle of the last ${u.q2p.facts}, measured).` : '';
    $('fresh-detail').textContent = ` Last run ${at}, ${u.every_check_passed ? 'every check passed' : 'a check failed, so the site kept the last good build'}.${speed}`;
  } catch { /* the one static sentence stays */ }
}
start();
