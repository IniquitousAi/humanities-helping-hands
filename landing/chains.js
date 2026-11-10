export const LABELS = ['PROVEN', 'GUESS', 'OPEN', 'ROOT'];
const LEAN_ROOT = { label: 'ROOT', what: "Lean's three standard axioms",
  detail: 'propext, Classical.choice and Quot.sound: the starting rules nearly all of modern math assumes. A root is a starting rule: assumed, never proven itself. Theorems such as the Root Theorem are proven from roots; the name is not a ROOT label.' };
const ARITH_ROOT = { label: 'ROOT', what: 'The rules of arithmetic',
  detail: 'Whole numbers and fractions, computed exactly (no rounding) by checker.js, the same file that runs in your browser. Assumed, never proven: every step above rests on these.' };

export const HAND_MIN_PER_STEP = 10;

export function chainOf(f) {
  if (!f || (f.label !== 'PROVEN' && f.label !== 'ARITHMETIC-CHECKED')) throw new Error(`${f && f.id}: only PROVEN facts get a chain`);
  if (!f.checked_as) throw new Error(`${f.id}: no statement was checked`);
  const steps = [];
  if (f.checked_by === 'Lean' || f.checked_by === 'Lean (Mathlib)') {
    if (!f.theorem) throw new Error(`${f.id}: says Lean checked it but names no theorem`);
    const mathlib = f.checked_by === 'Lean (Mathlib)';
    const upgraded = f.theorem.startsWith('Checked.');
    if (upgraded && f.claim_label !== 'GUESS') steps.push({ label: 'OPEN', what: 'The real-world fact', detail: f.not_proven || 'Only the numbers in it are proven.' });
    else steps.push({ label: 'GUESS', what: 'The plain English line',
      detail: f.not_proven || 'A person wrote these words to match the answer below; Lean checks the answer, not the words.' });
    steps.push({ label: 'PROVEN', what: upgraded ? 'The numbers in it' : mathlib ? 'The exact statement Lean checked' : 'The answer Lean proved',
      detail: f.checked_as, code: true, ...(upgraded ? { rerun: f.checked_as } : {}) });
    steps.push({ label: 'PROVEN', what: `Lean theorem ${f.theorem}`,
      detail: mathlib ? "From Mathlib, the shared library of checked math built by hundreds of people. Lean's kernel replayed it on our computer."
        : upgraded ? "The same numbers written as a Lean statement over exact fractions, replayed by Lean's kernel with no gaps (no sorry)."
        : "Replayed by Lean's kernel with no gaps (no sorry), and accepted by a second, separately written checker (nanoda)." });
    steps.push(LEAN_ROOT);
  } else if (f.checked_by === 'the browser checker') {
    steps.push({ label: 'OPEN', what: 'The real-world fact', detail: f.not_proven || 'Only the numbers in it are proven.' });
    steps.push({ label: 'PROVEN', what: 'The numbers in it', detail: f.checked_as, code: true, rerun: f.checked_as });
    steps.push(ARITH_ROOT);
  } else throw new Error(`${f.id}: checked by "${f.checked_by}", which is not a machine checker`);
  return { id: f.id, claim: f.claim, link: f.link, steps, handMinutes: (steps.length - 1) * HAND_MIN_PER_STEP };
}

export function whole(c) {
  return c.steps.length >= 2 && c.steps.every(s => LABELS.includes(s.label) && s.what && s.detail) && c.steps.at(-1).label === 'ROOT'
    && c.steps.slice(0, -1).every(s => s.label !== 'ROOT');
}
