# Optimizely Web Testbed

A tiny, self-contained static site for testing **Optimizely Web** (and a page for
**Feature Experimentation / FX**) experiments end to end. It's a generic
"Optimizely page with an injectable snippet" you can point any experiment at —
useful for QA, demos, snippet/preview learning, or reproducing edge cases.

No build step, no server, no runtime dependencies beyond the Optimizely snippet
you paste in and (optionally) Playwright for the probe.

## What's here
| File | Purpose |
|------|---------|
| `index.html` | Home — hero, stable + fragile selectors, events, late injection, a11y + third-party sections |
| `product.html` | Second page — URL targeting, page events, funnel step 1 |
| `checkout.html` | Funnel end — revenue button with a parseable `data-revenue` value |
| `spa.html` | SPA — `history.pushState` routing, late-injected element |
| `csp.html` | Home clone under a strict `Content-Security-Policy` meta |
| `consent.html` | Mock CMP banner that gates experimentation/events until accepted |
| `redirect-target.html` | Destination for redirect experiments (shows surviving query/UTMs) |
| `fx.html` | FX JS SDK: `decide()`, forced-decision param, variables, revision |
| `mock-gtm.js` | Stand-in third-party tag that mutates shared elements |
| `late-inject.js` | External late-injection script for `csp.html` (inline blocked by CSP) |
| `styles.css` | Minimal styling; pages kept tall so the footer is below the fold |
| `probe.js` | Node + Playwright headless reader of snippet / FX / selectors |

## 1. Deploy to GitHub Pages
1. Push this folder to a GitHub repo.
2. **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.
3. Site: `https://<user>.github.io/<repo>/` (pages at `/index.html`, `/fx.html`, …). Pages is HTTPS, which the snippet requires.

## 2. Paste your Optimizely snippet
- **Web:** copy your Web project's snippet and paste it into the
  `PASTE YOUR OPTIMIZELY WEB SNIPPET HERE` placeholder in the `<head>` of **every**
  HTML page (synchronous, before `styles.css`). Optional hiding/anti-flicker
  snippet goes in the placeholder just above it.
- Point each experiment's **URL Targeting** at the github.io URL(s) above.
- **FX:** edit `fx.html` and set `SDK_KEY`, `FLAG_KEY`, `USER_ID` to your FX project's values.

## 3. Element / page → scenario
| Page | Element | Scenario |
|------|---------|----------|
| index | `#hero-title`, `[data-testid=hero-cta]` | stable selectors |
| index | `.sc-1a2b3c4` / nested `span` | fragile / nth-child selectors |
| index | `#hero-img` vs `#footer-note` | flicker (above vs below fold) |
| index | `.desktop-only` | device-matrix no-op (hidden < 640px) |
| index | `#cta-click`, `#custom-evt`, `#signup` | click / custom event / conversion |
| index | `#late-slot` → `#late-el` | late-injected element / selector timing |
| index | `#a11y-img`, `#low-contrast`, `#unlabeled` | accessibility issues (alt, contrast, label) |
| index | `#tp-target`, `#hero-title` + `mock-gtm.js` | third-party mutation / conflict |
| product | `#product-title`, `#add-cart` | URL targeting + funnel step 1 |
| checkout | `#buy` (`data-revenue`) | revenue value — **do not actually buy** |
| spa | pushState routes + `#late-el` | SPA (re)activation timing |
| csp | strict CSP meta | CSP blocking injected scripts / websockets |
| consent | CMP banner, `window.__consent` | events firing before consent |
| redirect-target | `#qp` | redirect target resolves, UTMs survive, no loop |
| fx | `#fx-decision`, `#fx-variables`, `?optimizely_force=` | FX decide / forced decision / variables |

## 4. Redirect & forcing quick notes
- **Redirect experiment:** target `redirect-target.html`; enable "preserve query params" and confirm `utm_*` show under *Query parameters received*.
- **Force a Web variation:** append `?optimizely_x=<VARIATION_ID>`.
- **Force an FX flag:** append `?optimizely_force=<FLAG_KEY>:<VARIATION_KEY>`.

## 5. Run the probe
```bash
npm i -D playwright && npx playwright install chromium
node probe.js "https://<user>.github.io/<repo>/index.html"
```
Prints projectId, known/active experiments, variation map, selector counts,
FX decision/variables/revision, third-party mutation ownership, consent state,
and request timings (flicker reasoning).
