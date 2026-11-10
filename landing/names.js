const INSTALL = [
  [/\b(?:python3? -m )?pip3? install\s+((?:[^\s`;,]+[ \t]*)+)/gi, 'pypi'],
  [/\b(?:npm (?:install|i|add)|yarn add|pnpm (?:add|install|i))\s+((?:[^\s`;,]+[ \t]*)+)/gi, 'npm'],
];
const VALID = { pypi: /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/i, npm: /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/ };
const FILLER = new Set(('to install run use using with the a an you can by first then just command package packages library libraries '
  + 'module modules it them and or get add via your project in of for on pip pip3 python python3 npm yarn pnpm i m save dev g global upgrade u').split(' '));

const TAKES = /^(-[rceitf]|--(requirement|editable|constraint|index-url|extra-index-url|find-links|target|prefix|registry|tag|python-version|platform))$/;
const PLAIN = new Set(('install and or then to the a an for with in on if which that so from before after when is are was will it '
  + 'this these your you we first next also as at by into of package packages library module command instead too').split(' '));

export function findNames(said) {
  const out = [];
  for (const [re, registry] of INSTALL) for (const m of String(said).matchAll(re)) {
    let skip = false;
    for (let w of m[1].trim().split(/\s+/)) {
      if (skip) { skip = false; continue; }
      if (w.startsWith('-')) { skip = TAKES.test(w); continue; }
      const quoted = /^["']/.test(w);
      w = w.replace(/^["']+/, '').replace(/["'.)]+$/, '');
      w = registry === 'pypi' ? w.replace(/\[.*$/, '').replace(/[<>=!~].*$/, '') : w.replace(/(.)@[^/]*$/, '$1');
      if (!VALID[registry].test(w) || PLAIN.has(w.toLowerCase())) break;
      if (!out.some(o => o.registry === registry && o.name.toLowerCase() === w.toLowerCase())) out.push({ registry, name: w });
      if (quoted && !/["']$/.test(m[1].trim().split(/\s+/)[0])) break;
    }
  }
  return out;
}

export function onlyInstall(said, names) {
  const left = String(said).toLowerCase().replace(/`/g, ' ').replace(/(?:^|\s)-{1,2}[a-z-]+/g, ' ');
  const taken = new Set(names.map(n => n.name.toLowerCase()));
  return (left.match(/[@a-z0-9][a-z0-9._/@-]*/g) || []).map(w => w.replace(/[.)]+$/, '')).every(w => FILLER.has(w) || taken.has(w) || /^[\d.]+$/.test(w));
}

const URL_OF = {
  pypi: n => `https://pypi.org/pypi/${encodeURIComponent(n)}/json`,
  npm: n => `https://registry.npmjs.org/${n.startsWith('@') ? '@' + encodeURIComponent(n.slice(1)) : encodeURIComponent(n)}/latest`,
};
const PAGE_OF = { pypi: n => `https://pypi.org/project/${encodeURIComponent(n)}/`, npm: n => `https://www.npmjs.com/package/${n}` };
export const REGISTRY = { pypi: 'PyPI', npm: 'npm' };

export async function checkNames(said, get) {
  const names = findNames(said);
  if (!names.length) return { verdict: 'GUESS', why: 'no package name found to check', names: [] };
  const seen = [];
  for (const n of names) {
    const r = await get(URL_OF[n.registry](n.name));
    if (r.status !== 200 && r.status !== 404) throw new Error(`${REGISTRY[n.registry]} did not answer`);
    const version = r.status === 200 ? String((r.json && (r.json.info ? r.json.info.version : r.json.version)) || '') : '';
    seen.push({ ...n, found: r.status === 200, version, url: PAGE_OF[n.registry](n.name) });
  }
  const missing = seen.filter(n => !n.found), list = s => s.map(n => `"${n.name}"`).join(', ');
  if (missing.length) return { verdict: 'GUESS', names: seen,
    why: `${REGISTRY[missing[0].registry]} has no package named ${list(missing)}: this name may be made up; still a guess, which never means false` };
  const where = [...new Set(seen.map(n => REGISTRY[n.registry]))].join(' and ');
  if (onlyInstall(said, names)) return { verdict: 'CHECKED', names: seen, why: `${where} lists ${list(seen)}: the package name is real` };
  return { verdict: 'GUESS', names: seen, why: `${where} lists ${list(seen)}, so the name is real; the rest of the claim is still a guess` };
}
