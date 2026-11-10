import { readable } from './checker.js';

export const MAX_TEXT = 6000, MAX_CLAIMS = 25;
const SPLIT = n => `Split the answer below into its separate factual claims. Reply with only one JSON list, no other text:
[{"said": "<the claim in the answer's own words, short>", "form": "<checker form or null>"}]

"form" is null unless the answer itself states something in exactly one of these forms:
- arithmetic the answer asserts, written as an equation or inequality of plain numbers: "17 * 23 = 391", "2^10 > 1000"
- a rounded number the answer gives, written as the exact calculation ~= the number exactly as the answer rounded it:
  "10000 * 1.07^10 ~= 19671.51", "(325 - 32) * 5 / 9 ~= 163", "2^100 ~= 1.2677 * 10^30". Unit conversions only with exact
  factors (1 mile = 1.609344 km, 1 foot = 0.3048 m, 1 US cup = 0.2365882365 liters, F to C = (F - 32) * 5 / 9).
  Every form is plain numbers and math signs only: no unit letters, no $ or %, no words ("2.7 / 0.2365882365 ~= 11", never "2.7 L / ...")
  The one exception is these exact defined constants, by name: c (speed of light, m/s), au (Sun-Earth mean distance, m), year
  (Julian, s), lightyear (m), day (s), g0 (standard gravity), atm (Pa), mile, foot, inch (m), pound (kg), gallon (US, liters):
  "c = 299792458", "au / 1000 ~= 149600000" (km), "au / mile ~= 93000000", "au / c ~= 500" (seconds of light travel)
- a primality claim the answer makes: "91 is not prime", "2^61 - 1 is prime"
Never fill in a form the answer does not state, never correct the answer. At most ${n} claims.

ANSWER:
`;
const SCHEMA = { type: 'array', items: { type: 'object', properties: { said: { type: 'string' }, form: { type: ['string', 'null'] } }, required: ['said', 'form'] } };

export function parseReply(reply, text) { return parse(reply, text); }
function parse(reply, text) {
  const s = String(reply), a = s.indexOf('['), b = s.lastIndexOf(']');
  if (a < 0 || b < a) throw new Error('the AI did not reply with a list of claims');
  return JSON.parse(s.slice(a, b + 1)).slice(0, MAX_CLAIMS)
    .map(r => ({ said: String(r.said || '').trim().slice(0, 300), form: readable(r.form, text) }))
    .filter(r => r.said);
}

export async function builtinReady() {
  try { if (!('LanguageModel' in self)) return false; return (await self.LanguageModel.availability()) !== 'unavailable'; } catch { return false; }
}
export async function splitBuiltin(text, onProgress) {
  const session = await self.LanguageModel.create({
    monitor(m) { m.addEventListener('downloadprogress', e => onProgress && onProgress(e.loaded)); },
  });
  try { return parse(await session.prompt(SPLIT(MAX_CLAIMS) + text, { responseConstraint: SCHEMA }), text); }
  finally { session.destroy && session.destroy(); }
}

export const PROVIDERS = {
  anthropic: { model: 'claude-haiku-5-5', async ask(key, model, prompt) {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: {
      'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }) });
    const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || `Anthropic said ${r.status}`);
    return j.content.map(c => c.text || '').join('');
  } },
  openai: { model: 'gpt-4.1-mini', async ask(key, model, prompt) {
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: {
      'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }) });
    const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || `OpenAI said ${r.status}`);
    return j.choices[0].message.content;
  } },
};
export async function splitOwn(text, provider, key, model) {
  const p = PROVIDERS[provider]; if (!p) throw new Error('pick a company');
  let reply;
  try { reply = await p.ask(key, model || p.model, SPLIT(MAX_CLAIMS) + text); }
  catch (e) {
    if (e instanceof TypeError) throw new Error('the AI company did not accept the connection from this page; check the key and the model name');
    throw e;
  }
  return parse(reply, text);
}
