// Checks that every source, policy, and data URL responds.
// Usage: node tools/check-links.mjs
// Sites that block automated requests (marked checkManually in sources.json, or a 403
// from a known blocking domain) are listed as "check manually", not failures.

import { loadNodeContent } from './node-content.mjs';

const TIMEOUT_MS = 20000;
const CONCURRENCY = 6;
const BLOCKING_DOMAINS = [
  'bls.gov', 'cdc.gov', 'dol.gov', 'hhs.gov', 'ssa.gov', 'dfas.mil',
  'povertycenter.columbia.edu', 'simonandschuster.com', 'journals.sagepub.com', 'data.census.gov',
];

const content = await loadNodeContent();
const { data } = content;
const links = new Map(); // url -> { where, manual }
const add = (url, where, manual = false) => {
  if (url && !links.has(url)) links.set(url, { where, manual });
};

for (const s of data.sources.sources) add(s.url, `source ${s.id}`, s.checkManually);
for (const p of data.policies.policies) add(p.learnMoreUrl, `policy ${p.id}`);
(function walk(obj, where) {
  if (Array.isArray(obj)) return obj.forEach((x, i) => walk(x, `${where}[${i}]`));
  if (!obj || typeof obj !== 'object') return undefined;
  for (const [k, v] of Object.entries(obj)) {
    if ((k === 'url' || k === 'tableUrl') && typeof v === 'string') add(v, where);
    else walk(v, `${where}.${k}`);
  }
  return undefined;
})({ salaries: data.salaries, 'family-income': data['family-income'], 'net-price': data['net-price'] }, 'data');

const blocks = (url) => BLOCKING_DOMAINS.some((d) => new URL(url).hostname.endsWith(d));

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (link check for Life Path)', accept: 'text/html,*/*' },
    });
    return { status: res.status };
  } catch (err) {
    return { status: 0, error: err.name === 'AbortError' ? 'timed out' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

const results = { ok: [], manual: [], failed: [] };
const queue = [...links.entries()];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const [url, info] = queue.shift();
    const r = await check(url);
    const line = `${r.status || 'ERR'} ${url}  (${info.where}${r.error ? `; ${r.error}` : ''})`;
    if (r.status >= 200 && r.status < 400) results.ok.push(line);
    else if ((r.status === 403 || r.status === 0) && (info.manual || blocks(url))) results.manual.push(line);
    else results.failed.push(line);
  }
}));

console.log(`Checked ${links.size} links: ${results.ok.length} ok, ${results.manual.length} to check manually, ${results.failed.length} failed.\n`);
if (results.manual.length) {
  console.log('CHECK MANUALLY (site blocks automated requests)');
  for (const l of results.manual.sort()) console.log(`  ? ${l}`);
  console.log();
}
if (results.failed.length) {
  console.log('FAILED');
  for (const l of results.failed.sort()) console.log(`  ✗ ${l}`);
}
process.exit(results.failed.length ? 1 : 0);
