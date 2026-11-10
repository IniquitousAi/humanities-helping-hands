import { recheck } from './recheck.js';
import { THEOREMS, unzip, checkTheorem } from './theorems.js';

const out = document.getElementById('out'), detail = document.getElementById('detail');
const wasm = fetch('nanoda.wasm').then(r => r.arrayBuffer());

async function run(file) {
  out.textContent = 'Checking...';
  try {
    const [w, data] = await Promise.all([wasm, fetch(file).then(r => r.arrayBuffer())]);
    const r = await recheck(w, new Uint8Array(data));
    out.textContent = `${r.pass ? 'PASS' : 'FAIL'}: ${file} (${data.byteLength.toLocaleString()} bytes) in ${r.ms.toFixed(0)} ms`;
    out.className = r.pass ? 'pass' : 'fail';
    detail.textContent = r.msg.slice(0, 600);
  } catch (e) {
    out.textContent = `Could not run the checker in this browser: ${e.message}`;
    out.className = 'fail';
  }
}

document.getElementById('real').onclick = () => run('root_never_costs_more.ndjson');

async function runTheorem(t) {
  const o = document.getElementById(`out-${t.id}`);
  o.textContent = 'Checking...'; o.className = 'thm-out';
  try {
    const [w, data] = await Promise.all([wasm, fetch(t.file).then(r => { if (!r.ok) throw new Error(`download failed (${r.status})`); return r.arrayBuffer(); })]);
    const bytes = await unzip(new Uint8Array(data));
    const r = await checkTheorem(w, bytes, t.name);
    o.textContent = r.pass ? `PASS, re-checked here in ${r.ms < 1000 ? `${Math.max(1, Math.round(r.ms))} ms` : `${(r.ms / 1000).toFixed(1)} s`}` : `FAIL: ${r.msg.split('\n')[0].slice(0, 160)}`;
    o.className = `thm-out ${r.pass ? 'pass' : 'fail'}`;
    return r.pass;
  } catch (e) {
    o.textContent = `Could not run the checker in this browser: ${e.message}`; o.className = 'thm-out fail';
    return false;
  }
}
for (const t of THEOREMS) document.querySelector(`[data-thm="${t.id}"]`).onclick = () => runTheorem(t);
document.getElementById('all').onclick = async () => { for (const t of THEOREMS) await runTheorem(t); };
document.getElementById('bad1').onclick = () => run('planted_wrong_proof.ndjson');
document.getElementById('bad2').onclick = () => run('planted_changed_number.ndjson');
