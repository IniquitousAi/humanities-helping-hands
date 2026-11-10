import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from './vendor/CSS2DRenderer.js';
import { run } from '../checker.js';
import { REPO, creditLine } from '../help.js';

const $ = id => document.getElementById(id);
const COLORS = ['#4dffa6', '#7cf3ff', '#6aa8ff', '#8f8bff', '#c58bff', '#ff6ad5', '#ff9be6', '#ffd9f4', '#ffffff'];
const RUNG_Y = [-900, -660, -480, -320, -150, 150, 320, 480, 660];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const data = await (await fetch('facts.json', { cache: 'no-store' })).json();
$('count').textContent = `${data.facts.length} proven facts: ${data.counts.lean} proven in Lean, ${data.counts.checker} proven by the checker.`;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 1, 8000);
camera.position.set(0, -80, 2050);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight); document.body.prepend(renderer.domElement);
const labels = new CSS2DRenderer(); labels.setSize(innerWidth, innerHeight);
Object.assign(labels.domElement.style, { position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }); document.body.append(labels.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, -110, 0); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 140; controls.maxDistance = 3200;
controls.enablePan = false; controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.8; controls.minPolarAngle = 0.35; controls.maxPolarAngle = Math.PI - 0.35;
controls.autoRotate = true; controls.autoRotateSpeed = 0.2;

let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
{ const n = 2600, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = 3000 + rnd() * 1500, s = Math.sqrt(1 - u * u);
    pos.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xbfc6ff, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.7 }))); }

const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,1)'); g.addColorStop(0.62, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const pickable = [];
function star(color, size, at, fact) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color, transparent: true, depthWrite: false, sizeAttenuation: false }));
  const k = size * 0.75 / 864; s.scale.set(k, k, 1); s.position.copy(at); s.userData.fact = fact; scene.add(s); pickable.push(s); return s;
}
const label = (html, color, cls) => { const d = document.createElement('div'); d.className = cls; d.style.color = color; d.innerHTML = html; return new CSS2DObject(d); };

const spots = data.rungs.map((name, i) => {
  const mine = data.facts.filter(f => f.rung === i), reach = 70 + 9 * Math.sqrt(mine.length) * 12;
  const tag = label(`${esc(name)}<small>${mine.length ? `${mine.length} proven fact${mine.length === 1 ? '' : 's'}` : 'nothing proven here yet'}</small>`, COLORS[i], 'rung');
  tag.position.set(0, RUNG_Y[i] + (i === 0 ? -70 : 60), 0); scene.add(tag);
  mine.filter(f => !f.star).forEach((f, k, all) => {
    seed = 1000 + i * 97 + k; const a = k * 2.39996, r = 40 + reach * Math.sqrt((k + 0.5) / all.length);
    star(COLORS[i], 16, new THREE.Vector3(Math.cos(a) * r, RUNG_Y[i] + (rnd() - 0.5) * 40, Math.sin(a) * r), f);
  });
  mine.filter(f => f.star).forEach(f => star('#ffffff', 46, new THREE.Vector3(0, RUNG_Y[i], 0), f));
  return { at: new THREE.Vector3(0, RUNG_Y[i], 0), back: 420 + reach * 1.6, count: mine.length };
});

let fly = null;
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
function flyTo(at, back, ms = 1100) {
  const dir = camera.position.clone().sub(controls.target).normalize();
  fly = { t0: performance.now(), ms, fromT: controls.target.clone(), fromC: camera.position.clone(), toT: at.clone(), toC: at.clone().add(dir.multiplyScalar(back)) };
  controls.autoRotate = false; $('hint').style.opacity = 0;
}
function goTo(i, btn) {
  flyTo(spots[i].at, spots[i].back);
  $('ladder').querySelectorAll('button').forEach(b => b.classList.toggle('here', b === btn));
}
data.rungs.forEach((name, i) => {
  const b = document.createElement('button'); b.style.setProperty('--c', COLORS[i]);
  b.innerHTML = `<i></i>${esc(name)}<small>${spots[i].count}</small>`; b.title = `Fly to ${name.toLowerCase()}`;
  b.onclick = () => goTo(i, b); $('ladder').append(b);
});

