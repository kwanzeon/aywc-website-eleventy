# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm start          # Dev server with live reload (http://localhost:8080)
npm run build      # Clean build: rm -rf _site && eleventy
```

There are no tests or linters configured.

## Architecture

Static site built with **Eleventy 3.x** and **Nunjucks** templates, hosted on **Netlify** with automatic deploys from `main`. The CMS is **Decap CMS** (at `/admin/`), which commits content edits directly to `main` via Netlify Git Gateway.

### Data flow

- `src/_data/*.json` — global site data available in all templates as top-level variables (`site`, `home`, `about`)
- `src/content/{news,community,resources}/*.md` — CMS-managed Markdown collections with YAML front matter
- `.eleventy.js` — registers five collections (`news` sorted by `date` descending; `community`, `communityPages`, `studyGroups`, and `resources` sorted by `order`), two filters (`limit`, `htmlDateString`), and passthrough copies for `src/assets/` and `admin/`
- `src/_includes/base.njk` — single shared layout; all pages set `layout: base.njk` and `navPage` for active nav highlighting
- `src/community/entry.njk` — pagination template that generates one page per community entry with `has_page: true` (the `communityPages` collection)
- `src/assets/js/` — all client-side JS lives here as external files (`site.js` nav toggle, `identity-redirect.js` Netlify Identity token forwarder, `community.js` filters + accordion, `forum.js` Discourse topics + accordion, `seed-thoughts.js`). The CSP in `netlify.toml` has no `'unsafe-inline'` for scripts, so do NOT add inline `<script>` blocks or `onclick=` attributes to templates — they will be blocked in production.
- Daily "Seed Thought" content lives in `src/assets/data/seed-thoughts/MM.json` (one file per month, keyed by zero-padded day); `src/_data/seedThought.js` picks the build day's entry for server-side render into the homepage, and `src/assets/js/seed-thoughts.js` is a small progressive-enhancement loader that fetches the visitor's local month JSON only when their local date differs from the build date (initial load and at local midnight)
- `_site/` — generated output, not committed

### Content collections

Each collection lives in `src/content/<type>/` and is configured in both `.eleventy.js` (for build) and `admin/config.yml` (for CMS editing). **Keep `admin/config.yml` in sync with the data files: Decap rewrites whole files on save, so any JSON field missing from the CMS schema is silently deleted when an editor saves.** Community entries have `types` (Organization / Study Group / Online Study) and a `region` field (`Americas`, `Europe`, `Asia-Pacific`, `Other`) used for client-side filtering on the community index. The `order` number field controls display order (lower = first, default 99). `community.11tydata.json` sets `permalink: false` so direct collection pages aren't generated; entries with `has_page: true` get pages via `src/community/entry.njk`.

### CMS

Decap CMS config at `admin/config.yml` maps CMS fields to the same `src/_data/` JSON and `src/content/` Markdown files. Media uploads go to `src/assets/images/uploads/`. The Decap bundle in `admin/index.html` is pinned to an exact version (no floating semver) — upgrade deliberately and re-test the CMS after bumping.

## Deployment

Netlify builds on every push to `main` (Node 22, `npm run build`, publishes `_site/`). CMS edits commit directly to `main` — pull before starting local work to avoid conflicts.

## Link styling

The site has no global link-color fallback (by design — nav/footer/card links all set their own color via class-based rules, and a global rule would conflict with them, e.g. overriding underline/no-underline behavior that varies by context). Any new in-copy link must land inside a wrapper that already sets link color (`.simple-page`, `.update-meta`, `.card`, `.footer-col`, `.nav-links`, `.btn`) or you must give it an explicit color — otherwise it silently falls back to the browser's default blue. This has happened before (the footer image-credit link, fixed under AYWC-153).

## Cache-busting static assets

Every `<script src="...">` and `<link rel="stylesheet" href="...">` in `base.njk`/templates should carry a `?v=YYYYMMDD` query param (bump it whenever the file's content changes). Netlify/the dev server don't set cache-busting headers on `src/assets/` files, so an unversioned asset can silently keep serving a stale cached copy after a deploy — this caused real debugging confusion more than once (mistaking a stale `community.js` and a stale `style.css` for live bugs). If a JS/CSS file has no `?v=` param, add one before editing it.

## Key external links

- Live site: https://agniyogaworld.org/
- CMS admin: https://agniyogaworld.org/admin/
- Jira: https://wmea.atlassian.net/ (project key `AYWC`)
- GitHub: https://github.com/kwanzeon/aywc-website-eleventy
