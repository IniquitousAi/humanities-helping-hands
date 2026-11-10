const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function getJSON(url, { timeout = 8000, retries = 2, shape = d => d != null, cache = 'no-store' } = {}) {
  let last;
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, { cache, signal: AbortSignal.timeout ? AbortSignal.timeout(timeout) : undefined });
      if (!r.ok) throw new Error(`answered ${r.status}`);
      const d = JSON.parse(await r.text());
      if (!shape(d)) throw new Error('answered in the wrong shape');
      return d;
    } catch (e) { last = e; }
    if (i < retries) await sleep(Math.random() * Math.min(4000, 500 * 2 ** i));
  }
  throw last;
}

export function failed(box, what, url, retry) {
  const p = document.createElement('p'), b = document.createElement('button'), a = document.createElement('a');
  p.className = 'load-fail'; p.setAttribute('role', 'alert');
  b.type = 'button'; b.textContent = 'Retry'; b.addEventListener('click', () => { p.textContent = 'Trying again...'; retry(); });
  a.href = url; a.textContent = 'open the raw file';
  p.append(`${what} did not load: the server did not answer in time or sent something broken. `, b, ' or ', a, '.');
  box.replaceChildren(p);
}
