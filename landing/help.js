export const REPO = 'https://github.com/IniquitousAi/lean-proofs';
const HANDLE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

export function issueUrl(task) {
  const q = new URLSearchParams({ template: 'starter-task.md', title: `${task.kind}: ${task.title}`.slice(0, 200), body: task.body });
  return `${REPO}/issues/new?${q}`;
}

export function tasks(facts, asked = []) {
  const out = [];
  for (const q of asked) {
    if (!q || !q.text) continue;
    out.push({ kind: 'Prove one fact in Lean', title: q.text, from: 'asked',
      body: `A visitor searched for this and the library had no proven fact.\n\n> ${q.text}\n\nWrite it as a Lean theorem in LeanProofs/, prove it with no sorry, and open a pull request. If it cannot be stated exactly, say why here: that flags the gap.` });
    out.push({ kind: 'Flag a gap', title: q.text, from: 'asked',
      body: `A visitor searched for this and the library had no proven fact.\n\n> ${q.text}\n\nSay what exactly would need proving, or which part no math can settle, so the next person can pick it up.` });
  }
  for (const f of facts) {
    if (f.claim_label !== 'GUESS' || !f.checked_as) continue;
    out.push({ kind: 'Check a source', title: f.claim, from: f.id,
      body: `Fact ${f.id} (${f.link}):\n\nEnglish line: ${f.claim}\nLean states: ${f.checked_as}\nTheorem: ${f.theorem}\n\nDoes the English line say exactly what Lean proved, no more? Reply yes, or say what it overclaims.` });
  }
  return out;
}

export const pick = (list, rand = Math.random) => list.length ? list[Math.floor(rand() * list.length)] : null;

export function withCredit(facts, contributors = []) {
  const by = new Map(contributors.filter(c => c && HANDLE.test(c.handle || '') && c.theorem).map(c => [c.theorem, c]));
  for (const f of facts) { const c = by.get(f.theorem); if (c) { f.by = c.handle; if (c.pr) f.pr = c.pr; } }
  return facts;
}

export const creditLine = f => f.by ? `Proved by @${f.by} on GitHub${f.pr ? `, pull request ${f.pr}` : ''}` : null;

export function contributors(facts) {
  const n = new Map();
  for (const f of facts) if (f.by) n.set(f.by, (n.get(f.by) || 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([handle, count]) => ({ handle, count }));
}
