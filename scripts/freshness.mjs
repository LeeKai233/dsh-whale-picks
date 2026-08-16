// freshness.mjs — nightly maintenance pass.
// Refreshes stars/pushedAt/archived from the GitHub API, then writes back FACTS
// re-pulled from each repo itself (pull failures keep the declared values —
// 不造假：回写的是事实，拉不到就留声明值）:
//   * cordis.patch.yml  → patches.insertIds（用 check-plugin 的 extractInsertIds 重抽）
//   * whalepicks.json   → patches.namespaces / patches.slots
// Score recomputation is NOT done here (no circular dependency); the freshness
// workflow chains compute-scores.mjs + render-radar.mjs + render-readme.mjs
// after this pass. Finally prints attention items:
//   * candidates sitting in the pool for more than 60 days
//   * repos archived or not pushed for 6+ months
// The freshness workflow commits the refresh and opens one issue for the attention list.
import { readFile, writeFile } from "node:fs/promises";
import { extractInsertIds } from "./check-plugin.mjs";

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

async function fetchRepoFile(repo, name) {
  for (const branch of ["main", "master"]) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${name}`, { headers });
      if (res.status === 200) return await res.text();
    } catch {
      // 不可达 — 试下一分支
    }
  }
  return null;
}

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
  if (changed) console.error(`updated ${p.id}: stars=${p.stars} pushed=${meta.pushed_at} archived=${meta.archived}`);

  // ---- fact write-back: conflict surface re-pulled from the repo itself ----
  const writebacks = [];
  const patchText = await fetchRepoFile(p.repo, "cordis.patch.yml");
  if (patchText !== null) {
    const ids = extractInsertIds(patchText);
    if (JSON.stringify(ids) !== JSON.stringify(p.patches?.insertIds ?? [])) {
      p.patches = p.patches ?? {};
      p.patches.insertIds = ids;
      writebacks.push(`insertIds=[${ids.join(", ")}]`);
    }
  }
  const manifestText = await fetchRepoFile(p.repo, "whalepicks.json");
  if (manifestText !== null) {
    try {
      const manifest = JSON.parse(manifestText);
      const namespaces = manifest.patches?.namespaces ?? [];
      const slots = manifest.patches?.slots ?? [];
      if (JSON.stringify(namespaces) !== JSON.stringify(p.patches?.namespaces ?? [])) {
        p.patches = p.patches ?? {};
        p.patches.namespaces = namespaces;
        writebacks.push(`namespaces=[${namespaces.join(", ")}]`);
      }
      if (JSON.stringify(slots) !== JSON.stringify(p.patches?.slots ?? [])) {
        p.patches = p.patches ?? {};
        p.patches.slots = slots;
        writebacks.push(`slots=[${slots.join(", ")}]`);
      }
    } catch {
      console.error(`${p.id}: 远端 whalepicks.json 非法 JSON，保留原 patches 声明`);
    }
  }
  if (writebacks.length) console.error(`回写 ${p.id}: ${writebacks.join(" ")}`);

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
