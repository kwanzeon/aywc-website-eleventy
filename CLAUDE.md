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
- `src/content/{news,groups,resources,organizations}/*.md` — CMS-managed Markdown collections with YAML front matter
- `.eleventy.js` — registers four collections (sorted by `date` for news, by `order` field for others), two filters (`limit`, `htmlDateString`), and passthrough copies for `src/assets/` and `admin/`
- `src/_includes/base.njk` — single shared layout; all pages set `layout: base.njk` and `navPage` for active nav highlighting
- `src/groups/group.njk` — pagination template that generates one page per group entry using Eleventy's `pagination` feature
- `src/assets/js/seed-thoughts.js` — large inline JS object (`window.AYWC_SEED_THOUGHTS`) keyed by `"Month DD"` date strings; the homepage picks today's entry client-side
- `_site/` — generated output, not committed

### Content collections

Each collection lives in `src/content/<type>/` and is configured in both `.eleventy.js` (for build) and `admin/config.yml` (for CMS editing). Groups and organizations have a `region` field (`Americas`, `Europe`, `Asia-Pacific`) used for client-side JS filtering on the groups index page. The `order` number field controls display order (lower = first, default 99). Groups also have a `groups.11tydata.json` that sets `permalink: false` to prevent Eleventy from generating direct collection item pages (they are generated instead by `src/groups/group.njk`).

### CMS

Decap CMS config at `admin/config.yml` maps CMS fields to the same `src/_data/` JSON and `src/content/` Markdown files. Media uploads go to `src/assets/images/uploads/`.

## Deployment

Netlify builds on every push to `main` (Node 22, `npm run build`, publishes `_site/`). CMS edits commit directly to `main` — pull before starting local work to avoid conflicts.

## Key external links

- Live site: https://agniyogaworld.org/
- CMS admin: https://agniyogaworld.org/admin/
- Jira: https://wmea.atlassian.net/ (project key `AYWC`)
- GitHub: https://github.com/kwanzeon/aywc-website-eleventy
