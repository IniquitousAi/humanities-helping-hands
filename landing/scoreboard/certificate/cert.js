const MIX = [['PROVEN', 'proven'], ['MEASURED', 'measured'], ['REASONED', 'reasoned'], ['GUESS', 'guess']];

export function certificate(s, board, who) {
  if (!s || s.board_label !== 'MEASURED') return { ok: false, msg: 'The board could not be read right now, so no certificate is made. Try again in a minute.' };
  if (!who) return { ok: false, msg: 'Open the board and choose Print certificate beside a name.' };
  const b = s.boards && s.boards[board];
  const row = b && (b.rows || []).find(r => String(r.who).toLowerCase() === String(who).toLowerCase());
  if (!row) return { ok: false, msg: 'That name holds no spot on this board, so there is no certificate to print.' };
  const when = s.board_built ? new Date(s.board_built).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'today';
  return { ok: true, who: String(row.who), board: `holds a place on the board "${String(b.title || board)}", earned by work a machine checked and stamped.`, rank: `#${Number(row.rank)}`,
    points: `${(Math.round(Number(row.score) * 10) / 10).toLocaleString('en-US')} points`,
    tags: MIX.filter(([k]) => row.mix && Number(row.mix[k]) > 0).map(([k, c]) => [c, `${Number(row.mix[k])} ${k}`]),
    fine: `Printed from the board built ${when} at humanitieshelpinghands.com/scoreboard. Every point comes from a signed stamp in the public log; money and sign-up date never change a rank.`,
    hash: /^[0-9a-f]{64}$/.test(s.board_id || '') ? `Board fingerprint (sha256): ${s.board_id}` : '' };
}

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id), btn = $('cert-print');
  btn.hidden = true;
  const q = new URLSearchParams(location.search);
  fetch('/api/scoreboard').then(r => r.json()).catch(() => null).then(s => {
    const c = certificate(s, q.get('board') || 'all', q.get('who'));
    if (!c.ok) { $('cert-msg').textContent = c.msg; return; }
    for (const k of ['who', 'board', 'rank', 'points', 'fine', 'hash']) $('c-' + k).textContent = c[k];
    for (const [cls, words] of c.tags) { const t = document.createElement('span'); t.className = 'tag ' + cls; t.textContent = words; $('c-tags').append(t); }
    $('cert-msg').hidden = true; $('cert-held').hidden = false; btn.hidden = false; $('cert-board').hidden = true;
  });
  btn.addEventListener('click', () => window.print());
}
