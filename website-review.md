# Website Review: Security, Accessibility, and Usability

Reviewed: 2026-06-12 · Repo: `aywc-website-eleventy` (agniyogaworld.org) · Method: full manual source review (no files modified)

## Executive Summary

This is a well-built small static site. The fundamentals most static sites get wrong are already right here: security headers including a CSP are configured in `netlify.toml`, the templates use Nunjucks auto-escaping almost everywhere, there is a skip link, visible focus styles, reduced-motion support, labeled forms, and ARIA on every interactive widget. The issues that remain are concentrated and fixable.

- **Overall security risk: Medium** — one real DOM XSS sink (forum widget), an unpinned CMS bundle from unpkg, and a CSP that permits inline scripts.
- **Accessibility maturity: Good** — better than most production sites; remaining items are P2/P3 polish.
- **Usability maturity: Good** — clear purpose, clear CTAs; a few dead-end states and one no-JS gap.

**Top 5 issues to fix first**

1. DOM XSS in the forum "Recent Discussions" widget — forum topic titles are concatenated into `innerHTML` (`src/forum.njk:105–118`).
2. Decap CMS loaded from unpkg with a floating version and no SRI (`admin/index.html:17`) — supply-chain path to CMS credentials and main-branch commits.
3. CMS config drift: `admin/config.yml` is missing fields that exist in `src/_data/*.json` (notably `roerich.image`), so any CMS save of the About page silently deletes the Roerich image and other data.
4. 267 KB `seed-thoughts.js` shipped to every homepage visitor to display one quote per day.
5. Mobile navigation is completely inaccessible with JavaScript disabled (`.nav-links { display:none }` below 700px with a JS-only toggle).

## Repository Overview

- **Site type:** Static site, Eleventy 3.x + Nunjucks, deployed on Netlify (Node 22, `npm run build`, publishes `_site/`). Decap CMS at `/admin/` committing to `main` via Netlify Git Gateway + Netlify Identity.
- **Files reviewed:** all 17 templates (`src/*.njk`, `src/community/*.njk`, `src/_includes/base.njk`), `.eleventy.js`, `package.json`, `netlify.toml`, `admin/config.yml`, `admin/index.html`, `src/_data/*.json`, `src/assets/css/style.css`, `src/assets/js/seed-thoughts.js`, content Markdown samples, `.gitignore`, `CLAUDE.md`.
- **Build/deploy:** Netlify auto-deploy from `main`; headers and redirects in `netlify.toml`.
- **Tools run: none.** The repo lives on a WSL mount that this session's Linux sandbox cannot reach (UNC paths unsupported), so `npm audit`, a build, and automated a11y/link checks could not be executed. The project itself has **no tests, linters, or CI checks configured** — recommendations below.
- **Not reviewed:** `node_modules` contents, `_site/` output, git history, Netlify dashboard settings (Identity registration policy, form notifications), and live-site behavior (forum CORS, actual image weights, TLS config).

## Priority Findings

