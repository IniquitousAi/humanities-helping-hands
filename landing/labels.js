export const FOUR = {
  PROVEN: { word: 'Proven', cls: 'proven', color: '--k-green', means: 'Only for a claim a machine checked.' },
  MEASURED: { word: 'Measured', cls: 'measured', color: '--k-yellow', means: 'Tested or measured, and the page says which test.' },
  REASONED: { word: 'Reasoned', cls: 'reasoned', color: '--k-orange', means: 'Backed by sources or studies, with how strong the evidence is.' },
  GUESS: { word: 'Guess', cls: 'guess', color: '--k-red', means: 'Not checked yet. The page says which checker is missing.' },
};
export const ORDER = ['PROVEN', 'MEASURED', 'REASONED', 'GUESS'];
const ENGINE = {
  PROVEN: ['PROVEN', 'true'],
  FALSIFIED: ['PROVEN', 'false'],
  'ARITHMETIC-CHECKED': ['REASONED', ''],
  'NOT CHECKED': ['GUESS', 'not checked yet'],
  OPEN: ['GUESS', 'not checked yet'],
  GUESS: ['GUESS', 'not checked yet'],
  SOURCED: ['REASONED', ''],
  'NOT TRACED': ['GUESS', 'not traced yet'],
  MEASURED: ['MEASURED', ''],
  REASONED: ['REASONED', ''],
};
export const KIDS = { PROVEN: 'Yes, true!', MEASURED: 'We measured it', REASONED: 'Experts say so', GUESS: 'Not checked yet' };
export function shown(engine) {
  const [label, holds] = ENGINE[engine] || ENGINE['NOT CHECKED'];
  return { label, word: FOUR[label].word, cls: FOUR[label].cls, holds };
}
export function factShown(f) {
  const s = shown(f?.label === 'PROVEN' ? 'PROVEN' : 'ARITHMETIC-CHECKED');
  return { ...s, holds: '', note: s.label === 'PROVEN' ? '' : 'Its arithmetic is machine-checked; the real-world part rests on its source.' };
}
export function notProven(f) {
  if (f?.not_proven) return String(f.not_proven);
  if (f?.label === 'PROVEN' && f?.claim_label && f.claim_label !== 'PROVEN')
    return `A machine checked only the exact statement ${f.checked_as ? `“${f.checked_as}”` : 'shown'}. That these words say the same thing about the real world is not proven.`;
  return '';
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function chipHTML(s) {
  const c = `<span class="chip ${s.cls}">${s.word}</span>`;
  return s.holds ? `<span class="lab-pair">${c}<span class="holds">${esc(s.holds)}</span></span>` : c;
}
export const chip = engine => chipHTML(shown(engine));
export const factChip = f => chipHTML(factShown(f));
export const said = s => s.holds ? `${s.word}, ${s.holds}` : s.word;
export const brief = s => ({ label: s.label, holds: s.holds });
