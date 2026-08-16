// validate.mjs — registry gatekeeper.
// 1. JSON Schema validation of data/plugins.json (and data/suits.json against suits.schema.json)
// 2. GitHub repo existence (404 / archived detection)
// 3. npm package existence + repository-pointer anti-squatting check — normalized
//    exact owner/repo equality (hard gate for featured/listed)
// 4. Tier contract: featured/listed must pass the rubric gate (see docs/rubric.md),
//    including a non-placeholder human-axis evidence (evidence 闭环)
import { readFile } from "node:fs/promises";
import Ajv from "ajv";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const ghHeaders = {
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  "User-Agent": "dsh-whale-picks-validate/1.0",
  Accept: "application/vnd.github+json"
};

const registry = JSON.parse(await readFile(new URL("../data/plugins.json", import.meta.url), "utf8"));
const schema = JSON.parse(await readFile(new URL("../data/schema.json", import.meta.url), "utf8"));

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);
if (!validate(registry)) {
  console.error("❌ schema validation failed:");
  for (const e of validate.errors) console.error("   -", e.instancePath || "/", e.message);
  process.exit(1);
}
console.log(`✔ schema OK (${registry.plugins.length} plugins)`);

const suits = JSON.parse(await readFile(new URL("../data/suits.json", import.meta.url), "utf8"));
const suitsSchema = JSON.parse(await readFile(new URL("../data/suits.schema.json", import.meta.url), "utf8"));
const validateSuits = ajv.compile(suitsSchema);
if (!validateSuits(suits)) {
  console.error("❌ suits schema validation failed:");
  for (const e of validateSuits.errors) console.error("   -", e.instancePath || "/", e.message);
  process.exit(1);
}
console.log(`✔ suits schema OK (${suits.suits.length} suits)`);

const errors = [];

// 防冒名比较：归一化（小写、去 git+ 前缀、去 .git 后缀、去 github.com 主机部分）
// 后的 owner/repo 精确全等 —— endsWith 会被 evilfoo/bar 之类的尾巴绕过。
function normalizeRepo(u) {
  return (u || "")
    .toLowerCase()
    .replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .replace(/^https?:\/\/(www\.)?github\.com\//, "")
    .replace(/^git@github\.com:/, "")
    .replace(/^github:/, "")
    .replace(/\/+$/, "");
}

const seen = new Set();
for (const p of registry.plugins) {
  if (seen.has(p.id)) errors.push(`duplicate id: ${p.id}`);
  seen.add(p.id);

  const repoRes = await fetch(`https://api.github.com/repos/${p.repo}`, { headers: ghHeaders });
  if (repoRes.status === 404) errors.push(`${p.id}: GitHub repo not found — ${p.repo}`);
  else if (repoRes.status !== 200) errors.push(`${p.id}: GitHub API ${repoRes.status} for ${p.repo}`);
  else {
    const meta = await repoRes.json();
    if (meta.archived) errors.push(`${p.id}: repo is archived — ${p.repo}`);
    if (meta.license?.spdx_id === "NOASSERTION" && p.tier !== "candidate") errors.push(`${p.id}: unclear license on GitHub`);
  }
  if (p.install !== null && !/^dsh plugin /.test(p.install)) {
    errors.push(`${p.id}: install must start with "dsh plugin ": ${p.install}`);
  }

  if (p.npmName) {
    const npmRes = await fetch(`https://registry.npmjs.org/${encodeURIComponent(p.npmName)}`);
    if (npmRes.status === 404) {
      if (["featured", "listed"].includes(p.tier)) errors.push(`${p.id}: npm package missing — ${p.npmName}`);
      else console.log(`  ℹ ${p.id}: npm ${p.npmName} not published (allowed for candidate)`);
    } else {
      const doc = await npmRes.json();
      const ptr = normalizeRepo(doc.repository?.url);
      const expect = normalizeRepo(p.repo);
      if (p.tier !== "candidate" && ptr !== expect) {
        errors.push(`${p.id}: npm repository pointer mismatch — npm says "${doc.repository?.url}", repo is ${p.repo}`);
      }
    }
  }

  if (p.tier === "featured" || p.tier === "listed") {
    if (!p.score) errors.push(`${p.id}: ${p.tier} requires score`);
    if (p.security.reviewStatus !== "reviewed") errors.push(`${p.id}: ${p.tier} requires security.reviewStatus=reviewed`);
    if (!p.reviewNotes) errors.push(`${p.id}: ${p.tier} requires reviewNotes`);
    if (!p.verifiedAgainst || !p.lastVerified) errors.push(`${p.id}: ${p.tier} requires verifiedAgainst and lastVerified`);
    if (!p.listedAt) errors.push(`${p.id}: ${p.tier} requires listedAt`);
    if (p.manifestCompliant !== true) errors.push(`${p.id}: ${p.tier} requires manifestCompliant=true (whale-picks spec gate — run scripts/check-plugin.mjs)`);
    if (!p.specVersion) errors.push(`${p.id}: ${p.tier} requires specVersion`);
    if (!p.radar) {
      errors.push(`${p.id}: ${p.tier} requires radar`);
    } else {
      const r = p.radar;
      const axes = [r.security, r.compatibility, r.scope, r.cost, r.activity, r.human];
      const total = axes.reduce((sum, a) => sum + (a?.value ?? 0), 0);
      if (r.security?.value == null || r.security.value < 4) errors.push(`${p.id}: radar security ${r.security?.value ?? 'null'} < 4`);
      if (r.compatibility?.value == null || r.compatibility.value < 4) errors.push(`${p.id}: radar compatibility ${r.compatibility?.value ?? 'null'} < 4`);
      if (r.human?.value == null) errors.push(`${p.id}: radar human rating required (founder test first)`);
      // evidence 闭环：listed/featured 的 human 轴不得是占位串
      if ((r.human?.evidence || "").trim() === "" || (r.human?.evidence || "").includes("待创始人/社区评分")) {
        errors.push(`${p.id}: ${p.tier} requires real human-axis evidence (占位串「待创始人/社区评分」不计)`);
      }
      if (total < 24) errors.push(`${p.id}: radar total ${total} < 24`);
    }
    if (p.security.hasLicense !== true) errors.push(`${p.id}: ${p.tier} requires an open-source license file`);
    if (p.security.npmPublished !== true) errors.push(`${p.id}: ${p.tier} requires npm publication (anti-squatting)`);
    if (p.security.repoPointerMatch !== true) errors.push(`${p.id}: ${p.tier} requires npm repository pointer match`);
  }

  if (p.tier === "candidate" && p.security.reviewStatus !== "pending-human") {
    errors.push(`${p.id}: candidate must have reviewStatus=pending-human`);
  }
}

if (errors.length) {
  console.error("❌ validation failed:");
  for (const e of errors) console.error("   -", e);
  process.exit(1);
}
console.log("✔ all checks passed");
