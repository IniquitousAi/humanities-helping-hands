export const OPEN = 'OPEN';
const PROBLEMS = [
  ['P vs NP', /\bP\s*(?:=|!=|≠|=\/=|<|vs\.?|versus|equals?|is(?: not)?(?: equal to)?|does not equal|neq)\s*NP\b/i],
  ['the Riemann hypothesis', /\briemann(?:'s)? hypothesis\b/i],
  ['Goldbach\'s conjecture', /\bgoldbach(?:'s)? conjecture\b/i, /\b(weak|ternary)\b/i],
  ['the twin prime conjecture', /\btwin primes? conjecture\b|\binfinitely many twin primes\b/i],
  ['the Collatz conjecture', /\bcollatz\b/i],
  ['the Hodge conjecture', /\bhodge conjecture\b/i],
  ['the Birch and Swinnerton-Dyer conjecture', /\bbirch and swinnerton.dyer\b/i],
  ['Navier-Stokes existence and smoothness', /\bnavier.stokes\b.*\b(smooth|existence|blow.?up)\b|\b(smooth|existence|blow.?up)\b.*\bnavier.stokes\b/i],
  ['the Yang-Mills mass gap', /\byang.mills\b.*\bmass gap\b|\bmass gap\b.*\byang.mills\b/i],
  ['odd perfect numbers', /\bodd perfect numbers?\b/i],
];
export function openProblem(said) {
  const s = String(said || '');
  const hit = PROBLEMS.find(([, re, not]) => re.test(s) && !(not && not.test(s)));
  return hit ? `open problem (${hit[0]}): nobody has proved or disproved it as of our last check (2026-10-29), so neither math nor a lookup settles it` : null;
}
