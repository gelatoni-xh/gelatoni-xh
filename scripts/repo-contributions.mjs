import { readFile, writeFile } from 'node:fs/promises';

const login = 'gelatoni-xh';
const excludedOwners = new Set(['zyz666-rgb']);
const kinds = [
  ['commits', 'commitContributionsByRepository', '#3178c6'],
  ['pullRequests', 'pullRequestContributionsByRepository', '#32a88a'],
  ['issues', 'issueContributionsByRepository', '#e8a23a'],
  ['reviews', 'pullRequestReviewContributionsByRepository', '#d576a4'],
];
const query = `query RepoContributions($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      ${kinds.map(([, field]) => `${field}(maxRepositories: 100) {
        repository { nameWithOwner url visibility }
        contributions(first: 1) { totalCount }
      }`).join('\n')}
    }
  }
}`;

export function aggregate(collection) {
  const repositories = new Map();
  for (const [kind, field] of kinds) {
    const entries = collection?.[field];
    if (!Array.isArray(entries) || entries.length >= 100) throw new Error(`Missing or capped ${field}`);
    for (const { repository, contributions } of entries) {
      const count = contributions?.totalCount;
      if (!repository?.nameWithOwner || !repository?.url || !Number.isSafeInteger(count) || count < 0) {
        throw new Error(`Invalid ${field} result`);
      }
      if (repository.visibility !== 'PUBLIC' || excludedOwners.has(repository.nameWithOwner.split('/')[0].toLowerCase())) continue;
      const item = repositories.get(repository.nameWithOwner) ?? {
        name: repository.nameWithOwner, url: repository.url,
        commits: 0, pullRequests: 0, issues: 0, reviews: 0,
      };
      item[kind] += count;
      repositories.set(item.name, item);
    }
  }
  return [...repositories.values()].map(item => ({
    ...item, total: kinds.reduce((sum, [kind]) => sum + item[kind], 0),
  })).filter(item => item.total > 0).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

const escapeXml = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);

export function renderSvg(repositories, from, to) {
  const width = 900;
  const height = 130 + repositories.length * 54 + (repositories.length ? 0 : 35);
  const max = Math.max(1, ...repositories.map(repo => repo.total));
  const title = 'GitHub contributions by repository';
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">`,
    `<title id="title">${title}</title>`,
    `<desc id="desc">Public repositories, ${escapeXml(from)} to ${escapeXml(to)} Asia/Shanghai. Counts combine commits, pull requests, issues, and reviews.</desc>`,
    '<rect width="900" height="100%" fill="#ffffff"/>',
    '<text x="24" y="35" fill="#1f2937" font-family="Arial,sans-serif" font-size="21" font-weight="700">Last 30 days by repository</text>',
    `<text x="24" y="56" fill="#57606a" font-family="Arial,sans-serif" font-size="13">${escapeXml(from)} – ${escapeXml(to)} Asia/Shanghai · public activity</text>`,
  ];
  let legendX = 24;
  for (const [kind, , color] of kinds) {
    const label = { commits: 'Commits', pullRequests: 'Pull requests', issues: 'Issues', reviews: 'Reviews' }[kind];
    lines.push(`<rect x="${legendX}" y="74" width="10" height="10" rx="2" fill="${color}"/>`);
    lines.push(`<text x="${legendX + 16}" y="84" fill="#374151" font-family="Arial,sans-serif" font-size="12">${label}</text>`);
    legendX += label.length * 7 + 36;
  }
  if (!repositories.length) lines.push('<text x="24" y="136" fill="#57606a" font-family="Arial,sans-serif" font-size="15">No public contributions in this period.</text>');
  for (const [index, repo] of repositories.entries()) {
    const y = 119 + index * 54;
    lines.push(`<text x="24" y="${y}" fill="#1f2937" font-family="Arial,sans-serif" font-size="14" font-weight="600">${escapeXml(repo.name)}</text>`);
    lines.push(`<text x="875" y="${y}" text-anchor="end" fill="#1f2937" font-family="Arial,sans-serif" font-size="15" font-weight="700">${repo.total}</text>`);
    lines.push(`<rect x="24" y="${y + 9}" width="850" height="14" rx="3" fill="#f0f2f4"/>`);
    let x = 24;
    for (const [kind, , color] of kinds) {
      const segment = repo[kind] / max * 850;
      if (segment > 0) lines.push(`<rect x="${x.toFixed(2)}" y="${y + 9}" width="${segment.toFixed(2)}" height="14" fill="${color}"/>`);
      x += segment;
    }
  }
  lines.push('</svg>');
  return lines.join('\n') + '\n';
}

