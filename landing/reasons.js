import { notAClaim } from './sorter.js';

const MEASURE = String.raw`(?:kg|g|grams?|kilograms?|km|m|cm|mm|meters?|metres?|kilometers?|kilometres?|miles?|feet|foot|ft|inches|inch|yards?|yd|lbs?|pounds?|ounces?|oz|tons?|tonnes?|stones?|liters?|litres?|l|ml|gallons?|quarts?|pints?|cups?|calories?|kcal|cal|kj|j|joules?|watts?|w|kw|kwh|hp|mph|kph|km\/h|knots?|hours?|hrs?|minutes?|mins?|seconds?|secs?|s|days?|weeks?|months?|years?|people|persons?|times|percent|degrees?|acres?|hectares?|steps?|words?|pages?|bytes?|kb|mb|gb|tb|mg|sq|dollars?|euros?|cents?|usd|eur|gbp|yen|rupees?|pesos?)\b|%|°`;
const LED = String.raw`(?<=\b(?:in|since|until|till|year|circa|ca\.|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec)\.?,?\s+)`;
const YEAR = String.raw`(?:${LED}(?:1[0-9]{3}s?|20[0-2][0-9])(?!\d)|(?<![\d,.$€£])(?:1[0-9]{3}s?|20[0-2][0-9])(?!\d|,\d|\.\d)(?!\s*(?:${MEASURE})))`;
const KINDS = [
  ['predictions', /\b(will|going to|expect(?:ed|s)?|forecast|likely to|by 20\d\d)\b/i],
  ['health and medical facts', /\b(health|healthy|doctors?|diseases?|symptoms?|medicines?|medical|drugs?|doses?|calories?|protein|vitamins?|blood|heart|skin|body|bones?|hydrat\w*|drink\w*|diet|nutrition|sleep|exercise|safe to eat|food poisoning|undercook\w*|thermometer|turkey|meat|eggs?)\b/i],
  ['opinions and advice', /\b(should|best|better|worse|recommend\w*|good for|bad for|worth|ideal|i think|great|important|enough|plenty|need to|try to)\b/i],
  ['history (dates and events)', new RegExp(String.raw`\b(?:${YEAR}|(?:century|war|wars|born|died|founded|empire|king|queen|president|first person|history|historic\w*|ancient|surrender\w*|treaty|landed|invaded)\b)`, 'i')],
  ['science explanations', /\b(because|causes?|caused|due to|why|how|tilt\w*|gravity|orbits?|energy|reactions?|evolv\w*|atoms?|molecules?|pressure|temperature|seasons?)\b/i],
  ['past exact arithmetic', /^(?=.*\d)(?=.*[=<>≤≥≠])(?:[\s\d+\-*/^().,%<>=!≤≥≠−×÷·]|\bmod\b)+$/i],
  ['measured facts (counts, sizes, distances)', /\d/],
];
const SOURCES = 'settled by sources, not by math; look it up below';
const NEXT = { predictions: 'only time settles it; look it up below to see who expects it',
  'opinions and advice': 'a matter of taste or advice; look it up below to see who agrees',
  'past exact arithmetic': 'this checker reads + - * / ^ and one comparison, not mod, % or a chain like 1 < 2 < 3; work it out by hand' };
export const QUESTION = 'a question, not a claim to check; look it up below, or write it as a sentence to check that sentence';
export function guessWhy(said) {
  const s = String(said || '');
  if (notAClaim(s)) return /\?\s*$/.test(s) && (s.match(/[A-Za-z]{2,}/g) || []).length >= 3 ? QUESTION : 'not a claim to check (a list number, a fragment or a question); nothing to look up';
  const kind = (KINDS.find(([, re]) => re.test(s)) || ['everyday facts'])[0];
  return `${kind}: ${NEXT[kind] || SOURCES}`;
}
export const GENERIC = /no check can run this yet|could not run$|\byet\b|no checker|^$/;
