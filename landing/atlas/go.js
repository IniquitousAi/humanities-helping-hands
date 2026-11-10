const id = decodeURIComponent(location.hash.slice(1)), q = new URLSearchParams();
if (id) q.set('fact', id);
const level = new URLSearchParams(location.search).get('level');
if (level) q.set('level', level);
location.replace('/book/' + (q.size ? '?' + q : ''));
