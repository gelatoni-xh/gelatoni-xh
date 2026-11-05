import { compareMetrics, formatChange } from './telegram-stats.mjs';

const integer = n => Number.isSafeInteger(n) && n >= 0;
const nullableInteger = n => n === null || integer(n);
const offset = 8 * 3600_000, dayMs = 86400_000;
const localDate = n => new Date(n + offset).toISOString().slice(0, 10);
export const botMetrics = [
  ['newUsers', '新增用户', 'New users'], ['activeUsers', '活跃用户', 'Active users'],
  ['interactions', '交互次数', 'Interactions'], ['searches', '查询请求', 'Search requests'],
];
export function validateMetadataStats(body, expectedDate, botId, chatId, product) {
  const message = body?.result?.pinned_message;
  if (!body.ok || String(body.result?.id) !== String(chatId) || String(message?.from?.id) !== String(botId) ||
      typeof message?.text !== 'string' || !message.text.startsWith(product.prefix)) throw new Error('Metadata statistics snapshot missing or wrong author');
  let report;
  try { report = JSON.parse(message.text.slice(product.prefix.length)); }
  catch { throw new Error('Invalid metadata statistics JSON'); }
  const end = Date.parse(expectedDate + 'T00:00:00+08:00') + dayMs;
  const generated = Date.parse(report.generatedAt), tracking = Date.parse(report.trackingSince);
  if (report.version !== 1 || report.service !== product.service || report.timezone !== 'Asia/Shanghai' || report.reportDate !== expectedDate ||
      !Number.isFinite(generated) || generated < end || generated >= end + dayMs || generated > Date.now() + 300_000 ||
      !Number.isFinite(tracking) || tracking > generated || !integer(report.totals?.registeredUsers) ||
      !nullableInteger(report.weeklyActive) || !Array.isArray(report.daily) || report.daily.length !== 15) throw new Error('Stale or invalid metadata statistics');
  const daily = report.daily.map((row, i) => {
    const timestamp = end + (i - 14) * dayMs;
    const complete = tracking <= timestamp;
    if (row.day !== localDate(timestamp) || !integer(row.newUsers) ||
        ![row.active, row.interactions, row.searches].every(complete ? integer : n => n === null) ||
        (complete && (row.active > row.interactions || row.searches > row.interactions))) throw new Error('Invalid metadata daily metrics or tracking coverage');
    return { date: row.day, newUsers: row.newUsers, activeUsers: row.active, interactions: row.interactions, searches: row.searches };
  });
  const week = daily.slice(7, 14), completeWeek = tracking <= end - 7 * dayMs;
  if ((completeWeek && (!integer(report.weeklyActive) || report.weeklyActive > week.reduce((n, row) => n + row.activeUsers, 0))) ||
      (!completeWeek && report.weeklyActive !== null)) throw new Error('Invalid metadata weekly coverage');
  const sum = key => week.some(row => row[key] === null) ? null : week.reduce((n, row) => n + row[key], 0);
  return { name: product.name, url: product.url, generatedAt: report.generatedAt, trackingSince: report.trackingSince,
    timezone: 'Asia/Shanghai', source: 'Telegram Bot API / private pinned aggregate snapshot',
    previousDay: daily[13], dayBeforePrevious: daily[12],
    last7Days: { startDate: week[0].date, endDateExclusive: localDate(end), newUsers: sum('newUsers'), activeUsers: report.weeklyActive, interactions: sum('interactions'), searches: sum('searches') },
    totals: { registeredUsers: report.totals.registeredUsers }, daily: daily.slice(0, 14) };
}

export async function fetchMetadataStats(expectedDate, product) {
  const token = process.env[`${product.secretPrefix}_BOT_TOKEN`]?.trim();
  const chatId = process.env[`${product.secretPrefix}_CHAT_ID`]?.trim();
  if (!token || !/^\d+:[\w-]+$/.test(token) || !chatId || !/^\d+$/.test(chatId)) throw new Error(`Configure ${product.secretPrefix} bot/chat secrets`);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId }), signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error('Telegram request rejected');
      return validateMetadataStats(await response.json(), expectedDate, token.split(':')[0], chatId, product);
    } catch {
      if (attempt === 2) throw new Error(`Failed to collect ${product.name}: check credentials, pinned snapshot and freshness (raw response omitted)`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

const value = n => n === null || n === undefined ? '—' : n;
export function productMarkdown(product, stats, chinese) {
  const site = product.kind === 'website', before = stats.dayBeforePrevious, day = stats.previousDay;
  const period = site ? stats.last30Days : stats.last7Days;
  const metrics = site ? [['pageViews', '浏览量', 'Views'], ['visits', '访问次数', 'Visits']] : botMetrics.filter(([key]) => key in day);
  const change = key => {
    if (day[key] == null || before[key] == null) return '—';
    return formatChange(compareMetrics(day, before, [key])[key], chinese);
  };
  return [
    `### [${chinese ? product.nameZh ?? product.name : product.name}](${product.url})`, '',
    chinese ? `| 指标 | 前天 | 昨日 | 日变化 | 近 ${site ? 30 : 7} 天 |` : `| Metric | Prior day | Yesterday | Daily change | Last ${site ? 30 : 7} days |`,
    '| --- | ---: | ---: | ---: | ---: |',
    ...metrics.map(([key, zh, en]) => `| ${chinese ? zh : en} | ${value(before[key])} | ${value(day[key])} | ${change(key)} | ${value(period[key])} |`), '',
    ...(!site ? [chinese ? `当前注册用户：${stats.totals.registeredUsers}${stats.totals.enabledAlertUsers !== undefined ? `；启用提醒：${stats.totals.enabledAlertUsers}` : ''}。` :
      `Registered users: ${stats.totals.registeredUsers}${stats.totals.enabledAlertUsers !== undefined ? `; enabled alerts: ${stats.totals.enabledAlertUsers}` : ''}.`, ''] : []),
    ...(stats.trackingSince ? [chinese ? `交互统计始于 ${stats.trackingSince}（UTC）；接入前及不足完整区间的指标显示为「—」。` :
      `Interaction tracking started ${stats.trackingSince} (UTC). Unavailable or incomplete periods are shown as “—”.`, ''] : []),
  ];
}