function show(f) {
  const where = data.rungs[f.rung], lean = f.how === 'lean';
  $('card').innerHTML = `<div class="where">${esc(where)}</div><h2>${esc(f.claim)}</h2>
    ${lean ? `<p class="ans">${f.source === 'mathlib' ? 'Lean states it as' : 'Exact answer'}: <code>${esc(f.answer)}</code></p>` : `<p class="ans">Checked as: <code>${esc(f.form)}</code></p>`}
    <div class="tagrow"><span class="tag proven">Math: PROVEN (${lean ? 'Lean' : 'checker'})</span><span>${lean ? 'by Lean, a proof checker' : 'by the checker on the front page'}</span></div>
    <div class="tagrow"><span class="tag ${f.claimLabel === 'OPEN' ? 'open' : 'guess'}">Real-world claim: ${f.claimLabel === 'OPEN' ? 'OPEN' : 'GUESS'}</span><span>${f.claimLabel === 'OPEN' ? 'only the numbers in it are proven' : 'a person matched the words to the proof'}</span></div>
    <h3>How it was proven</h3><p>${esc(f.proof)}</p>
    ${creditLine(f) ? `<p class="credit"><a href="${REPO}/pulls?q=author%3A${esc(f.by)}" rel="noopener" target="_blank">${esc(creditLine(f))}</a></p>` : ''}
    ${f.notProven ? `<h3>Not proven</h3><p class="not">${esc(f.notProven)}</p>` : ''}
    ${lean ? '<h3>Re-run it</h3><p>This one re-runs with Lean on a computer, not in the browser.</p>' : ''}
    <div class="row">${lean ? '' : '<button type="button" id="rerun">Re-run it now<small></small></button>'}<button type="button" class="quiet" id="close">Close</button></div>
    <p class="rerun" id="rerun-out" role="status"></p>`;
  $('card').hidden = false; document.body.classList.add('reading');
  $('close').onclick = closeCard;
  if (!lean) $('rerun').onclick = () => {
    const t = performance.now(), [v, , why] = run(f.form), ms = (performance.now() - t).toFixed(1);
    $('rerun-out').textContent = `${v === 'PROVEN' ? 'PROVEN again' : v}, in ${ms} ms, on your device: ${why}.`;
  };
}
const v = new THREE.Vector3();
function nearest(x, y, reach) {
  let best = null, bd = reach;
  for (const s of pickable) {
    v.copy(s.position).project(camera); if (v.z > 1) continue;
    const d = Math.hypot((v.x + 1) / 2 * innerWidth - x, (1 - v.y) / 2 * innerHeight - y);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}
let down = null, hovered = null, picked = null;
const size = (s, k) => { if (s) { const b = s.userData.base || (s.userData.base = s.scale.x); s.scale.set(b * k, b * k, 1); } };
function select(s) { size(picked, 1); picked = s; size(s, 1.8); }
function closeCard() { $('card').hidden = true; document.body.classList.remove('reading'); select(null); }
renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; fly = null; controls.autoRotate = false; });
renderer.domElement.addEventListener('wheel', () => { fly = null; controls.autoRotate = false; }, { passive: true });
renderer.domElement.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return;
  const s = nearest(e.clientX, e.clientY, e.pointerType === 'touch' ? 34 : 22);
  if (!s) { closeCard(); return; }
  openStar(s);
});
function openStar(s) {
  show(s.userData.fact); select(s);
  const lit = $('ladder').children[s.userData.fact.rung];
  $('ladder').querySelectorAll('button').forEach(b => b.classList.toggle('here', b === lit));
  flyTo(s.position, Math.min(camera.position.distanceTo(controls.target), 700), 900);
}
const linked = () => { const s = pickable.find(p => p.userData.fact.id === decodeURIComponent(location.hash.slice(1))); if (s) { controls.autoRotate = false; openStar(s); } };
addEventListener('hashchange', linked); setTimeout(linked, 0);
renderer.domElement.addEventListener('pointermove', e => {
  if (e.buttons) return;
  const s = nearest(e.clientX, e.clientY, 22);
  if (s !== hovered) { if (hovered !== picked) size(hovered, 1); hovered = s; if (s && s !== picked) size(s, 1.4); }
  renderer.domElement.style.cursor = s ? 'pointer' : 'grab';
});
addEventListener('keydown', e => { if (e.key === 'Escape') closeCard(); });
function frameIt() {
  camera.aspect = innerWidth / innerHeight;
  if (innerWidth > 760) camera.setViewOffset(innerWidth, innerHeight, -Math.min(220, innerWidth * 0.17), 0, innerWidth, innerHeight); else camera.clearViewOffset();
  camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); labels.setSize(innerWidth, innerHeight);
}
frameIt(); addEventListener('resize', frameIt);

fetch('../features.json', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})).then(j => {
  const s = (j.features || {}).atlas, el = document.querySelector('.state[data-feature=atlas]'), built = s && s.status === 'BUILT';
  el.className = 'state ' + (built ? 'built' : 'unbuilt'); el.textContent = built ? 'Built: proven to work and brick tested' : `Not fully built yet (${s && s.why ? s.why.split('; ').pop() : 'its label could not be read'})`;
  if (s && s.north) {
    const d = document.createElement('details'), sum = document.createElement('summary'), p = document.createElement('div');
    d.className = 'north'; sum.textContent = 'toward the north star'; p.textContent = `${s.north.does} Limit now: ${s.north.limit} (${s.north.label})`;
    d.append(sum, p); el.after(d);
  }
});

(function frame() {
  if (fly) {
    const t = Math.min(1, (performance.now() - fly.t0) / fly.ms), k = ease(t);
    controls.target.lerpVectors(fly.fromT, fly.toT, k); camera.position.lerpVectors(fly.fromC, fly.toC, k);
    if (t === 1) fly = null;
  }
  controls.update(); renderer.render(scene, camera); labels.render(scene, camera); requestAnimationFrame(frame);
})();
window.atlas = { pickable, show, data, camera, nearest };
