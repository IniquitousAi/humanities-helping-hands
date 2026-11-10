const hex = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
const dumps = o => '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ': ' + JSON.stringify(o[k])).join(', ') + '}';

export const CREDIT = 'Found on Humanities Helping Hands (humanitieshelpinghands.com), founded by Daniel Steadham';

export async function receipt(claim, label, check, runId, output, solver) {
  const rec = { claim: String(claim), label: String(label), check: String(check), run_id: String(runId), output_sha256: await hex(String(output)),
    credit: solver ? `Solved by ${solver}. ${CREDIT}` : CREDIT };
  rec.sha256 = await hex(dumps(rec));
  return rec;
}
