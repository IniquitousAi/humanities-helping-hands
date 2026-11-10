const API = 'https://en.wikipedia.org/w/api.php';
const STOP = new Set(('a an the of in on at to for from by with and or but as is are was were be been being it its this that these those '
  + 'which who whom what when where how than then there their they he she his her has have had do does did can could will would '
  + 'also about into over after before such most more many some any each other one first two').split(' '));
const NEG = /\b(not|no|never|none|neither|nor|without|isn't|aren't|wasn't|weren't|doesn't|don't|didn't|cannot|can't)\b/i;
const MYTH = /\b(myths?|mythical|belief|believed|misconceptions?|fanciful|folklore|legends?|proverb\w*|sayings?|hoax\w*|conspiracy|satir\w+|jok\w+|metaphor\w*|claimed|allegedly|urban legend|fictional)\b/i;
const REPORTED = /\b(maintain(?:s|ed)?|thought|argu(?:es|ed)|held|holds|taught|teach(?:es)?|assert(?:s|ed)?|insist(?:s|ed)?|suppos(?:es|ed)|imagin(?:es|ed)|propos(?:es|ed)|believ(?:es|ed)|claim(?:s|ed)?|contend(?:s|ed)|posit(?:s|ed)|speculat(?:es|ed)|theoriz(?:es|ed)|conceiv(?:es|ed))\s+that\b/i;
const words = s =>(String(s).toLowerCase().replace(/[‘’]/g, "'").match(/[a-z0-9']+/g) || []);
const stem = w => w.length > 4 ? w.replace(/(ies|es|s|ed|ing)$/, '') : w;
const nums = s => new Set((String(s).match(/\d[\d,]*\d/g) || []).map(n => n.replace(/,/g, '')));

function run(want, got) {
  let best = 0;
  for (let i = 0; i < want.length; i++) for (let j = 0; j < got.length; j++) {
    let k = 0; while (i + k < want.length && j + k < got.length && want[i + k] === got[j + k]) k++;
    if (k > best) best = k;
  }
  return best / want.length;
}

function inOrder(main, got) {
  for (let i = 0; i < got.length; i++) if (got[i] === main[0]) {
    let k = 0, j = i; for (; j < got.length && k < main.length; j++) if (got[j] === main[k]) k++;
    if (k === main.length && j - i <= 2 * main.length + 4) return true;
  }
  return false;
}

export function says(claim, sentence) {
  const want = words(claim).map(stem), got = words(sentence).map(stem), have = new Set(got);
  const main = [...new Set(want.filter(w => !STOP.has(w) && !/^\d$/.test(w)))];
  if (main.length < 2) return { ok: false, why: 'too few words to look up' };
  const missing = main.filter(w => !have.has(w));
  if (missing.length) return { ok: false, why: `the sentence lacks "${missing[0]}"` };
  if (/["“”']/.test(sentence) && /["“”']\s*$|^\s*["“”']|\s["“]/.test(sentence) || MYTH.test(sentence)) return { ok: false, why: 'the sentence quotes it or calls it a myth' };
  if (reports(claim, sentence)) return { ok: false, why: 'the sentence reports what someone held, not what is so' };
  if (NEG.test(claim) !== NEG.test(sentence)) return { ok: false, why: 'one says "not" and the other does not' };
  const n = nums(sentence), lack = [...nums(claim)].find(x => !n.has(x));
  if (lack) return { ok: false, why: `the sentence lacks the number ${lack}` };
  const bare = words(sentence.replace(/\([^)]*\)/g, ' ')).map(stem);
  if (run(want, got) < 0.5 || !(inOrder(main, got) || inOrder(main, bare))) return { ok: false, why: 'the words are there but not said the same way' };
  return { ok: true, why: '' };
}

const ASSUMED = /\b(assum(?:e|es|ed|ing)|suppos(?:e|es|ed|ing)|imagin(?:e|es|ed|ing)|pretend(?:s|ed|ing)?|as if|hypothes(?:is|es|ize|ized)|whether)\b/i;
const PICTURED = /\b(pictur|depict|portray|describ|represent|show|view|regard|consider)(?:e|es|ed|s|ing)?\b[^.;]{0,60}\bas\b/i;
const COPY = /\b(replicas?|cop(?:y|ies)|models?|imitations?|miniatures?|parod(?:y|ies)|knock-?offs?|lookalikes?)\s+of\b/i;
const reports = (claim, sentence) => [REPORTED, ASSUMED, PICTURED, COPY].some(re => re.test(sentence) && !re.test(claim));

export function opposes(claim, sentence) {
  const want = words(claim).map(stem), have = new Set(words(sentence).map(stem));
  const main = [...new Set(want.filter(w => !STOP.has(w) && !/^\d+$/.test(w)))];
  if (main.length < 2 || main.some(w => !have.has(w)) || MYTH.test(sentence) || reports(claim, sentence)) return false;
  if (/\s["“]/.test(sentence)) return false;
  if (NEG.test(claim) !== NEG.test(sentence)) return true;
  const n = nums(sentence), c = [...nums(claim)];
  return c.length > 0 && n.size > 0 && c.some(x => !n.has(x));
}

export const sentencesOf = text => String(text).replace(/\s+/g, ' ').replace(/ ?={2,}[^=]{1,80}={2,} ?/g, '. ').split(/(?<=[.!?])\s+(?=[A-Z0-9"(])/)
  .filter(s => s.length >= 20 && s.length <= 900 && !/↑|\b[\w-]+\.(com|org|net|gov|edu|io)\b|https?:\/\//.test(s)
    && (s.match(/\bList of\b/g) || []).length < 2);
const scan = (claim, text) => {
  const ss = sentencesOf(text);
  return { supports: ss.find(s => says(claim, s).ok) || null, opposes: ss.find(s => opposes(claim, s)) || null };
};

export const SOURCE_NAMES = { wikipedia: 'Wikipedia', grokipedia: 'Grokipedia' };
export async function lookUp(claim, get) {
  const q = String(claim).replace(/\s+/g, ' ').trim().slice(0, 300);
  const search = await get(`${API}?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=3&format=json&origin=*`);
  const titles = (search.query && search.query.search || []).map(r => r.title)
    .filter(t => run(words(t).map(stem), words(q).map(stem)) * words(t).length < Math.max(4, words(q).length - 1))
    .filter(t => { const b = t.match(/\(([^)]+)\)\s*$/), have = new Set(words(q).map(stem)); return !b || words(b[1]).map(stem).every(w => STOP.has(w) || have.has(w)); });
  const found = { wikipedia: {}, grokipedia: {} };
  for (const title of titles) {
    const page = await get(`${API}?action=query&prop=extracts|revisions&rvprop=ids&explaintext=1&redirects=1&titles=${encodeURIComponent(title)}&format=json&origin=*`);
    const pages = Object.values(page.query && page.query.pages || {}), w = scan(claim, pages.map(p => p.extract || '').join(' '));
    const rev = (pages[0] && pages[0].revisions && pages[0].revisions[0] || {}).revid, name = encodeURIComponent(title.replace(/ /g, '_'));
    const url = rev ? `https://en.wikipedia.org/w/index.php?title=${name}&oldid=${rev}` : 'https://en.wikipedia.org/wiki/' + name;
    for (const k of ['supports', 'opposes']) if (w[k] && !found.wikipedia[k]) found.wikipedia[k] = { title, url, sentence: w[k] };
    let g = {};
    try { g = await get(`/grok?title=${encodeURIComponent(title)}`); } catch { g = {}; }
    const gs = scan(claim, g.text || '');
    for (const k of ['supports', 'opposes']) if (gs[k] && !found.grokipedia[k]) found.grokipedia[k] = { title, url: g.url, sentence: gs[k] };
    if (found.wikipedia.supports && found.grokipedia.supports) break;
  }
  const sources = [];
  for (const [name, f] of Object.entries(found)) for (const stance of ['supports', 'opposes']) if (f[stance]) sources.push({ name: SOURCE_NAMES[name], stance, ...f[stance] });
  const yes = sources.filter(s => s.stance === 'supports'), no = sources.filter(s => s.stance === 'opposes');
  const verdict = yes.length && !no.length ? 'CHECKED' : 'GUESS';
  const why = yes.length && no.length ? 'sources disagree' : yes.length ? `${yes.map(s => s.name).join(' and ')} say${yes.length > 1 ? '' : 's'} this`
    : no.length ? `${no.map(s => s.name).join(' and ')} say${no.length > 1 ? '' : 's'} otherwise; still a guess, never false` : 'not found';
  return { verdict, why, sources: verdict === 'CHECKED' ? yes : sources, tried: titles };
}
