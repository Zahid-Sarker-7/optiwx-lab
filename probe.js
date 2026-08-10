// probe.js — headless probe for QA'ing an Optimizely Web experiment on the testbed.
//
// Setup:  npm i -D playwright && npx playwright install chromium
// Usage:  node probe.js "https://<user>.github.io/<repo>/index.html"
//         (defaults to the placeholder URL below if no arg is given)
//
// Each block below maps to a QA check:
//   - request timing        -> flicker reasoning (page content vs cdn.optimizely.js)
//   - window.optimizely.get  -> snippet.read + activation
//   - selector counts        -> valid-selector / fragility sanity
//
// This is a read-only probe: it never clicks the revenue "Buy ($)" button.

const { chromium } = require('playwright');

// TODO: replace with your real GitHub Pages URL.
const url = process.argv[2] || 'https://YOUR-USER.github.io/YOUR-REPO/index.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // --- FLICKER TIMING ------------------------------------------------------
  // Record when each request FINISHES, relative to navigation start. We care
  // about when cdn.optimizely.js finishes vs when page content/images finish:
  // if content paints well before Optimizely resolves, expect flicker (FOOC)
  // unless the anti-flicker/hiding snippet is in place.
  const t0 = Date.now();
  const timings = [];
  page.on('requestfinished', (req) => {
    timings.push({ ms: Date.now() - t0, type: req.resourceType(), url: req.url() });
  });

  await page.goto(url, { waitUntil: 'networkidle' });

  // Give a late-injected element / async snippet activation a moment.
  await page.waitForTimeout(2000);

  // --- SNIPPET READ + ACTIVATION ------------------------------------------
  // Read the Optimizely client state directly from the page.
  const opti = await page.evaluate(() => {
    const o = window.optimizely;
    const data = o && o.get && o.get('data');
    const state = o && o.get && o.get('state');
    return {
      // snippet.read: is the project loaded and what is its id?
      projectId: data && data.projectId,
      // activation: which experiments does the snippet know about?
      experimentIds: data && data.experiments ? Object.keys(data.experiments) : null,
      // activation: which experiments are actually ACTIVE for this visitor?
      activeExperimentIds:
        state && state.getActiveExperimentIds ? state.getActiveExperimentIds() : null,
      // activation: variation assignment map (experiment -> variation).
      variationMap:
        state && state.getVariationMap ? state.getVariationMap() : null,
    };
  });

  // --- SELECTOR SANITY -----------------------------------------------------
  // Confirms a stable selector resolves and a bogus one does not.
  const selectors = await page.evaluate(() => ({
    doesNotExist: document.querySelectorAll('.does-not-exist').length, // expect 0
    heroCta: document.querySelectorAll('[data-testid=hero-cta]').length, // expect 1
  }));

  // --- FX SDK (fx.html) ----------------------------------------------------
  // Reads whatever the FX page rendered. Maps to: datafile freshness (revision),
  // variable validation, forced-decision handling, SDK presence/version.
  const fx = await page.evaluate(() => ({
    sdkPresent: typeof window.optimizelySdk !== 'undefined',
    decisionText: document.getElementById('fx-decision')?.textContent || null,
    revision: document.getElementById('fx-revision')?.textContent || null,
    variables: Array.from(document.querySelectorAll('#fx-variables li')).map((li) => li.textContent),
    ssrSlot: document.getElementById('ssr-slot')?.getAttribute('data-client-rendered') || null,
  }));

  // --- THIRD-PARTY MUTATION (index.html) -----------------------------------
  // Who last owns a shared element? Non-null data-owner => a 3rd-party tag
  // mutated it (conflict-detection check).
  const thirdParty = await page.evaluate(() => ({
    tpOwner: document.getElementById('tp-target')?.getAttribute('data-owner') || null,
    heroMutatedBy: document.getElementById('hero-title')?.getAttribute('data-mutated-by') || null,
  }));

  // --- CONSENT (consent.html) ---------------------------------------------
  // window.__consent should be 'pending'/'denied' until the banner is accepted;
  // events must not fire before 'granted'.
  const consent = await page.evaluate(() => window.__consent || null);

  console.log('=== Optimizely snippet / activation ===');
  console.log(JSON.stringify(opti, null, 2));
  console.log('\n=== Selector sanity ===');
  console.log(JSON.stringify(selectors, null, 2));
  console.log('\n=== FX SDK (fx.html) ===');
  console.log(JSON.stringify(fx, null, 2));
  console.log('\n=== Third-party mutation (index.html) ===');
  console.log(JSON.stringify(thirdParty, null, 2));
  console.log('\n=== Consent state (consent.html) ===');
  console.log(JSON.stringify({ consent }, null, 2));

  console.log('\n=== Request timings (flicker reasoning) ===');
  const optiReq = timings.find((t) => t.url.includes('cdn.optimizely.com'));
  console.log('cdn.optimizely finished at:', optiReq ? optiReq.ms + 'ms' : 'NOT REQUESTED');
  timings
    .filter((t) => t.type === 'document' || t.type === 'image' || t.url.includes('optimizely'))
    .sort((a, b) => a.ms - b.ms)
    .forEach((t) => console.log(`${String(t.ms).padStart(6)}ms  ${t.type}  ${t.url}`));

  await browser.close();
})();
