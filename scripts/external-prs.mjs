import { readFile, writeFile } from 'node:fs/promises';

const login = 'gelatoni-xh';
const dataPath = 'analytics/external-prs.json';
const begin = '<!-- EXTERNAL-PRS:START -->';
const end = '<!-- EXTERNAL-PRS:END -->';
const dayMs = 86_400_000;

const query = `query ExternalPullRequests($search: String!, $after: String) {
  search(query: $search, type: ISSUE, first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on PullRequest {
        number title url mergedAt
        repository { nameWithOwner owner { login } }
      }
    }
  }
}`;

function validateItem(item) {
  return item && Number.isSafeInteger(item.number) && item.number > 0 &&
    typeof item.title === 'string' && item.title && typeof item.url === 'string' &&
    typeof item.repository === 'string' && item.repository.includes('/') &&
    typeof item.mergedAt === 'string' && !Number.isNaN(Date.parse(item.mergedAt));
}

export function mergeItems(existing, incoming) {
  const byUrl = new Map();
  for (const item of [...existing, ...incoming]) {
    if (validateItem(item)) byUrl.set(item.url, item);
  }
  return [...byUrl.values()].sort((a, b) =>
    Date.parse(b.mergedAt) - Date.parse(a.mergedAt) || a.url.localeCompare(b.url));
}

export function renderMarkdown(items, chinese = false) {
  const lines = [
    begin,
    chinese ? '## 已合并的外部 PR' : '## Recently merged external PRs',
    '',
  ];
  if (!items.length) {
    lines.push(chinese ? '暂时没有已合并的外部 PR。' : 'No merged external PRs yet.');
  } else {
    lines.push(items.map(item => `[${item.repository}#${item.number}](${item.url})`).join(', '));
  }
  lines.push('', end);
  return lines.join('\n');
}

export function replaceSection(content, section) {
  const startIndex = content.indexOf(begin);
  const endIndex = content.indexOf(end);
  if ((startIndex === -1) !== (endIndex === -1)) throw new Error('Incomplete external PR section');
  if (startIndex !== -1) {
    if (endIndex < startIndex || content.indexOf(begin, startIndex + 1) !== -1 || content.indexOf(end, endIndex + 1) !== -1) {
      throw new Error('Duplicate or reversed external PR section');
    }
    return content.slice(0, startIndex) + section + content.slice(endIndex + end.length);
  }
  const anchor = '<!-- TRAFFIC:START -->';
  if (!content.includes(anchor)) throw new Error('Cannot locate insertion point');
  return content.replace(anchor, `${section}\n\n${anchor}`);
}

async function fetchPage(token, search, after = null) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'gelatoni-xh-profile' },
    body: JSON.stringify({ query, variables: { search, after } }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length || !body.data?.search) {
    throw new Error(`GitHub external PR query failed: ${response.status} ${JSON.stringify(body.errors ?? [])}`);
  }
  return body.data.search;
}

export async function fetchExternalPrs(token, since = null) {
  const search = `author:${login} is:pr is:merged${since ? ` merged:>=${since}` : ''}`;
  const items = [];
  let after = null;
  do {
    const page = await fetchPage(token, search, after);
    for (const node of page.nodes ?? []) {
      if (node.mergedAt && node.repository?.owner?.login?.toLowerCase() !== login.toLowerCase()) {
        items.push({
          repository: node.repository.nameWithOwner,
          number: node.number,
          title: node.title,
          url: node.url,
          mergedAt: node.mergedAt,
        });
      }
    }
    after = page.pageInfo?.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return items;
}

function overlapDate(items) {
  if (!items.length) return null;
  const latest = Math.max(...items.map(item => Date.parse(item.mergedAt)));
  return new Date(latest - 2 * dayMs).toISOString().slice(0, 10);
}

export async function update() {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GH_TOKEN or GITHUB_TOKEN is required');
  let existing = [];
  try {
    const stored = JSON.parse(await readFile(dataPath, 'utf8'));
    existing = Array.isArray(stored.items) ? stored.items : [];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const incoming = await fetchExternalPrs(token, overlapDate(existing));
  const items = mergeItems(existing, incoming);
  await writeFile(dataPath, JSON.stringify({ generatedAt: new Date().toISOString(), timezone: 'Asia/Shanghai', items }, null, 2) + '\n');
  const readmes = await Promise.all([
    ['README.md', false],
    ['README.zh-CN.md', true],
  ].map(async ([path, chinese]) => [path, replaceSection(await readFile(path, 'utf8'), renderMarkdown(items, chinese))]));
  for (const [path, content] of readmes) await writeFile(path, content);
  console.log(`Updated ${items.length} merged external PRs`);
}

if (import.meta.url === `file://${process.argv[1]}`) await update();
