(function () {
  var el = document.getElementById('pay-mode'); if (!el) return;
  var s = new URLSearchParams(location.search).get('session_id') || '';
  if (/^cs_test_\w+$/.test(s)) el.textContent = "TEST MODE: this was Stripe's test checkout. No real money moved.";
  else if (/^cs_live_\w+$/.test(s)) el.textContent = 'Your payment went through. Your order number is ' + s.slice(-8) + '.';
  else return;
  el.hidden = false;
})();
