// External late-injection script for csp.html.
// Inline scripts are blocked by the strict CSP on that page (script-src has no
// 'unsafe-inline'), so the element is added from a same-origin file instead.
// Fills #late-slot with #late-el ~1.5s after load.
setTimeout(function () {
  var slot = document.getElementById('late-slot');
  if (slot) slot.innerHTML = '<span id="late-el">Loaded</span>';
}, 1500);
