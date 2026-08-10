# Aurora Goods — Optimizely demo storefront

A tiny, self-contained static website for a fictional brand, **Aurora Goods**.
It's a demo storefront with a deliberate mix of page elements and scenarios —
handy for building and testing **Optimizely Web Experimentation** experiments and
**Optimizely Feature Experimentation (FX)** flags.

No build step, no server, no runtime dependencies beyond the Optimizely snippet
you paste in and (optionally) Playwright for the read-only probe.

## Pages
| File | What it is |
|------|-----------|
| `index.html` | Home — hero + CTA, a featured section, a desktop-only banner, action buttons, a dynamically loaded slot, a sign-up form, a small gallery, and an announcements line |
| `product.html` | A second product page with its own heading and a path into the purchase flow |
| `checkout.html` | Checkout — a purchase button carrying a parseable order value (demo only; no real payment) |
| `spa.html` | Single-page navigation using hash routes (`#/home`, `#/details`) with no full reload |
| `csp.html` | The Home layout served under a strict `Content-Security-Policy` |
| `consent.html` | A mock consent banner that keeps analytics/experimentation dormant until accepted |
| `redirect-target.html` | A landing page for redirect experiments that shows any preserved query params |
| `fx.html` | Loads the Optimizely FX JavaScript SDK, runs `decide()`, and renders a variation |
| `mock-gtm.js` | A stand-in third-party script that updates a couple of shared elements after load |
| `late-inject.js` | Same-origin helper that adds an element on `csp.html` (inline scripts are CSP-blocked) |
| `styles.css` | Minimal styling; pages are kept tall so the footer sits below the fold |
| `probe.js` | Optional Node + Playwright script that reads Optimizely state from a page |

## 1. Deploy to GitHub Pages
1. Push this folder to a GitHub repo.
2. **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.
3. Your site appears at `https://<user>.github.io/<repo>/`. All links and assets are
   relative, so the site works correctly under a project subpath. GitHub Pages is
   HTTPS, which the Optimizely snippet requires.

## 2. Add your Optimizely snippet
- **Web:** copy your Web project's snippet and paste it into the
  `PASTE YOUR OPTIMIZELY WEB SNIPPET HERE` placeholder in the `<head>` of **every**
  HTML page (synchronous, before `styles.css`). An optional hiding/anti-flicker
  snippet goes in the placeholder just above it.
- Point each experiment's **URL Targeting** at your github.io URL(s).
- **FX:** edit `fx.html` and set `SDK_KEY`, `FLAG_KEY`, and `USER_ID` to your project's values.

## 3. Page features
| Page | Element | Feature |
|------|---------|---------|
| index | `#hero-title`, `[data-testid=hero-cta]` | a heading and a hero CTA with stable hooks |
| index | `.sc-1a2b3c4` / nested `span` | a button with an auto-generated class name; a deeply nested label |
| index | `#hero-img` vs `#footer-note` | a large above-the-fold image; a below-the-fold note |
| index | `.desktop-only` | a desktop-only banner (hidden under 640px) |
| index | `#cta-click`, `#custom-evt`, `#signup` | a click button, a custom-event button, a sign-up form |
| index | `#late-slot` → `#late-el` | a slot filled by script ~1.5s after load |
| index | `#a11y-img`, `#low-contrast`, `#unlabeled` | an image without alt, a low-contrast button, an unlabeled input |
| index | `#tp-target` + `mock-gtm.js` | text updated by a separate third-party-style script |
| product | `#product-title`, `#add-cart` | a second-page heading and an add-to-cart button |
| checkout | `#buy` (`data-revenue`) | a purchase button with a parseable order value (demo only) |
| spa | hash routes + `#late-el` | client-side navigation without a reload |
| csp | strict CSP meta | the same layout under a strict Content-Security-Policy |
| consent | consent banner, `window.__consent` | actions gated until consent is accepted |
| redirect-target | `#qp` | shows query params preserved through a redirect |
| fx | `#fx-decision`, `#fx-variables`, `?optimizely_force=` | FX `decide()`, flag variables, forced decision |

## 4. Redirect & forcing quick notes
- **Redirect experiment:** target `redirect-target.html`; enable "preserve query params" and confirm `utm_*` appear under *Query parameters received*.
- **Force a Web variation:** append `?optimizely_x=<VARIATION_ID>`.
- **Force an FX flag:** append `?optimizely_force=<FLAG_KEY>:<VARIATION_KEY>`.

## 5. Run the optional probe
```bash
npm i -D playwright && npx playwright install chromium
node probe.js "https://<user>.github.io/<repo>/index.html"
```
Prints the project id, known/active experiments, variation map, selector counts,
FX decision/variables/revision, shared-element ownership, consent state, and
request timings.
