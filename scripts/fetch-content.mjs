// Clones the private content repo into ./content before `next build`.
// Locally, without a token, it leaves an existing ./content folder alone.
import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

const DIR = "content";
const repo = process.env.CONTENT_REPO ?? "ray-cw/wiki-content";
const token = process.env.CONTENT_REPO_TOKEN;

if (!token) {
  if (process.env.VERCEL) {
    console.error("CONTENT_REPO_TOKEN is not set; cannot fetch wiki content.");
    process.exit(1);
  }
  console.log(
    existsSync(DIR)
      ? "Using local ./content (no CONTENT_REPO_TOKEN set)."
      : `No ./content folder. Clone ${repo} into ./content to see pages locally.`,
  );
  process.exit(0);
}

rmSync(DIR, { recursive: true, force: true });
try {
  execFileSync(
    "git",
    ["clone", "--depth=1", `https://x-access-token:${token}@github.com/${repo}.git`, DIR],
    { stdio: "pipe" },
  );
} catch {
  // Don't print git's output: it can echo the URL containing the token.
  console.error(`Failed to clone ${repo}. Check CONTENT_REPO_TOKEN and CONTENT_REPO.`);
  process.exit(1);
}
// .git/config holds the token-bearing URL; drop it so nothing ships with it.
rmSync(`${DIR}/.git`, { recursive: true, force: true });
console.log(`Fetched content from ${repo}.`);
