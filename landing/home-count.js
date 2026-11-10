import { factsOnce } from '/facts-once.js';
factsOnce.then(d => {
  const n = (d.facts || []).filter(f => f.label === 'PROVEN').length;
  if (!n) return;
  document.getElementById('proven-n').textContent = n;
  document.getElementById('proven-count').hidden = false;
}).catch(() => {});
