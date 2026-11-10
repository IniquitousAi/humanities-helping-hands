export function tally(tags) {
  const n = t => tags.filter(x => x === t).length, all = tags.length, proven = n('PROVEN'), m = n('MEASURED');
  return `${proven} of ${all} pieces proven by a machine (${Math.round(100 * proven / all)}%). `
    + `${n('BLOCKED')} are roads a published theorem has closed, ${m} ${m === 1 ? 'is measured and waits' : 'are measured and wait'} for a proof, ${n('OPEN')} are open for you.`;
}
if (typeof document !== 'undefined') {
  const out = document.getElementById('tally'), tags = [...document.querySelectorAll('.founders .row > .tag')].map(t => t.textContent.trim());
  if (out && tags.length) out.textContent = tally(tags);
}
