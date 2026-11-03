const prefix = 'Remote Job Radar · Daily statistics export\n';
const dayMs = 86_400_000;
const date = (ms) => new Date(ms).toISOString().slice(0, 10);
const integer = (n) => Number.isSafeInteger(n) && n >= 0;

export function validateTelegramStats(body, expectedDate, botId, chatId) {
  const message = body?.result?.pinned_message;
  if (!body.ok || String(body.result.id) !== String(chatId) || String(message?.from?.id) !== String(botId)
      || typeof message?.text !== 'string' || !message.text.startsWith(prefix)) {
    throw new Error('Telegram statistics snapshot missing or not published by the configured bot');
  }
  let report;
  try { report = JSON.parse(message.text.slice(prefix.length)); }
  catch { throw new Error('Invalid Telegram statistics JSON'); }
  if (report.version !== 1 || report.service !== 'remote-job-radar' || report.timezone !== 'Asia/Shanghai'
      || report.reportDate !== expectedDate || !Number.isFinite(Date.parse(report.generatedAt))
      || !report.totals || !integer(report.totals.registeredUsers) || !integer(report.totals.enabledAlertUsers)
      || !integer(report.weeklyActive) || !Array.isArray(report.daily) || report.daily.length !== 15) {
    throw new Error('Telegram statistics are stale or have an invalid schema');
  }
  const end = Date.parse(expectedDate + 'T00:00:00+08:00') + dayMs;
  const generated = Date.parse(report.generatedAt);
  if (generated < end || generated >= end + dayMs || generated > Date.now() + 300_000) {
    throw new Error('Telegram statistics generation time does not match the report day');
  }
  const daily = report.daily.map((row, index) => {
    if (row.day !== date(end + (index - 14) * dayMs + 8 * 3_600_000)
        || ![row.newUsers, row.active, row.interactions].every(integer) || row.active > row.interactions) {
      throw new Error('Invalid Telegram daily statistics');
    }
    return { date: row.day, newUsers: row.newUsers, activeUsers: row.active, interactions: row.interactions };
  });
  const week = daily.slice(7, 14);
  const sum = (key) => week.reduce((total, row) => total + row[key], 0);
  if (report.weeklyActive > sum('activeUsers') || report.totals.enabledAlertUsers > report.totals.registeredUsers) {
    throw new Error('Inconsistent Telegram statistics');
  }
  // Copy only explicitly allowed aggregate fields into the public repository.
  return {
    name: 'Remote Job Radar', url: 'https://t.me/GelatoniJobRadarBot', source: 'Telegram Bot API / private pinned aggregate snapshot',
    generatedAt: report.generatedAt, timezone: 'Asia/Shanghai',
    previousDay: daily[13], dayBeforePrevious: daily[12],
    comparison: compareMetrics(daily[13], daily[12], ['newUsers', 'activeUsers', 'interactions']),
    last7Days: { startDate: week[0].date, endDateExclusive: date(end + 8 * 3_600_000),
      newUsers: sum('newUsers'), activeUsers: report.weeklyActive, interactions: sum('interactions') },
    totals: { registeredUsers: report.totals.registeredUsers, enabledAlertUsers: report.totals.enabledAlertUsers },
    daily: daily.slice(0, 14),
  };
}

export async function fetchTelegramStats(expectedDate) {
  const token = process.env.TELEGRAM_STATS_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_STATS_CHAT_ID?.trim();
  if (!token || !/^\d+:[\w-]+$/.test(token) || !chatId || !/^\d+$/.test(chatId)) {
    throw new Error('TELEGRAM_STATS_BOT_TOKEN and TELEGRAM_STATS_CHAT_ID must be configured');
  }
  let body;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error('Telegram request rejected');
      body = await response.json();
      break;
    } catch {
      if (attempt === 2) throw new Error('Telegram statistics request failed; credentials and raw responses omitted');
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  return validateTelegramStats(body, expectedDate, token.split(':')[0], chatId);
}

export function compareMetrics(yesterday, before, keys) {
  return Object.fromEntries(keys.map((key) => [key, {
    difference: yesterday[key] - before[key],
    percent: before[key] === 0 ? (yesterday[key] === 0 ? 0 : null) : (yesterday[key] - before[key]) * 100 / before[key],
  }]));
}

export function formatChange(change, chinese = false) {
  const signed = (value) => `${value > 0 ? '+' : ''}${value}`;
  const percent = change.percent === null ? (chinese ? '前天为 0' : 'prior day was 0') : `${signed(Number(change.percent.toFixed(1)))}%`;
  return `${signed(change.difference)} (${percent})`;
}

export function telegramMarkdown(bot, chinese) {
  const day = bot.previousDay, before = bot.dayBeforePrevious, week = bot.last7Days, totals = bot.totals;
  return [
    chinese ? '### Telegram 业务 · Remote Job Radar' : '### Telegram business · Remote Job Radar', '',
    chinese ? `| 指标 | 前天 ${before.date} | 昨日 ${day.date} | 昨日较前天 |` :
      `| Metric | Prior day ${before.date} | Yesterday ${day.date} | Yesterday vs prior day |`,
    '| --- | ---: | ---: | ---: |',
    ...[['newUsers', '新增用户', 'New users'], ['activeUsers', '活跃用户', 'Active users'], ['interactions', '交互次数', 'Interactions']].map(([key, zh, en]) =>
      `| ${chinese ? zh : en} | ${before[key]} | ${day[key]} | ${formatChange(bot.comparison[key], chinese)} |`), '',
    chinese ? `近 7 天（${week.startDate} 至 ${day.date}）：新增 ${week.newUsers} 人，活跃 ${week.activeUsers} 人，交互 ${week.interactions} 次；当前注册 ${totals.registeredUsers} 人，启用提醒 ${totals.enabledAlertUsers} 人。[打开机器人](${bot.url})。` :
      `Last 7 complete days (${week.startDate} through ${day.date}): ${week.newUsers} new users, ${week.activeUsers} active users, ${week.interactions} interactions; ${totals.registeredUsers} currently registered users, ${totals.enabledAlertUsers} with enabled alerts. [Open bot](${bot.url}).`, '',
    chinese ? '来源：Telegram 私聊置顶汇总。排除管理员；活跃用户按区间去重，交互按已处理更新去重，自动推送不计。与网站浏览量分开统计；删除账号会影响历史数字。' :
      'Source: private pinned Telegram aggregate. Administrator excluded; active users are unique across each period; interactions are processed updates without retry duplicates. Automatic digests excluded. These differ from website views; account deletion can revise history.',
    '',
  ];
}