| Priority | Category | Finding | Evidence | Impact | Recommended Fix |
|---|---|---|---|---|---|
| P0 | Security | DOM XSS: forum topic titles inserted via `innerHTML` | `src/forum.njk:105–118` | Any forum user who can create a topic can run script on agniyogaworld.org (CSP `'unsafe-inline'` allows injected event handlers) | Build the list with `createElement`/`textContent` |
| P1 | Security | Decap CMS from unpkg, floating `^3.0.0`, no SRI | `admin/index.html:17` | Compromised package/CDN = admin credential theft + content injection into `main` | Pin exact version, add SRI, or self-host the bundle |
| P1 | Maintainability | CMS schema missing fields present in data files | `admin/config.yml:72–99` vs `src/_data/about.json:87–109` | A CMS save of the About page deletes `roerich.image`, `attributes_heading`, `principles` → broken page image | Add the missing fields to `config.yml` (or remove dead data) |
| P1 | Performance | 267 KB JS to show one daily quote | `src/assets/js/seed-thoughts.js` (267.4 KB), loaded by `src/index.njk:149` | Slow homepage on mobile/poor connections | Render at build time or fetch only today's entry; at minimum `defer` + minify |
| P2 | Security | CSP `script-src 'unsafe-inline'` | `netlify.toml:33` | Neutralizes CSP's main XSS protection; is what makes the P0 exploitable | Move inline scripts to files, drop `'unsafe-inline'` |
| P2 | Accessibility/Usability | Mobile nav unusable without JS | `style.css:143–152` + toggle script `base.njk:95–117` | No-JS mobile visitors cannot navigate at all | CSS fallback (`:focus-within`/details) or `<noscript>` style showing links |
| P2 | Usability | Community filters: no visible empty state | `src/community/index.njk:148–166` (status is `.sr-only` only) | Sighted users see a blank grid with no explanation | Show the count/“no matches” message visibly |
| P2 | Usability | Forum widget depends on cross-origin `fetch` to Discourse | `src/forum.njk:100` | If CORS isn't enabled on the Discourse instance, the section silently shows the fallback forever | Verify `Access-Control-Allow-Origin` on the forum, or proxy/remove |
| P2 | Privacy | Google Fonts from Google CDN; not mentioned in privacy policy | `base.njk:19–21`; `privacy-policy.njk` | Visitor IPs sent to Google; GDPR exposure (precedent: LG München) | Self-host the two fonts; also simplifies CSP |
| P3 | Security | `X-Frame-Options: SAMEORIGIN` contradicts `frame-ancestors 'none'` | `netlify.toml:28,33` | Inconsistent policy (CSP wins in modern browsers) | Use `DENY` or drop XFO and rely on `frame-ancestors` |
| P3 | Accessibility | `admin/index.html` missing `lang` attribute | `admin/index.html:2` | Screen reader mispronunciation on the CMS login page | `<html lang="en">` |
| P3 | Accessibility | Footer column headings and "Main Themes" titles are styled `div`s | `base.njk:65–78`; `what-is-agni-yoga.njk:79–104` | Screen reader users can't navigate by heading | Use `h2`/`h3` with visual styling |
| P3 | Accessibility | Seed-thought body links distinguished by color only | `style.css:275–276` | Low-vision users may miss links (WCAG 1.4.1) | Underline links in running text |
| P3 | Usability | "Start Here" steps 02 and 03 both link to `/resources/` | `src/index.njk:80–88` | Two "steps" are the same destination — feels broken | Differentiate targets or merge steps |
| P3 | Usability | `/what-is-agni-yoga/` not in main nav; highlights "About" | front matter `navPage: "about"` | Key beginner page only reachable via footer/CTAs; nav highlight misleads | Add to nav or as a child of About |
| P3 | Performance | Hero/feature images lack `width`/`height`; hero is PNG | `index.njk:12`; `about.njk:48` | Layout shift (CLS); likely oversized download (couldn't measure from repo) | Add dimensions; convert to WebP/AVIF with `srcset` |
| P3 | Maintainability | `CLAUDE.md` describes collections that no longer exist | `CLAUDE.md` (groups/organizations, `group.njk`) vs actual `community` collection | Misleads future contributors/AI tooling | Update to match `.eleventy.js` |

## Security Findings

### Cross-site scripting

**Confirmed: DOM XSS in the forum widget.** `src/forum.njk:100–118` fetches `https://forum.agniyogaworld.org/latest.json` and builds HTML by string concatenation: `'<a href="' + url + '" ...>' + t.title + ...`, then assigns it to `container.innerHTML` (line 118). `t.title` and `t.slug` are controlled by whoever creates a topic on the forum — a different trust domain than this site. Discourse does not HTML-encode titles in its JSON API. A title like `<img src=x onerror=alert(document.domain)>` executes because the site CSP allows `'unsafe-inline'`. The data flow is: forum user → Discourse JSON → string-built markup → `innerHTML`. Fix:

```js
topics.forEach(function(t) {
  var li = document.createElement('li');
  var a = document.createElement('a');
  a.href = 'https://forum.agniyogaworld.org/t/' + encodeURIComponent(t.slug) + '/' + Number(t.id);
  a.target = '_blank'; a.rel = 'noopener';
  a.textContent = t.title;          // never innerHTML for remote data
  li.appendChild(a); /* meta span via textContent likewise */
  list.appendChild(li);
});
```

**Acceptable but note:** `seed-thoughts.js:404` injects repo-controlled HTML via `innerHTML` — same-trust content, not a vulnerability. The accordion `icon.innerHTML = '&#43;'` assignments are constant strings, fine. The `{{ content | safe }}` in `base.njk:54` and `entry.njk:45` render build-time content from the repo/CMS; CMS authors are trusted-ish, but note that **anyone with CMS access can inject arbitrary HTML/JS** through Markdown bodies — acceptable for a small trusted editor group, worth knowing.

**Safe:** the identity-token hash forwarder in `base.njk:24–31` only navigates to `'/admin/' + location.hash` — path-prefixed, fragment-only, no open-redirect or injection vector.

### Supply chain / third-party code

- `admin/index.html:17` loads `https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js` — **floating semver range, no SRI, third-party CDN**. This script runs on the page where editors authenticate; a malicious release or CDN compromise yields Git Gateway tokens and write access to `main` (which auto-deploys). Pin an exact version and add `integrity`, or vendor the file into the repo.
- `admin/index.html:9` loads the Netlify Identity widget from `identity.netlify.com` — unavoidable for the Identity flow, lower risk (same vendor as host), but pinnable too.
- Public pages load only first-party JS plus Google Fonts CSS. Good.

### Security headers (hosting layer — already partially done)

`netlify.toml:25–38` already sets X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS (with preload), X-Frame-Options, and a real CSP. This puts the site ahead of most. Improvements:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"                       # align with frame-ancestors 'none'
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://forum.agniyogaworld.org; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
```

To get there: move the four inline `<script>` blocks (`base.njk`, `index.njk` none, `forum.njk`, `community/index.njk`) into `/assets/js/` files, and self-host the two Google Fonts (removes `fonts.googleapis.com`/`gstatic` from style/font-src). `style-src 'unsafe-inline'` must stay unless the heavy use of `style=""` attributes in templates is refactored — acceptable residual risk. Add `base-uri` and `object-src`, currently missing. The `/admin/*` CSP (`netlify.toml:38`) allows `https:` script sources broadly plus `unsafe-eval`; after pinning Decap, tighten `script-src` to `'self' https://identity.netlify.com https://unpkg.com 'unsafe-eval'`.

- **HSTS preload note:** `preload` is declared; only submit to hstspreload.org deliberately — it's hard to undo.
- **Mixed content:** none found; all external references are HTTPS (checked all templates and content front matter).
- **Secrets:** none found in the repo (only Decap field names like `invite_token` in the forwarder). `.gitignore` correctly excludes `node_modules/` and `_site/`.

### Forms

Both forms (`connect.njk:37`, `community/index.njk:92`) are Netlify Forms with honeypots (`data-netlify-honeypot="bot-field"`), `method="POST"`, `action="/thank-you/"`, and `form-action 'self'` in CSP. Client validation (`required`, `type="email"`, `type="url"`) is convenience only — Netlify accepts whatever is POSTed; that's fine because submissions are only read by humans in the Netlify dashboard. Treat submission content as untrusted if it's ever rendered anywhere. Consider enabling Netlify's Akismet/reCAPTCHA option if honeypot spam gets through; that is a dashboard setting, not repo-visible.

### Link safety

Every `target="_blank"` in templates carries `rel="noopener"` (checked `base.njk`, `index.njk`, `news.njk`, `resources.njk`, `forum.njk`, `community/*.njk`) — no reverse-tabnabbing. One gap: CMS-entered URLs (`resource.data.link`, `entry.data.website`, `item.data.link`) are emitted into `href` unvalidated; a CMS editor could enter a `javascript:` URL. Low risk (trusted editors) but a one-line Eleventy filter rejecting non-`http(s):`/`mailto:` schemes would close it.

### Privacy

- No analytics, no trackers, no cookies on the public site — matches the privacy policy. Good.
- **Gap:** Google Fonts is fetched from Google's CDN (`base.njk:19–21`); visitor IPs go to Google and the privacy policy says nothing about it. Self-hosting (e.g., via google-webfonts-helper) fixes privacy, the policy gap, CSP, and performance at once.
- Minor: the policy's "does not use local storage" claim is false on `/admin/` (Netlify Identity uses localStorage). Scope the claim to the public site.

### Dependencies

Single devDependency `@11ty/eleventy ^3.1.5`; no lockfile-based audit was possible from this session. Run `npm audit` locally (expect little — Eleventy is build-time only, so runtime exposure is nil).

## Accessibility Findings

The baseline is strong — this section is mostly refinement, not rescue.

**Confirmed good (for the record):** skip link with visible focus (`style.css:50–63`); global `:focus-visible` outlines including dark-background variants; `.sr-only` utility used correctly; `prefers-reduced-motion` honored (`style.css:71–74`); `lang="en"` on the layout; unique per-page `<title>` and meta descriptions; landmarks (`nav` with `aria-label`, `main id="main-content"`, `footer`, `aside aria-label` on entry pages); breadcrumbs as `<nav><ol>` with `aria-current="page"` (`entry.njk:18–26`); nav toggle with `aria-expanded`/`aria-controls`, focus moved on open, Escape to close (`base.njk:95–117`); accordions with `aria-expanded`/`hidden`; filter buttons with `aria-pressed` and an `aria-live` results announcement (`community/index.njk:39,158–165`); every form input has a real `<label for>` plus `aria-describedby` hints (`connect.njk:40–65`); honeypot hidden with `hidden` (not just visually); ≥44px touch targets on nav links, buttons, and filter chips; descriptive alt on the hero banner; `aria-current="page"` on active nav links.

### Structure and semantics

- **Footer headings are `div.footer-col-heading`** (`base.njk:65,72,78`) — invisible to heading/landmark navigation. User impact: screen reader users can't jump between footer groups. WCAG 1.3.1. Fix: `<h2 class="footer-col-heading">` (or wrap footer link groups in `<nav aria-label>`).
- **"The Main Themes" items use styled divs** (`what-is-agni-yoga.njk:79–104`, `.about-attr-title`) — six de-facto subheadings (The Heart, Thought, Beauty…) invisible to AT scanning. WCAG 1.3.1. Fix: `h3`.
- `admin/index.html:2` — no `lang`, no `<noscript>` fallback. WCAG 3.1.1. One-line fix.
- `role="contentinfo"` on `<footer>` (`base.njk:56`) is redundant but harmless.

### Keyboard and interaction

- Mobile nav: opening moves focus to the first link and Escape returns focus to the toggle — good. Focus is not trapped, which is acceptable for a disclosure pattern; the open menu sits in DOM order so tabbing is coherent. **No change needed**, noted as verified.
- The accordion toggle functions (`toggleRegister`, `toggleAccordion`) are global `onclick=` handlers — they work with keyboard since they're real `<button>`s. Fine; moving them to external files is the CSP fix above, not an a11y issue.

### Visual

- **Links by color alone** in seed-thought running text: `.seed-thought-content a` is accent-colored, underlined only on hover (`style.css:275–276`). WCAG 1.4.1. Fix: `text-decoration: underline;`.
- **Very small text:** `.btn`, `.section-label`, `.card-link` at 10px and tags at 9px, all px-fixed so they don't respond to user font-size settings (page zoom still works, so 1.4.4 is technically met). Recommendation: bump to ≥0.7rem equivalents.
- **Contrast spot checks pass AA:** `#5A4A3A` on `#FAF5EE` ≈ 6.9:1; `#A8C4DC` on `#162840` ≈ 7.6:1; `#7B2040` on white ≈ 9.6:1; nav `#E8DDD0` on `#162840` ≈ 10:1. One to verify in a real checker: `.btn-outline-dark` at `rgba(232,221,208,0.75)` over the hero's dark gradient — likely ~5:1, passes for its size, but it's the closest call on the site.
- Decorative elements (`accent-line`, hero dividers, `✦`/`◆` glyphs) are CSS or text glyphs; the `◆` in `index.njk:57` and `✦` in `connect.njk:28` will be read aloud by some screen readers as "black diamond". Wrap in `aria-hidden="true"` spans. Minor.

### Forms

- Placeholders duplicate labels (`connect.njk:42` etc.) — not a violation since labels exist, but placeholder-as-example text ("your@email.com") is fine; keep.
- No custom error/validation states — browser defaults are accessible enough for forms this small; if custom validation is ever added, pair messages with `aria-describedby` as the hints already do.
- The status region for filters (`#community-filter-status`) is correctly `aria-live="polite" aria-atomic="true"` — but visually hidden; see usability finding about the missing visible empty state.

### Keyboard and Screen Reader Risks (summary)

The two things most likely to bite real users: (1) **no-JS / failed-JS mobile navigation** — `display:none` nav with a JS toggle means a CSP error or flaky connection strands mobile users with no menu at all; (2) **non-heading "headings"** in the footer and Main Themes section make rotor/heading navigation skip real structure. Everything else (focus management, ARIA states, live regions) is implemented correctly — verify with one VoiceOver/NVDA pass rather than rework.

## Usability Findings

### Homepage

- Purpose is communicated immediately (banner + tagline + two CTAs). Good hierarchy: hero → daily quote → what is AY → start here → resources → news.
- **Start Here steps 02 ("Read the foundational teachings") and 03 ("Explore study resources") both go to `/resources/`** (`index.njk:80–88`). Users perceive four steps but get three destinations. Point 02 at `/about/` or at a specific resource (e.g., the Agni Yoga Series card's external link), or collapse to three steps.
- The "What is Agni Yoga?" homepage section's attribute cards render only titles — `home.json` contains `description` text for all seven pillars that the template never outputs (`index.njk:55–59`). Either render the descriptions or remove them from the data/CMS to avoid editors writing text that never appears.
- The midnight auto-reload (`seed-thoughts.js:384–391`) reloads the homepage at 00:00:03 for anyone who has it open, losing scroll position. Replace `location.reload()` with re-rendering the seed-thought node in place.

### Navigation

- `/what-is-agni-yoga/` — the designated beginner page, target of the primary CTA — is absent from the main nav and sets `navPage: "about"`, so the nav highlights About while you're on it. Misleading active state; add the page to the nav or accept the highlight but document it.
- Footer "Learn" column offers "What is Agni Yoga?", "About Agni Yoga", and "The Teachings" (`/about/#teachings`) — three near-synonyms; consider trimming to two.
- 404 page exists with a clear way home; `/join/` → `/connect/` redirect covers a guessable URL. Good.

### Community page

- Filters work well (type + region, ARIA states, live count). **But when filters match nothing, sighted users just see an empty grid** — the count message is `.sr-only` only (`community/index.njk:39`). Make the status visible, e.g. "Showing 3 entries" / "No groups match these filters — try All Regions."
- Region values: CMS allows `"Other"` (`config.yml:127`) but there's no "Other" filter button — entries tagged Other appear under "All Regions" only and silently vanish when any region filter is active. Either add the button or document the behavior.

### Forum page

- The "Recent Discussions" fetch requires the Discourse server to send CORS headers for `agniyogaworld.org`. If it doesn't, every visitor sees only the fallback line. **Verify on the live site** (DevTools console will show the CORS error). If CORS can't be enabled, drop the section rather than shipping permanently dead code.
- The join-steps accordion content is clear and well written.

### Forms / Connect

- Short forms, clear labels, honeypot instead of CAPTCHA — low friction, good choice. `action="/thank-you/"` gives a real confirmation page (correctly excluded from the sitemap).
- Note: forms only function on Netlify hosting; in local dev `npm start`, submitting POSTs to a static path and fails. Expected for Netlify Forms; just don't debug it locally.

### Content / maintenance

- `CLAUDE.md` describes `groups`/`organizations` collections, `src/groups/group.njk`, and `groups.11tydata.json` — none exist anymore (actual: `community` collections, `src/community/entry.njk`). Update it; it actively misleads contributors and AI tooling.
- January 2026 conference news item is now in the past; there's no expiry mechanism. Periodic content review or an `expires` field would help.
- No JS fallbacks: seed-thought section shows "Loading…" forever without JS. Add a `<noscript>` line ("Seed thoughts require JavaScript — read them at agniyoga.org").

## Performance and Front-End Quality

- **`seed-thoughts.js` is 267 KB** (confirmed) — an entire year of HTML quote strings, unminified, parsed on every homepage visit to display one entry. Best fix: render today's quote at build time (Netlify builds on every push; add a scheduled daily build via Netlify's build hooks + a cron, which also keeps the date fresh) or split into 12 monthly JSON files fetched on demand (~22 KB each). Cheapest fix: add `defer`, minify, and rely on long-cache (`?v=` versioning is already in place at `index.njk:149`).
- **Images:** `banner.png` and `og-image.png` are PNGs; the hero is photographic content where WebP/AVIF would be dramatically smaller (actual sizes couldn't be measured from this session — check before/after). The hero `<img>` (`index.njk:12`) and Roerich figure (`about.njk:48`) lack `width`/`height` attributes → CLS on slow connections. The Roerich image correctly uses `loading="lazy" decoding="async"`; the hero correctly doesn't (it's LCP).
- **Fonts:** Google Fonts CSS is render-blocking; `preconnect` hints are present and `display=swap` is in the URL — decent. Self-hosting (see privacy) removes two DNS/TLS handshakes from the critical path.
- **CSS:** one ~1,100-line hand-rolled stylesheet, no framework, no dead framework weight — good. No minification step exists; at this size it's optional.
- **Dead/duplicated data:** `about.json` `principles` block (lines 54–86) duplicates `home.json` `attributes` and is rendered nowhere; `home.json` pillar `description`s unrendered. Remove or wire up.
- **Unused assets:** `favicon-32.png` and `favicon-180.png` exist but `base.njk:23` references only `favicon.ico`. Add `<link rel="icon" sizes="32x32">` and `<link rel="apple-touch-icon">`.
- **Inline styles:** dozens of long `style=""` attributes across templates (`forum.njk`, `connect.njk`, `news.njk`, `resources.njk`, `about.njk`) duplicate values that exist as CSS classes. Maintainability cost and the reason `style-src 'unsafe-inline'` can't be dropped. Gradual refactor into `style.css`.
- **Caching:** Netlify defaults (ETag-based) are fine; consider `Cache-Control: public, max-age=31536000, immutable` for `/assets/*` once all asset URLs are versioned.

## Quick Wins

1. Rewrite the forum topic renderer with `textContent` (~15 lines) — closes the P0.
2. Pin `decap-cms` to an exact version in `admin/index.html`.
3. Add the `roerich.image` (and `attributes_heading`) fields to `admin/config.yml` — prevents silent data loss.
4. Add `defer` to the seed-thoughts script tag; underline seed-thought links.
5. `<html lang="en">` in `admin/index.html`.
6. Change footer column `div`s and Main Themes titles to real headings.
7. Make the community filter count visible; add an empty-state message.
8. Fix Start Here step 02's link; add width/height to the hero image.
9. Align `X-Frame-Options: DENY` with `frame-ancestors 'none'`; add `base-uri 'self'; object-src 'none'` to CSP.
10. Update `CLAUDE.md` to the current collection structure.

## Recommended Validation Checklist

After fixes:

- [ ] **Build:** `npm run build` completes; diff `_site/` for unexpected changes.
- [ ] **XSS regression:** create a forum topic titled `<img src=x onerror=alert(1)>"&'` — forum page must render it as literal text.
- [ ] **CMS round-trip:** open About Page in `/admin/`, save without edits, then `git diff src/_data/about.json` — must be empty (no fields dropped).
- [ ] **Keyboard-only pass:** Tab through home, community (filters + accordion + form), forum (accordion), connect; confirm skip link, visible focus everywhere, Escape closes mobile nav.
- [ ] **Screen reader smoke test:** VoiceOver or NVDA on home + community: headings list is complete, filter changes are announced, form fields read label + hint.
- [ ] **Mobile viewport:** 360px and 390px widths — nav toggle, filter wrap, form usability; also test with JS disabled (nav must still be reachable).
- [ ] **Lighthouse** on `/`, `/community/`, `/forum/`: Performance ≥ 90 after the seed-thoughts fix; Accessibility ≥ 95; check CLS ≈ 0 after image dimensions.
- [ ] **Link check:** `npx linkinator https://agniyogaworld.org --recurse` (external links in content front matter especially).
- [ ] **Header check:** https://securityheaders.com against the live site; confirm CSP has no `'unsafe-inline'` in `script-src`; confirm `/admin/` CSP still lets Decap load.
- [ ] **Forum CORS:** load `/forum/` on production with DevTools open — no CORS error, topics render.
- [ ] **Dependency audit:** `npm audit` (and re-run after any Decap pin).
- [ ] **Forms:** submit both forms on a deploy preview; confirm arrival in Netlify dashboard and honeypot rejection of a bot-field-filled POST.

## Final Recommendation

The site is close to production-ready and is already live-quality in most respects — headers, accessibility plumbing, and content structure are unusually solid for a volunteer-run static site. It should **not** be considered done until three things ship: the forum `innerHTML` XSS fix (P0 — exploitable today by any forum registrant), the pinned/SRI'd Decap CMS bundle (P1 — protects the path into your `main` branch), and the CMS config alignment (P1 — currently a routine CMS edit corrupts the About page). The seed-thoughts payload and the no-JS mobile nav are the next tier. Everything else in this review is improvement, not blocker.
