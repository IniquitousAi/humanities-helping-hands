export const SOURCES = { general: 'an encyclopedia', history: 'dated records', science: 'science references', health: 'medical references',
  tech: 'official software documentation' };

const STORY = /^[“"][^”"]*$|^[^“"]*[.?!,][”"]|\([a-z ]+\)\s*[“"]|[“"«](?:[^”"»\s]+\s+){3,}[^”"»]*[,.!?…][”"»]|\b(said|says|asked|replied|shouted|cried|exclaimed)\b,?\s*[“"]|[”"],?\s+(he|she|I|they|we) (said|asked|replied)\b|\[[a-z ]+\]|\/imagine|--ar\b|\bFADE\b|^[A-Z]{3,}\b(?! [a-z])|\b(scene|atmosphere|glow\w*|shadows?|gaz\w+|smil\w+|whisper\w*|tears|composition|panel \d)\b/;
const PERSON = /(?<!War )\b(I|I'm|I'd|I'll|I've|[Mm]e|[Mm]y|[Ww]e|[Ww]e'll|[Ww]e're|[Oo]ur|us)\b(?! knowledge cutoff)/;
const NARRATIVE = /\b(he|she|his|her|him|herself|himself)\b/i;
const OWN_CODE = /```|\b(this|your) (\w+ )?(script|function|code|snippet|button|table|file|program|query|loop|example|dataset)\b|\bthe \w+ (table|button|snippet|dataset)\b/i;
const IMPERATIVE = /^(?:[\w ]{2,40}:\s*)?(practice|tailor|create|visit|attend|test|join|be|seek|leave|ensure|use|try|make|keep|consider|start|look|review|stay|remember|avoid|check|add|set|install|open|go|let's|don't|do|take|support|promote|build|improve|focus|allocate|provide|implement|integrate|develop|introduce|apply|follow)\b/i;
const OPINION = /\b(should|must|crucial|important|essential|(?:is|are) key|better|best|worst|great|amazing|incredible|beautiful|vital|may|might|could|can help|helps?|ensur\w+|consider|recommend\w*|it's|perfect|ideal|significant\w*|powerful|effective\w*|valuable|enhanc\w+|often|overall|in conclusion|in summary)\b/i;
const FACTY = /\b(is|are|was|were|has|have|had|became|stores?|uses?|developed|founded|invented|introduced|marked|signaled|knocked|requires?|contains?|consists?|refers?|means?|occurs?|causes?|produces?|share[sd]?|enables?|is sent|commonly|becomes?|raises?|left|impacts?)\b/i;
const NAMED = /\s[A-Z][a-z]{2,}|\b(1[0-9]{3}|20[0-9]{2})s?\b|\b[A-Z]{2,}\b/;
export const RULES = { STORY, PERSON, NARRATIVE, OWN_CODE };

const KINDS = [
  ['history', /\b(1[0-9]{3}|20[0-9]{2})s?\b|\b(century|war|empire|king|queen|president|founded|born|died|treaty|ancient|dynasty|playoffs|signaled|was introduced|marked)\b/i],
  ['health', /\b(health|disease|symptom\w*|medic\w+|patient|drug|dose|blood|heart|stress|anxiety|depress\w*|therap\w+|infect\w*|vitamin|diet|sleep)\b/i],
  ['tech', /\b(java|jvm|python|javascript|api|socket|sigpipe|hibernate|uuid|sql|http|linux|windows|compiler|classloader|database|server|software|algorithm)\b/i],
  ['science', /\b(genetic\w*|species|primates?|cells?|atoms?|molecul\w+|energy|gravity|orbit\w*|electro\w+|chemical|physics|biolog\w+|evolution\w*|climate|battery)\b/i],
];

export const notAClaim = said => /fragment or a question/.test(sortClaim(said).why);

export function sortClaim(said) {
  const s = String(said || '').trim().replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').replace(/^[A-Z][\w'()-]*(?: [\w'()-]+){0,4}:\s+(?=\S)/, ''), words = s.split(/\s+/).filter(w => /[A-Za-z]/.test(w));
  if (s.split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w)).length < 3 || /\?\s*$/.test(s) || /^\W*\d+\.?\s*$/.test(s)) return { kind: 'none', why: 'not a claim (a fragment or a question)' };
  const letters = s.match(/\p{L}/gu) || [], other = letters.filter(c => !/\p{Script=Latin}/u.test(c)).length;
  if (other >= 3 && other * 3 > letters.length) return { kind: 'none', why: 'not a claim this page can read yet (not English)' };
  if (STORY.test(s)) return { kind: 'none', why: 'not a claim (story, dialogue or a scene)' };
  if (OWN_CODE.test(s) && !/\b(SIGPIPE|JVM)\b/.test(s)) return { kind: 'none', why: 'not a claim about the world (about your own code or text)' };
  if (IMPERATIVE.test(s)) return { kind: 'opinion', why: 'advice, not a claim' };
  if (PERSON.test(s)) return { kind: OPINION.test(s) ? 'opinion' : 'none', why: OPINION.test(s) ? 'advice, not a claim' : 'not a claim (talk between people)' };
  if (OPINION.test(s)) return { kind: 'opinion', why: 'an opinion or advice, not a checkable claim' };
  if (NARRATIVE.test(s) && !/\b(1[0-9]{3}|20[0-9]{2})\b/.test(s)) return { kind: 'none', why: 'not a claim (story)' };
  const topic = KINDS.find(([, re]) => re.test(s));
  if (!FACTY.test(s) || !(NAMED.test(s) || topic)) return { kind: 'none', why: 'not a claim (a description, nothing a source could settle)' };
  const kind = (topic || ['general'])[0];
  return { kind, why: `a claim; ${SOURCES[kind]} would settle it` };
}
