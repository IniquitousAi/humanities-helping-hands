const P = (1n << 255n) - 19n, L = (1n << 252n) + 27742317777372353535851937790883648493n;
const le = b => b.reduceRight((n, x) => (n << 8n) | BigInt(x), 0n);
const SMALL_Y = new Set([0n, 1n, P - 1n,
  le(Uint8Array.from('26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05'.match(/../g), h => parseInt(h, 16))),
  le(Uint8Array.from('c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a'.match(/../g), h => parseInt(h, 16)))]);
export function pointOk(e) {
  if (!e || e.length !== 32) return false;
  const y = le(e) & ((1n << 255n) - 1n), sign = e[31] >> 7;
  if (y >= P || ((y === 1n || y === P - 1n) && sign)) return false;
  return !SMALL_Y.has(y);
}
export const strict = (pub, sig) => !!pub && !!sig && sig.length === 64 && pointOk(pub) && pointOk(sig.subarray(0, 32)) && le(sig.subarray(32)) < L;
