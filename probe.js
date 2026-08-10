// probe.js — a small headless script that reads Optimizely state from a page.
//
// Setup:  npm i -D playwright && npx playwright install chromium
// Usage:  node probe.js "https://<user>.github.io/<repo>/index.html"
//         (defaults to the placeholder URL below if no arg is given)
//
// What it prints:
//   - request timings         -> content vs the cdn.optimizely.js request
//   - window.optimizely.get   -> project id, known/active experiments, variations
//   - selector counts         -> a present selector vs a missing one
//   - FX SDK state, third-party mutation ownership, and consent state
//
// This is read-only: it never clicks the "Buy ($49.99)" button.

const { chromium } = require('playwright');

// Replace with your GitHub Pages URL (relative pages: index.html, product.html, ...).
const url = process.argv[2] || 'https://YOUR-USER.github.io/YOUR-REPO/index.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // --- REQUEST TIMING ------------------------------------------------------
  // Record when each request FINISHES, relative to navigation start, so you can
  // compare when cdn.optimizely.js finishes vs when page content/images finish.
  const t0 = Date.now();
  const timings = [];
  page.on('requestfinished', (req) => {
    timings.push({ ms: Date.now() - t0, type: req.resourceType(), url: req.url() });
  });

  await page.goto(url, { waitUntil: 'networkidle' });

  // Allow late-injected content / async snippet activation a moment.
  await page.waitForTimeout(2000);

  // --- OPTIMIZELY STATE ----------------------------------------------------
  // Read the Optimizely Web client state directly from the page.
  const opti = await page.evaluate(() => {
    const o = window.optimizely;
    const data = o && o.get && o.get('data');
    const state = o && o.get && o.get('state');
    return {
      projectId: data && data.projectId,
      experimentIds: data && data.experiments ? Object.keys(data.experiments) : null,
      activeExperimentIds:
        state && state.getActiveExperimentIds ? state.getActiveExperimentIds() : null,
      variationMap:
        state && state.getVariationMap ? state.getVariationMap() : null,
    };
  });

  // --- SELECTOR COUNTS -----------------------------------------------------
  // A present selector should resolve; a missing one should be zero.
  const selectors = await page.evaluate(() => ({
    doesNotExist: document.querySelectorAll('.does-not-exist').length, // expect 0
    heroCta: document.querySelectorAll('[data-testid=hero-cta]').length, // expect 1
  }));

  // --- FX SDK (fx.html) ----------------------------------------------------
  // Reads whatever the FX page rendered: SDK presence, decision, datafile
  // revision, variable list, and the client-rendered value.
  const fx = await page.evaluate(() => ({
    sdkPresent: typeof window.optimizelySdk !== 'undefined',
    decisionText: document.getElementById('fx-decision')?.textContent || null,
    revision: document.getElementById('fx-revision')?.textContent || null,
    variables: Array.from(document.querySelectorAll('#fx-variables li')).map((li) => li.textContent),
    clientRendered: document.getElementById('ssr-slot')?.getAttribute('data-client-rendered') || null,
  }));

  // --- SHARED-ELEMENT OWNERSHIP (index.html) -------------------------------
  // A non-null data-owner means the separate mock-gtm.js script updated it.
  const thirdParty = await page.evaluate(() => ({
    tpOwner: document.getElementById('tp-target')?.getAttribute('data-owner') || null,
    heroMutatedBy: document.getElementById('hero-title')?.getAttribute('data-mutated-by') || null,
  }));

  // --- CONSENT (consent.html) ---------------------------------------------
  // window.__consent stays 'pending'/'denied' until the banner is accepted.
  const consent = await page.evaluate(() => window.__consent || null);

  console.log('=== Optimizely snippet / experiments ===');
  console.log(JSON.stringify(opti, null, 2));
  console.log('\n=== Selector counts ===');
  console.log(JSON.stringify(selectors, null, 2));
  console.log('\n=== FX SDK (fx.html) ===');
  console.log(JSON.stringify(fx, null, 2));
  console.log('\n=== Shared-element ownership (index.html) ===');
  console.log(JSON.stringify(thirdParty, null, 2));
  console.log('\n=== Consent state (consent.html) ===');
  console.log(JSON.stringify({ consent }, null, 2));

  console.log('\n=== Request timings ===');
  const optiReq = timings.find((t) => t.url.includes('cdn.optimizely.com'));
  console.log('cdn.optimizely finished at:', optiReq ? optiReq.ms + 'ms' : 'NOT REQUESTED');
  timings
    .filter((t) => t.type === 'document' || t.type === 'image' || t.url.includes('optimizely'))
    .sort((a, b) => a.ms - b.ms)
    .forEach((t) => console.log(`${String(t.ms).padStart(6)}ms  ${t.type}  ${t.url}`));

  await browser.close();
})();
