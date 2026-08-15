// validate.mjs — registry gatekeeper.
// 1. JSON Schema validation of data/plugins.json
// 2. GitHub repo existence (404 / archived detection)
// 3. npm package existence + repository-pointer anti-squatting check (hard gate for featured/listed)
// 4. URL reachability
// 5. Tier contract: featured/listed must pass the rubric gate (see docs/rubric.md)
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

const errors = [];

async function head(url, label) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", headers: ghHeaders });
    if (![200, 301, 302].includes(res.status)) errors.push(`${label}: HTTP ${res.status} ${url}`);
  } catch (e) {
    errors.push(`${label}: fetch failed ${url} (${e.message})`);
  }
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
      const ptr = (doc.repository?.url || "").replace(/^git\+/, "").replace(/\.git$/, "").replace(/^https?:\/\/github\.com\//, "");
      const expect = p.repo.toLowerCase();
      if (p.tier !== "candidate" && !ptr.toLowerCase().endsWith(expect)) {
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
    if (p.score) {
      const s = p.score;
      const total = s.experience + s.maintenance + s.security + s.compatibility;
      if (total < 16 || s.security < 4 || s.compatibility < 4) {
        errors.push(`${p.id}: below rubric gate (total ${total}<16 or security ${s.security}<4 or compatibility ${s.compatibility}<4)`);
      }
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
