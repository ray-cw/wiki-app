// Clones the private content repo into ./content before `next build`.
// Locally, without a token, it leaves an existing ./content folder alone.
import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

const DIR = "content";
const repo = process.env.CONTENT_REPO ?? "ray-cw/wiki-content";
// Trim: values pasted into dashboards often pick up a trailing newline or space.
const token = process.env.CONTENT_REPO_TOKEN?.trim();

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
} catch (error) {
  // git's output can echo the URL containing the token, so redact it.
  const detail = String(error.stderr || error.message).replaceAll(token, "***").trim();
  console.error(`Failed to clone ${repo}. Check CONTENT_REPO_TOKEN and CONTENT_REPO.`);
  console.error(detail);
  process.exit(1);
}
// .git/config holds the token-bearing URL; drop it so nothing ships with it.
rmSync(`${DIR}/.git`, { recursive: true, force: true });
console.log(`Fetched content from ${repo}.`);
