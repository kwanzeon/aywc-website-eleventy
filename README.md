# Agni Yoga World Community Website

Static website for the Agni Yoga World Community, built with Eleventy and deployed on Netlify.

- Live site: https://agniyogaworld.org/
- Admin CMS: https://agniyogaworld.org/admin/
- Jira project: https://wmea.atlassian.net/ (project key: `AYWC`)
- GitHub repo: https://github.com/kwanzeon/aywc-website-eleventy

## Stack

- Eleventy 3.x
- Nunjucks templates
- Markdown content collections
- Decap CMS with Netlify Identity and Git Gateway
- Netlify hosting with automatic deploys from `main`

## Project Structure

```text
admin/                 Decap CMS admin app and config
src/                   Eleventy source files
src/_data/             Global site data
src/_includes/         Shared layouts and partials
src/assets/            Static assets copied through to the build
src/content/news/      News and event entries
src/content/groups/    Study group entries
src/content/resources/ Resource entries
src/content/organizations/
                       Organization entries
_site/                 Generated Eleventy output
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm start
```

Build the static site:

```bash
npm run build
```

The current build script uses Unix shell commands, so on Windows run it from WSL, Git Bash, or another Unix-compatible shell.

## Content Editing

Most content is editable through Decap CMS at `/admin/`. The CMS writes content back to the GitHub repo through Netlify Git Gateway.

CMS-managed collections:

- News & Events
- Study Groups
- Organizations
- Resources

Manual template and layout edits are made in `src/*.njk`, `src/_includes/`, and `src/assets/css/style.css`.

## Deployment

Netlify builds and deploys the site automatically when changes are pushed to `main`.

Build settings are defined in `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "_site"
```

Netlify uses Node.js 22 for production builds.

## Workflow Notes

- Pull from `main` before starting local work, because CMS edits may commit directly to GitHub.
- Do not force-push; the CMS and Netlify workflows expect a linear, shared `main` history.
- Keep generated `_site/` output out of commits unless a future workflow explicitly requires it.
- Track implementation tasks in Jira under the `AYWC` project.
