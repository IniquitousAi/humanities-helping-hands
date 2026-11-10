const rad = Math.PI / 180;
let data = null, cv = null, timer = 0;

function tint(bv) {
  const t = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62)) / 100;
  let r, g, b;
  r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -0.1332);
  g = t <= 66 ? 99.47 * Math.log(t) - 161.12 : 288.12 * Math.pow(t - 60, -0.0755);
  b = t >= 66 ? 255 : t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
  const c = v => Math.round(Math.max(0, Math.min(255, v)) * 0.15 + 255 * 0.85);
  return `${c(r)},${c(g)},${c(b)}`;
}

function paint() {
  const w = innerWidth, h = innerHeight, px = w / 2, py = h * 0.32;
  const R = Math.ceil(Math.max(Math.hypot(px, py), Math.hypot(w - px, py), Math.hypot(px, h - py), Math.hypot(w - px, h - py))) + 8;
  const k = Math.max(w, h) * 0.62;
  const d = Math.min(1.5, devicePixelRatio || 1), S = 2 * R;
  if (!cv) { cv = document.createElement('canvas'); cv.className = 'sky'; cv.setAttribute('aria-hidden', 'true'); document.querySelector('.ambient')?.prepend(cv); }
  cv.width = Math.round(S * d); cv.height = Math.round(S * d);
  cv.style.width = cv.style.height = S + 'px'; cv.style.left = (px - R) + 'px'; cv.style.top = (py - R) + 'px';
  const ctx = cv.getContext('2d', { alpha: true });
  ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, S, S);
  const { lst } = data.meta, s = data.s;
  for (let i = 0; i < s.length; i += 4) {
    const ra = s[i], dec = s[i + 1], mag = s[i + 2], bv = s[i + 3];
    const r = 2 * k * Math.tan((90 - dec) * rad / 2); if (r > R) continue;
    const H = (lst - ra) * rad;
    const x = R - r * Math.sin(H), y = R - r * Math.cos(H);
    const size = Math.max(0.45, Math.min(2.4, 0.4 + (6.2 - mag) * 0.33));
    const a = Math.max(0.28, Math.min(1, 1.05 - mag * 0.13));
    const col = tint(bv);
    if (mag < 1.8) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, size * 3.2);
      g.addColorStop(0, `rgba(${col},${a * 0.28})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, size * 3.2, 0, 7); ctx.fill();
    }
    ctx.fillStyle = `rgba(${col},${a})`; ctx.beginPath(); ctx.arc(x, y, size / 2, 0, 7); ctx.fill();
  }
}

export async function startSky() {
  try { data = await (await fetch(new URL('./sky/stars.json', import.meta.url))).json(); } catch { return; }
  const t0 = performance.now(); paint(); window.__skyPaintMs = performance.now() - t0;
  addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(paint, 200); });
}
