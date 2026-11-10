# wiki-app

A small campaign wiki with two logins: **Gamemaster** and **Player**. Pages are Markdown, kept in a separate private repo ([wiki-content](https://github.com/ray-cw/wiki-content)) and fetched at build time, so this repo can be public without exposing them.

- Pages marked `visibility: gm` are hidden from players (they get a 404).
- `:::gm … :::` blocks inside a page are stripped on the server for players.
- Images live next to the pages and are served from `/media/…` behind the login. Players can only load images that appear in content they can see.
- Every page is rendered per request; nothing GM-only is in static files or client JS.

## Local development

Clone `wiki-content` next to this repo, then link it in as `./content` so edits there show up straight away:

```bash
cp .env.example .env.local          # fill in passwords and SESSION_SECRET
ln -s ../wiki-content content       # ../wiki-content is your clone of the content repo
npm install
npm run dev
```

## Deploying on Vercel

1. Import this repo into Vercel.
2. Create a [fine-grained GitHub token](https://github.com/settings/personal-access-tokens/new) limited to `wiki-content`, with **Contents: Read-only**.
3. In the Vercel project's environment variables, set `GM_PASSWORD`, `PLAYER_PASSWORD`, `SESSION_SECRET` (`openssl rand -base64 32`) and `CONTENT_REPO_TOKEN`.
4. Under **Settings → Git → Deploy Hooks**, create a hook for `main` and save its URL as the `VERCEL_DEPLOY_HOOK` secret in `wiki-content`. Pushing content then redeploys the site.

`npm run build` runs `scripts/fetch-content.mjs` first, which clones the content repo into `./content` (git-ignored).

## Fonts

Loaded in `app/fonts.ts` and self-hosted by `next/font`; no font files are committed here.

- **Headings:** Beleren Bold, via [`@saeris/typeface-beleren-bold`](https://github.com/Saeris/typeface-beleren-bold). Beleren is © Wizards of the Coast; this is a non-commercial fan site.
- **Body:** [Crimson Pro](https://fonts.google.com/specimen/Crimson+Pro) by Jacques Le Bailly, SIL Open Font License.
- **Tables and sidebars:** Scaly Sans from Solbera's D&D 5e fonts, with fixes by Ryrok, Ners and others, via [`solbera-dnd-fonts`](https://github.com/prantlf/solbera-dnd-fonts). Licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
