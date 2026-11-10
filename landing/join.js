const form = document.getElementById('join'), done = document.getElementById('join-done');
if (form && done) form.addEventListener('submit', e => {
  const hp = document.getElementById('join-hp');
  if (hp && hp.value) { e.preventDefault(); return; }
  done.hidden = false;
  fetch('/hit?event=join', { method: 'POST', keepalive: true }).catch(() => {});
  form.querySelector('button').innerHTML = 'Opened<small>(finish in the new tab)</small>';
});
