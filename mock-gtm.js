// mock-gtm.js — a stand-in for a third-party tag (a tag manager, a
// personalization tool, a chat widget, etc.) that updates the same DOM
// elements a page experiment might also change.
//
// It updates #hero-title and #tp-target shortly after the page loads, which is
// handy for seeing how a page behaves when more than one script touches the
// same elements.
(function () {
  function update() {
    var hero = document.getElementById('hero-title');
    if (hero) {
      hero.setAttribute('data-mutated-by', 'mock-gtm');
      hero.textContent = hero.textContent + ' ✨'; // append a sparkle
    }
    var tp = document.getElementById('tp-target');
    if (tp) {
      tp.setAttribute('data-owner', 'mock-gtm');
      tp.textContent = 'Updated by mock-gtm at ' + new Date().toISOString();
    }
  }
  // Runs ~800ms after load, simulating a late third-party update.
  setTimeout(update, 800);
})();
