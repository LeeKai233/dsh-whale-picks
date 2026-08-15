// freshness.mjs — nightly maintenance pass.
// Refreshes stars/pushedAt/archived from the GitHub API, then prints attention items:
//   * candidates sitting in the pool for more than 60 days
//   * repos archived or not pushed for 6+ months
// The freshness workflow commits the refresh and opens one issue for the attention list.
import { readFile, writeFile } from "node:fs/promises";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const headers = {
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  "User-Agent": "dsh-whale-picks-freshness/1.0",
  Accept: "application/vnd.github+json"
};

const file = new URL("../data/plugins.json", import.meta.url);
const registry = JSON.parse(await readFile(file, "utf8"));
const attention = [];
const now = new Date();
const sixMonthsMs = 182 * 24 * 3600 * 1000;

for (const p of registry.plugins) {
  const res = await fetch(`https://api.github.com/repos/${p.repo}`, { headers });
  if (res.status !== 200) {
    attention.push(`- ${p.id} (${p.repo}): GitHub API ${res.status}`);
    continue;
  }
  const meta = await res.json();
  const changed =
    p.stars !== meta.stargazers_count ||
    p.pushedAt !== meta.pushed_at ||
    p.archived !== meta.archived;
  p.stars = meta.stargazers_count;
  p.pushedAt = meta.pushed_at;
  p.archived = meta.archived;
  p.security.pushedRecent = now - new Date(meta.pushed_at) < sixMonthsMs;
  if (changed) console.log(`updated ${p.id}: stars=${p.stars} pushed=${meta.pushed_at} archived=${meta.archived}`);

  if (meta.archived) attention.push(`- ${p.id} (${p.repo}): repo archived — 建议下架或移出候选池`);
  if (p.tier === "candidate") {
    const submitted = new Date(p.submittedAt);
    const days = Math.floor((now - submitted) / (24 * 3600 * 1000));
    if (days > 60) attention.push(`- ${p.id} (${p.repo}): 候选池已 ${days} 天未转正，请创始人亲测或裁决`);
  }
  if (p.security.repoPointerMatch === false) attention.push(`- ${p.id} (${p.repo}): npm repository 指针不符仍未解决，需人工核实`);
}

registry.updatedAt = now.toISOString().slice(0, 10);
await writeFile(file, JSON.stringify(registry, null, 2) + "\n");

if (attention.length) {
  console.log("\n=== ATTENTION ===");
  for (const a of attention) console.log(a);
}
