const $ = id => document.getElementById(id);
const put = (id, n) => { const e = $(id); if (e && typeof n === 'number') { e.textContent = n.toLocaleString('en-US'); e.className = ''; } };

fetch('/scoreboard.json', { cache: 'no-store' }).then(r => r.json()).then(b => {
  const n = b.now;
  put('n-facts', n.proven_facts); put('n-mathlib', n.proven_from_mathlib); put('n-root', n.root_chains_proven);
  put('n-agents', n.agent_test_calls); put('n-wrong', n.agent_test_wrong_latest);
  if (typeof n.median_minutes_to_proven_answer === 'number') document.querySelectorAll('.n-minutes').forEach(e => { e.textContent = `${n.median_minutes_to_proven_answer} minutes (median)`; });
  $('inv-when').textContent = new Date(b.made).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}).catch(() => {});

fetch('/hit?days=14', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => {
  if (!d || typeof d.total !== 'number') return;
  put('n-visitors', d.total);
}).catch(() => {});
