export function libraryCounts(facts) {
  const math = facts.filter(f => f.label === 'PROVEN' && f.claim_label === 'GUESS');
  const mathlib = math.filter(f => f.checked_by === 'Lean (Mathlib)').length;
  return { total: facts.length, here: math.length - mathlib, mathlib, open: facts.filter(f => f.label === 'ARITHMETIC-CHECKED' && f.claim_label === 'OPEN').length };
}
