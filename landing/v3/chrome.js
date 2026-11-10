
export const START = '<!-- chrome: written by bake.mjs from chrome.js -->', END = '<!-- /chrome -->';

const TWIN = {
  index: ['kids.html', 'index.html', 'tech.html'], kids: ['kids.html', 'index.html', 'tech.html'], tech: ['kids.html', 'index.html', 'tech.html'],
  check: ['kids.html', 'check.html', 'tech-check.html'], 'tech-check': ['kids.html', 'check.html', 'tech-check.html'],
  atlas: ['kids.html', 'atlas.html', 'tech-atlas.html'], 'tech-atlas': ['kids.html', 'atlas.html', 'tech-atlas.html'],
  open: ['kids.html', 'open.html', 'tech-open.html'], 'tech-open': ['kids.html', 'open.html', 'tech-open.html'],
  book: ['book.html?level=kids', 'book.html', 'book.html?level=technical'],
  plans: ['kids.html', 'plans.html', null], founders: ['kids.html', 'founders.html', null],
};
export const LINKS = {
  everyone: [['check', 'check.html', 'Check'], ['atlas', 'atlas.html', 'Atlas'], ['open', 'open.html', 'Open problems'], ['plans', 'plans.html', 'Plans'], ['book', 'book.html', 'The Book'], ['founders', 'founders.html', 'Founders']],
  technical: [['tech', 'tech.html', 'Console'], ['tech-check', 'tech-check.html', 'Check'], ['tech-atlas', 'tech-atlas.html', 'Receipts'], ['tech-open', 'tech-open.html', 'Open problems'], ['plans', 'plans.html', 'Plans'], ['founders', 'founders.html', 'Founders']],
  kids: [],
};

export const ABOUT = {
  index: 'Paste any claim or AI answer. A machine checks each part and gives it a label, with a receipt anyone can rerun.',
  kids: 'Is it true? A robot checks sums and says yes or no, for kids.',
  tech: 'The checker at work: parse, formalize, check, stamp. Lean-proven facts, an MCP server for AI agents, and the label rules.',
  check: 'Check a claim: sums, fractions, decimals, percents, units and primes, and the facts in the Atlas, come back proven or false with a receipt; anything else says Not checked.',
  'tech-check': 'Run the site\'s checker engine: exact-fraction arithmetic, unit conversions, rounding, primality and word-for-word Atlas matches, each with a SHA-256 receipt.',
  atlas: 'Every fact a machine has proven, in plain words, with what was checked and who proved it.',
  'tech-atlas': 'Every checked fact with the exact statement the machine saw, the Lean theorem name and the checker.',
  open: 'P vs NP in small steps: every published attempt and where it broke, open for anyone to trace.',
  'tech-open': 'Every published P vs NP attempt, traced to the step that fails, with the source of each break.',
  plans: 'Pay only for a signed stamp or checks done for you: One Stamp $1, Checker $10 a month, Proven Standing $99 a month.',
  book: 'The Book: the proven facts read like a book, at a kids, everyone or technical reading level.',
  founders: 'The Founders: every name earned its seat with work a machine accepted. How to pitch in.',
};
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export function head(page, title) {
  const d = attr(ABOUT[page] || ABOUT.index);
  const url = `https://humanitieshelpinghands.com/v3/${page === 'index' ? '' : page + '.html'}`;
  return `<meta name="description" content="${d}"><meta name="referrer" content="no-referrer"><link rel="canonical" href="${url}"><meta property="og:url" content="${url}">
<meta property="og:title" content="${attr(title)}"><meta property="og:description" content="${d}"><meta property="og:image" content="https://humanitieshelpinghands.com/og.png"><meta name="twitter:card" content="summary_large_image">`;
}

export function bar(page, mode) {
  const home = { kids: 'kids.html', everyone: 'index.html', technical: 'tech.html' }[mode];
  const sub = { kids: 'For kids', everyone: 'Humanities Helping Hands', technical: 'Technical' }[mode];
  const twin = TWIN[page] || TWIN.index, links = LINKS[mode];
  const cta = mode === 'technical' ? '<a class="btn btn-main" href="tech.html#api">Connect over MCP</a>'
    : mode === 'everyone' ? '<a class="btn btn-main" href="check.html">Check a claim</a>' : '';
  return `<a class="skip" href="#main">Skip to the page</a><div class="ambient" aria-hidden="true"></div>
<header class="bar"><div class="wrap bar-in">
  <a class="brand" href="${home}"><b>HHH</b><span>${sub}</span></a>
  ${links.length ? `<nav class="links" aria-label="Pages">${links.map(([id, href, word]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ''}>${word}</a>`).join('')}</nav>` : ''}
  <nav class="modes${links.length ? '' : ' u-push'}" aria-label="Reading level">${['Kids', 'Everyone', 'Technical'].map((w, i) => twin[i] ? `<a href="${twin[i]}"${['kids', 'everyone', 'technical'][i] === mode ? ' aria-current="page"' : ''}>${w}</a>` : '').join('')}</nav>
  ${cta}
</div></header>`;
}

export function foot(mode) {
  return `<footer class="foot"><div class="wrap foot-in"><b>HHH</b><span>Open to read and use. Pay only for a stamp or a check.</span>
  <nav class="foot-links" aria-label="Site">${mode === 'kids' ? '<a href="index.html">For grown-ups</a>' : ''}<a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/support/">Support</a><a href="/verify/">Check a stamp</a></nav>
  <span class="credit">Daniel Steadham, Humanities Helping Hands</span></div></footer>`;
}
