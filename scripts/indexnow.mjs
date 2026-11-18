#!/usr/bin/env node
/**
 * Submit every URL in the sitemap index to IndexNow (Bing, Yandex, Seznam,
 * Naver). Runs from GitHub Actions after a successful deployment, or by hand:
 *
 *   node scripts/indexnow.mjs            # submit the live sitemap
 *   node scripts/indexnow.mjs --dry-run  # print what would be sent
 *
 * The key lives in public/<key>.txt so it is served at
 * https://www.topsaas.space/<key>.txt, which is where IndexNow looks it up.
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE = process.env.SITE_URL || 'https://www.topsaas.space';
const HOST = new URL(SITE).host;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_REQUEST = 10000;

const dryRun = process.argv.includes('--dry-run');

const findKey = () => {
  if (process.env.INDEXNOW_KEY) return process.env.INDEXNOW_KEY.trim();
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) return '';
  const candidate = fs
    .readdirSync(publicDir)
    .find((name) => /^[a-f0-9]{32}\.txt$/i.test(name));
  return candidate ? candidate.replace(/\.txt$/i, '') : '';
};

const locsFromXml = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) => match[1]);

const fetchText = async (url) => {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'TopSAAS-IndexNow/1.0', 'Cache-Control': 'no-cache' },
  });
  if (!res.ok) throw new Error(`${url} returned HTTP ${res.status}`);
  return res.text();
};

const localSitemapUrls = () => {
  const distDir = path.resolve(process.cwd(), 'dist');
  const indexPath = path.join(distDir, 'sitemap.xml');
  if (!fs.existsSync(indexPath)) return null;
  const index = fs.readFileSync(indexPath, 'utf8');
  const children = locsFromXml(index).filter((url) => url.endsWith('.xml'));
  const urls = [];
  for (const child of children) {
    const relative = child.replace(`${SITE}/`, '');
    const file = path.join(distDir, relative);
    if (!fs.existsSync(file)) continue;
    urls.push(...locsFromXml(fs.readFileSync(file, 'utf8')));
  }
  return urls.length ? urls : null;
};

const liveSitemapUrls = async () => {
  const index = await fetchText(`${SITE}/sitemap.xml`);
  const children = locsFromXml(index).filter((url) => url.endsWith('.xml'));
  if (!children.length) {
    throw new Error(
      '/sitemap.xml is not a sitemap index. Deploy the sitemap index build before running IndexNow.'
    );
  }
  const urls = [];
  for (const child of children) {
    urls.push(...locsFromXml(await fetchText(child)));
  }
  return urls;
};

const main = async () => {
  const key = findKey();
  if (!key) throw new Error('No IndexNow key found in public/<32-hex>.txt or INDEXNOW_KEY.');

  const urls = localSitemapUrls() || (await liveSitemapUrls());
  const unique = [...new Set(urls)];
  console.log(`IndexNow: ${unique.length} unique URLs for ${HOST} (key ${key})`);

  if (dryRun) {
    console.log(unique.slice(0, 10).join('\n'));
    return;
  }

  let submitted = 0;
  for (let i = 0; i < unique.length; i += MAX_URLS_PER_REQUEST) {
    const batch = unique.slice(i, i + MAX_URLS_PER_REQUEST);
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key,
        keyLocation: `${SITE}/${key}.txt`,
        urlList: batch,
      }),
    });
    const body = await res.text();
    if (!res.ok && res.status !== 202) {
      throw new Error(`IndexNow rejected batch ${i / MAX_URLS_PER_REQUEST + 1}: HTTP ${res.status} ${body}`);
    }
    submitted += batch.length;
    console.log(`IndexNow: batch ${i / MAX_URLS_PER_REQUEST + 1} accepted (HTTP ${res.status}), ${batch.length} URLs`);
  }
  console.log(`IndexNow: submitted ${submitted} URLs`);
};

main().catch((error) => {
  console.error(`IndexNow failed: ${error.message}`);
  process.exit(1);
});
