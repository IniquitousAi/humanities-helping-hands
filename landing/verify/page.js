import { strict } from './strict.js';
const LABEL_OK = /^(PROVEN|CHECKED|MEASURED|REASONED|PARTIAL|GUESS)$/, HASH_OK = /^[0-9a-f]{64}$/, DATE_OK = /^\d{4}-\d{2}-\d{2}$/;
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));

export async function check(text, keys, log, subtle = crypto.subtle) {
  let s; try { s = JSON.parse(text); } catch { return 'FAKE'; }
  if (!s || typeof s !== 'object' || Array.isArray(s) || Object.keys(s).sort().join() !== 'date,gate,hash,kid,label,sig,v') return 'FAKE';
  if (s.v !== 2 || !HASH_OK.test(s.hash) || !HASH_OK.test(s.gate) || !LABEL_OK.test(s.label) || !DATE_OK.test(s.date) || !/^[A-Za-z0-9_-]{86}$/.test(s.sig)) return 'FAKE';
  const pub = (keys && Array.isArray(keys.keys) ? keys.keys : []).find(k => k.kid === s.kid);
  if (!pub || (pub.valid_from && s.date < pub.valid_from) || (pub.revoked_after && s.date > pub.revoked_after)) return 'FAKE';
  let key; try { key = await subtle.importKey('jwk', { kty: 'OKP', crv: 'Ed25519', x: pub.x }, { name: 'Ed25519' }, false, ['verify']); } catch { return 'CANNOT'; }
  const msg = new TextEncoder().encode(`HHH-STAMP-v2\n${s.hash}\n${s.label}\n${s.gate}\n${s.date}\n`);
  if (!strict(b64u(pub.x), b64u(s.sig)) || !await subtle.verify({ name: 'Ed25519' }, key, b64u(s.sig), msg)) return 'FAKE';
  return log.entries.some(e => e.hash === s.hash && e.label === s.label && e.gate === s.gate && e.date === s.date && e.kid === s.kid && e.sig === s.sig) ? 'VALID' : 'FAKE';
}

const SAY = {
  VALID: 'VALID: we signed this stamp and it is in our public log.',
  FAKE: 'FAKE: this stamp was not signed by us, was changed, or is not in our public log.',
  CANNOT: 'Cannot check in this browser: it is too old to check signatures. Update it and try again.',
};
const form = typeof document !== 'undefined' && document.getElementById('vf-form');
if (form) form.addEventListener('submit', async ev => {
  ev.preventDefault();
  const out = document.getElementById('vf-out'); out.textContent = 'Checking...';
  try {
    const [pub, log] = await Promise.all(['/.well-known/hhh-stamp-key.json', '/stamps/log.json'].map(u => fetch(u, { cache: 'no-store' }).then(r => r.json())));
    const r = await check(document.getElementById('vf-stamp').value.trim(), pub, log);
    out.dataset.result = r; out.textContent = SAY[r];
  } catch { out.dataset.result = 'CANNOT'; out.textContent = 'Could not reach the public key or log. Try again.'; }
});
