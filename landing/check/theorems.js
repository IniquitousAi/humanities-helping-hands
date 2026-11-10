import { recheck } from './recheck.js';

export const THEOREMS = [
  { id: 'root', name: 'DanielRootTheorem', title: "Daniel's Root Theorem", file: 'theorems/root.ndjson.gz' },
  { id: 'logging', name: 'DanielLoggingTheorem', title: "Daniel's Logging Theorem", file: 'theorems/logging.ndjson.gz' },
  { id: 'founder', name: 'DanielFounderClaim', title: "Daniel's Founder Theorem", file: 'theorems/founder.ndjson.gz' },
  { id: 'stamp', name: 'HHHStampRule', title: 'The HHH Stamp Rule', file: 'theorems/stamp.ndjson.gz' },
];

export async function unzip(bytes) {
  if (!(bytes[0] === 0x1f && bytes[1] === 0x8b)) return bytes;
  const out = new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')));
  return new Uint8Array(await out.arrayBuffer());
}

export function findDeclaration(text, wanted) {
  const names = new Map();
  for (const m of text.matchAll(/^\{"in":(\d+),"str":\{"pre":(\d+),"str":"((?:[^"\\]|\\.)*)"\}\}$/gm)) names.set(+m[1], [+m[2], m[3]]);
  const full = (id) => { const parts = []; for (let i = id, n = 0; i && names.has(i) && n < 64; n++) { const [p, s] = names.get(i); parts.unshift(s); i = p; } return parts.join('.'); };
  const kinds = [];
  for (const m of text.matchAll(/^\{"(thm|axiom|def|opaque|quot|inductive|ctor|rec)":\{.*?"name":(\d+)/gm)) if (full(+m[2]) === wanted) kinds.push(m[1]);
  return kinds;
}

export async function checkTheorem(wasmBytes, exportBytes, wanted) {
  const text = new TextDecoder().decode(exportBytes);
  const kinds = findDeclaration(text, wanted);
  if (!kinds.length) return { pass: false, ms: 0, msg: `${wanted} is not in this file.` };
  if (kinds.join() !== 'thm') return { pass: false, ms: 0, msg: `${wanted} is in this file as ${kinds.join(' and ')}, not as one proven theorem.` };
  const r = await recheck(wasmBytes, exportBytes);
  const skipped = /skipped unpermitted axioms: \[(.*?)\]/s.exec(r.msg);
  if (r.pass && (!skipped || skipped[1].trim())) return { ...r, pass: false, msg: `The checker skipped something instead of checking it: ${skipped ? skipped[1].trim() : 'no list'}. ${r.msg}` };
  return r;
}
