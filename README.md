# wiki-app

A small campaign wiki with two logins: **Gamemaster** and **Player**. Pages are Markdown, kept in a separate private repo ([wiki-content](https://github.com/ray-cw/wiki-content)) and fetched at build time, so this repo can be public without exposing them.

- Pages marked `visibility: gm` are hidden from players (they get a 404).
- `:::gm … :::` blocks inside a page are stripped on the server for players.
- Every page is rendered per request; nothing GM-only is in static files or client JS.

## Local development

```bash
cp .env.example .env.local          # fill in passwords and SESSION_SECRET
git clone https://github.com/ray-cw/wiki-content content
npm install
npm run dev
```

## Deploying on Vercel

1. Import this repo into Vercel.
2. Create a [fine-grained GitHub token](https://github.com/settings/personal-access-tokens/new) limited to `wiki-content`, with **Contents: Read-only**.
3. In the Vercel project's environment variables, set `GM_PASSWORD`, `PLAYER_PASSWORD`, `SESSION_SECRET` (`openssl rand -base64 32`) and `CONTENT_REPO_TOKEN`.
4. Under **Settings → Git → Deploy Hooks**, create a hook for `main` and save its URL as the `VERCEL_DEPLOY_HOOK` secret in `wiki-content`. Pushing content then redeploys the site.

`npm run build` runs `scripts/fetch-content.mjs` first, which clones the content repo into `./content` (git-ignored).
