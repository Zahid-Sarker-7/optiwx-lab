// mock-gtm.js — a stand-in for a third-party tag (Google Tag Manager,
// a personalization tool, a chat widget, etc.) that MUTATES the same DOM
// elements an Optimizely experiment might target.
//
// Purpose: exercise the "detect third-party tools mutating the same elements"
// check. It fights over #hero-title and #tp-target after the page loads, so a
// QA run should notice ownership churn / a potential visual conflict.
(function () {
  function mutate() {
    var hero = document.getElementById('hero-title');
    if (hero) {
      hero.setAttribute('data-mutated-by', 'mock-gtm');
      // Deliberately overwrites text an experiment may also change.
      hero.textContent = hero.textContent + ' ✨'; // append a sparkle
    }
    var tp = document.getElementById('tp-target');
    if (tp) {
      tp.setAttribute('data-owner', 'mock-gtm');
      tp.textContent = 'Mutated by mock-gtm at ' + new Date().toISOString();
    }
  }
  // Runs ~800ms after load — after the snippet's first pass, to simulate a
  // late third-party mutation that can clobber or race an Optimizely change.
  setTimeout(mutate, 800);
})();
