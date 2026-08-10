// External late-injection script for csp.html.
// Inline scripts are blocked by the strict CSP on that page (script-src has no
// 'unsafe-inline'), so the late element must be injected from a same-origin file.
// Fills #late-slot with #late-el after 1500ms (selector-timing / SPA check under CSP).
setTimeout(function () {
  var slot = document.getElementById('late-slot');
  if (slot) slot.innerHTML = '<span id="late-el">late</span>';
}, 1500);
