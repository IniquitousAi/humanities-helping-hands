export const SHOW = [['proven_facts', 'machine-checked facts'], ['proven_by_lean', 'of them checked by Lean, a proof checker'],
  ['proven_from_mathlib', 'of those, known theorems found in Mathlib (not proved here)'],
  ['proven_by_browser', 'of them checked by exact math in your browser'], ['root_chains_proven', 'of them proven all the way to the root'],
  ['root_chains_numbers_only', 'of them with only the numbers proven, the real-world part still open'],
  ['open_problem_pieces_proven', 'known P vs NP pieces machine-checked here (P vs NP itself: OPEN)'], ['open_problem_pieces_measured', 'P vs NP pieces measured here, not proven'],
  ['open_problem_pieces_blocked', 'roads to P vs NP proven blocked'], ['open_problem_pieces_open', 'P vs NP pieces still open, P vs NP itself one of them'],
  ['median_minutes_to_proven_answer', 'minutes from question to proven answer'],
  ['agent_test_calls', 'test calls by our own AI agents (simulated, not outside use)'], ['agent_test_wrong_latest', 'wrong labels in their latest round']];

export const LABELS = [['label_proven', 'labeled PROVEN'], ['label_measured', 'labeled MEASURED'], ['label_checked', 'labeled CHECKED'],
  ['label_reasoned', 'labeled REASONED'], ['label_guess', 'labeled GUESS'], ['label_blocked', 'labeled BLOCKED'], ['label_open', 'labeled OPEN']];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const since = (now, prev, k) => prev && now[k] != null && prev[k] != null ? `<small>${now[k] - prev[k] >= 0 ? '+' : ''}${now[k] - prev[k]} since ${esc(prev.day)}</small>` : '<small></small>';
export const tileHtml = (now, rules, list = SHOW, prev = null) => list.map(([k, words]) => now[k] == null
  ? `<div class="score-cell" title="${esc(rules[k])}"><b class="none">not measured</b> <span>${esc(words)}</span></div>`
  : `<div class="score-cell" title="${esc(rules[k])}"><b>${now[k].toLocaleString('en-US')}</b> <span>${esc(words)}</span>${since(now, prev, k)}</div>`).join('');
