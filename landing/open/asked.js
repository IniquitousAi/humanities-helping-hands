import { getJSON, failed } from '../getjson.js';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

export function rows(questions) {
  return questions.map(q => {
    const r = el('div', 'row'), d = el('div');
    d.append(el('b', null, q.text), el('small', null, ` asked ${q.n} ${q.n === 1 ? 'time' : 'times'}, last on ${q.last}`));
    r.append(el('span', 'tag open', 'OPEN'), d);
    return r;
  });
}

export async function show(box) {
  let d = null;
  try { d = await getJSON('/api/asked', { shape: d => Array.isArray(d?.questions) }); } catch { failed(box, 'The list of asked questions', '/api/asked', () => show(box)); return; }
  if (!d.questions.length) { box.replaceChildren(el('p', null, 'Nobody has added a search yet. When the box on the front page finds no fact, it offers to add it here.')); return; }
  box.replaceChildren(...rows(d.questions));
}

if (typeof document !== 'undefined' && document.getElementById('asked-list')) show(document.getElementById('asked-list'));
