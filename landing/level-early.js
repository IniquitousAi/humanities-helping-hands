(function () { var L = ['kids', 'everyone', 'technical'], v = null;
  try { v = new URLSearchParams(location.search).get('level'); if (L.indexOf(v) < 0) v = localStorage.getItem('hhh-level'); } catch (e) {}
  if (L.indexOf(v) >= 0) document.documentElement.dataset.level = v; })();

