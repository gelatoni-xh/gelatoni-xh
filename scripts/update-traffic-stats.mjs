import { fetchTelegramStats, telegramMarkdown, compareMetrics, formatChange } from './telegram-stats.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!token || !account) throw new Error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required');

const sites = [
  { key: 'running', domain: 'tasukikeifu.com', en: 'Tasuki Keifu', zh: '跑步数据站' },
];
const dayMs = 86_400_000;
const offset = 8 * 3_600_000;
const now = new Date();
const end = Math.floor((now.getTime() + offset) / dayMs) * dayMs - offset;
const localDate = (timestamp) => new Date(timestamp + offset).toISOString().slice(0, 10);
const query = `query Traffic($account: String!, $start: Time!, $end: Time!) {
  viewer {
    accounts(filter: {accountTag: $account}) {
      rumPageloadEventsAdaptiveGroups(limit: 1000, filter: {datetime_geq: $start, datetime_lt: $end}) {
        count
        sum { visits }
        avg { sampleInterval }
        dimensions { requestHost }
      }
    }
  }
}`;

async function fetchDay(start) {
  let groups;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: {
          account, start: new Date(start).toISOString(), end: new Date(start + dayMs).toISOString(),
        } }),
        signal: AbortSignal.timeout(30_000),
      });
      const body = await response.json();
      if (!response.ok || body.errors?.length) {
        throw new Error(`Cloudflare query failed: ${response.status} ${JSON.stringify(body.errors ?? [])}`);
      }
      groups = body.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups;
      if (!Array.isArray(groups) || groups.length >= 1000) throw new Error('Missing or truncated Cloudflare results');
      break;
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  const result = { date: localDate(start), sites: {} };
  for (const site of sites) {
    const matching = groups.filter(({ dimensions: { requestHost } }) =>
      [site.domain, `www.${site.domain}`].includes(requestHost.toLowerCase()));
    for (const group of matching) {
      for (const value of [group.count, group.sum?.visits, group.avg?.sampleInterval]) {
        if (!Number.isFinite(value) || value < 0) throw new Error('Invalid Cloudflare metric');
      }
    }
    result.sites[site.key] = {
      pageViews: matching.reduce((sum, group) => sum + group.count, 0),
      visits: matching.reduce((sum, group) => sum + group.sum.visits, 0),
      sampled: matching.some((group) => group.avg.sampleInterval > 1),
    };
  }
  return result;
}

// Query complete Shanghai days individually: broad queries can use coarser sampling.
const daily = [];
for (let index = 30; index > 0; index -= 3) {
  daily.push(...await Promise.all([index, index - 1, index - 2].map((days) => fetchDay(end - days * dayMs))));
}
const previousDay = daily.at(-1);
const dayBeforePrevious = daily.at(-2);
const result = {
  generatedAt: now.toISOString(),
  source: 'Cloudflare Web Analytics / rumPageloadEventsAdaptiveGroups',
  timezone: 'Asia/Shanghai',
  metrics: {
    pageViews: 'Browser page load events; may be estimated through adaptive sampling',
    visits: 'Page views initiated from a different website (referrer hostname differs); not unique users or GA4 sessions',
  },
  sites: {},
};
for (const site of sites) {
  result.sites[site.key] = {
    domain: site.domain,
    previousDay: { startDate: previousDay.date, endDateExclusive: localDate(end), ...previousDay.sites[site.key] },
    dayBeforePrevious: { startDate: dayBeforePrevious.date, endDateExclusive: previousDay.date, ...dayBeforePrevious.sites[site.key] },
    comparison: compareMetrics(previousDay.sites[site.key], dayBeforePrevious.sites[site.key], ['pageViews', 'visits']),
    last30Days: {
      startDate: daily[0].date, endDateExclusive: localDate(end),
      pageViews: daily.reduce((sum, day) => sum + day.sites[site.key].pageViews, 0),
      visits: daily.reduce((sum, day) => sum + day.sites[site.key].visits, 0),
      sampled: daily.some((day) => day.sites[site.key].sampled),
    },
  };
}

result.businesses = { jobRadar: await fetchTelegramStats(previousDay.date) };

const begin = '<!-- TRAFFIC:START -->';
const finish = '<!-- TRAFFIC:END -->';
const readmes = [];
for (const [filename, chinese] of [['README.md', false], ['README.zh-CN.md', true]]) {
  const lines = [begin,
    chinese ? '## 服务使用记录' : '## Service usage', '',
    chinese ? `前一天：**${previousDay.date}**（北京时间 00:00–24:00）；近 30 天：${daily[0].date} 至 ${previousDay.date}。` :
      `Previous day: **${previousDay.date}**, 00:00–24:00 Asia/Shanghai. Last 30 days: ${daily[0].date} through ${previousDay.date}.`, '',
    chinese ? `| 站点 / 指标 | 前天 ${dayBeforePrevious.date} | 昨日 ${previousDay.date} | 昨日较前天 | 近 30 天 |` :
      `| Site / metric | Prior day ${dayBeforePrevious.date} | Yesterday ${previousDay.date} | Yesterday vs prior day | Last 30 days |`,
    '| --- | ---: | ---: | ---: | ---: |',
    ...sites.flatMap((site) => {
      const { previousDay: day, dayBeforePrevious: before, comparison, last30Days: month } = result.sites[site.key];
      return [['pageViews', '浏览量', 'Views'], ['visits', '访问次数', 'Visits']].map(([key, zh, en]) =>
        `| [${chinese ? site.zh : site.en}](https://${site.domain}) / ${chinese ? zh : en} | ${before[key]} | ${day[key]} | ${formatChange(comparison[key], chinese)} | ${month[key]} |`);
    }), '',
    chinese ? '来源：Cloudflare Web Analytics，可能含采样估算；访问次数不等于独立用户数。每天北京时间 08:00 自动更新（GitHub 调度可能延迟）。[统计口径与历史](./analytics/README.md)。' :
      'Source: Cloudflare Web Analytics; figures may include sampling estimates. Visits are not unique users. Updated daily at 08:00 Asia/Shanghai (GitHub scheduling may be delayed). [Definitions and history](./analytics/README.md).',
    ...telegramMarkdown(result.businesses.jobRadar, chinese),
    finish,
  ];
  const content = await readFile(filename, 'utf8');
  let updated;
  if (content.includes(begin) && content.includes(finish)) {
    updated = content.slice(0, content.indexOf(begin)) + lines.join('\n') + content.slice(content.indexOf(finish) + finish.length);
  } else if (!content.includes(begin) && !content.includes(finish) && content.includes('\n## ')) {
    updated = content.replace('\n## ', `\n${lines.join('\n')}\n\n## `);
  } else throw new Error(`Cannot locate traffic section in ${filename}`);
  readmes.push([filename, updated]);
}
await mkdir('analytics/history', { recursive: true });
await writeFile('analytics/traffic.json', JSON.stringify(result, null, 2) + '\n');
// Keep each day's collected snapshot so growth can be inspected later.
await writeFile(`analytics/history/${previousDay.date}.json`, JSON.stringify({ ...result, daily }, null, 2) + '\n');
for (const [filename, content] of readmes) await writeFile(filename, content);
console.log(JSON.stringify(result, null, 2));
