(function (root) {
  var HEX = /^[0-9a-f]{64}$/, HEX_PROBE = new Array(65).join('0');
  function withHash(href, hash) {
    if (!HEX.test(hash || '')) return href;
    var u;
    try { u = new URL(href); } catch (e) { return href; }
    if (u.protocol !== 'https:' || u.hostname !== 'buy.stripe.com') return href;
    u.searchParams.set('client_reference_id', hash);
    return u.toString();
  }
  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  root.HHHPay = { withHash: withHash, hex: hex };
  if (typeof document === 'undefined') return;
  var form = document.getElementById('pay-file'), input = document.getElementById('pay-pick'), said = document.getElementById('pay-said');
  var keys = Array.prototype.slice.call(document.querySelectorAll('a.plan-go')).filter(function (a) { return withHash(a.href, HEX_PROBE) !== a.href; });
  if (!form || !input || !said || !keys.length) return;
  form.hidden = false;
  var hash = '';
  keys.forEach(function (a) {
    a.dataset.bare = a.href;
    a.addEventListener('click', function (e) {
      if (hash) return;
      e.preventDefault();
      said.textContent = 'Pick your file first: the pay link carries its fingerprint, so we know which file you paid for.';
      input.focus();
    });
  });
  input.addEventListener('change', function () {
    var f = input.files && input.files[0];
    if (!f) return;
    if (!root.crypto || !root.crypto.subtle) { said.textContent = 'This browser cannot work out the fingerprint: email us the file instead.'; return; }
    said.textContent = 'Working out the fingerprint...';
    f.arrayBuffer().then(function (b) { return root.crypto.subtle.digest('SHA-256', b); }).then(function (d) {
      hash = hex(d);
      keys.forEach(function (a) { a.href = withHash(a.dataset.bare, hash); });
      said.textContent = 'Ready: the pay buttons now carry the fingerprint of ' + f.name + ' (SHA-256 ' + hash.slice(0, 12) + '...). Send this same file after you pay.';
    }).catch(function () { said.textContent = 'The file could not be read: pick it again.'; });
  });
})(typeof window !== 'undefined' ? window : globalThis);