export function renderMarkdown(repositories, from, to, chinese) {
  const lines = [
    '<!-- CONTRIBUTIONS:START -->',
    chinese ? '## 最近 30 天的仓库贡献' : '## Repository contributions, last 30 days',
    '',
    `![${chinese ? '各仓库贡献分段条形图' : 'Stacked contribution chart by repository'}](https://gelatoni-xh.github.io/gelatoni-xh/assets/repo-contributions.svg)`,
    '',
    chinese ? `统计区间：${from} 至 ${to}（北京时间，30 个完整自然日）。总量 = Commit + PR + Issue + Review；仅统计 GitHub 记录的公开仓库贡献。` :
      `Period: ${from} through ${to} (30 complete Asia/Shanghai days). Total = commits + pull requests + issues + reviews; public repository contributions recorded by GitHub only.`,
    '',
    chinese ? '| 仓库 | 总量 |' : '| Repository | Total |',
    '| --- | ---: |',
    ...repositories.map(repo => `| [${repo.name}](${repo.url}) | **${repo.total}** |`),
  ];
  if (!repositories.length) lines.push(chinese ? '| 暂无公开贡献 | 0 |' : '| No public contributions | 0 |');
  lines.push('<!-- CONTRIBUTIONS:END -->');
  return lines.join('\n');
}

export function replaceSection(content, section) {
  const begin = '<!-- CONTRIBUTIONS:START -->';
  const end = '<!-- CONTRIBUTIONS:END -->';
  const startIndex = content.indexOf(begin);
  const endIndex = content.indexOf(end);
  if ((startIndex === -1) !== (endIndex === -1)) throw new Error('Incomplete contributions section');
  if (startIndex !== -1) {
    if (endIndex < startIndex || content.indexOf(begin, startIndex + 1) !== -1 || content.indexOf(end, endIndex + 1) !== -1) {
      throw new Error('Duplicate or reversed contributions section');
    }
    return content.slice(0, startIndex) + section + content.slice(endIndex + end.length);
  }
  const anchor = '<!-- TRAFFIC:START -->';
  if (!content.includes(anchor)) throw new Error('Cannot locate insertion point');
  return content.replace(anchor, `${section}\n\n${anchor}`);
}

export async function update() {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GH_TOKEN or GITHUB_TOKEN is required');
  const dayMs = 86_400_000;
  const shanghaiOffset = 8 * 3_600_000;
  const endExclusive = Math.floor((Date.now() + shanghaiOffset) / dayMs) * dayMs - shanghaiOffset;
  const from = new Date(endExclusive - 30 * dayMs);
  const to = new Date(endExclusive - 1);
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'gelatoni-xh-profile' },
    body: JSON.stringify({ query, variables: { login, from: from.toISOString(), to: to.toISOString() } }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length || !body.data?.user?.contributionsCollection) {
    throw new Error(`GitHub contribution query failed: ${response.status} ${JSON.stringify(body.errors ?? [])}`);
  }
  const repositories = aggregate(body.data.user.contributionsCollection);
  const shanghaiDate = date => new Date(date.getTime() + shanghaiOffset).toISOString().slice(0, 10);
  const startDate = shanghaiDate(from);
  const endDate = shanghaiDate(to);
  const readmes = await Promise.all([['README.md', false], ['README.zh-CN.md', true]].map(async ([path, chinese]) =>
    [path, replaceSection(await readFile(path, 'utf8'), renderMarkdown(repositories, startDate, endDate, chinese))]));
  await writeFile('analytics/repo-contributions.json', JSON.stringify({
    generatedAt: new Date().toISOString(), timezone: 'Asia/Shanghai',
    startDate, endDate, repositories,
  }, null, 2) + '\n');
  await writeFile('assets/repo-contributions.svg', renderSvg(repositories, startDate, endDate));
  for (const [path, content] of readmes) await writeFile(path, content);
  console.log(`Updated ${repositories.length} public repositories for ${startDate} to ${endDate}`);
}
