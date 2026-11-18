"""Send a traffic summary or workflow failure notice using SMTP or Resend."""
import argparse
import json
import os
from pathlib import Path
import smtplib
import ssl
from email.message import EmailMessage
import urllib.error
import urllib.request


def change(current, previous):
    delta = current - previous
    percent = ('0%' if current == 0 else '前天为 0') if previous == 0 else f'{delta / previous * 100:+.1f}%'
    return f'{delta:+g} ({percent})'


def build_message(stats, contributions=None):
    products = stats.get('products') or [
        {'key': 'running', 'kind': 'website', 'name': '跑步数据站'},
    ]
    day = stats.get('reportDate') or stats['sites']['running']['previousDay']['startDate']
    subject = f'产品使用日报 · {day}'
    lines = [subject, '北京时间，昨日与前天均为完整自然日 00:00–24:00。',
             '各产品独立统计；— 表示暂无完整数据，不代表 0。', '']
    def value(number):
        return '—' if number is None else str(number)
    for index, product in enumerate(products, 1):
        website = product['kind'] == 'website'
        channel = product['kind'] == 'telegram-channel'
        if not website and not channel:
            continue
        data = stats['sites' if website else 'channelStats'][product['key']]
        if channel:
            current, prior = data['previousDay'], data['dayBeforePrevious']
            lines.extend([f'{index}. {product.get("nameZh") or product["name"]}', product['url'],
                          f'前天 {prior["date"]} → 昨日 {current["date"]}',
                          f'  订阅人数：{value(prior.get("memberCount"))} → {value(current.get("memberCount"))}',
                          f'  昨日发布：{current.get("publishedItems") if current.get("publishedItems") is not None else "—"} 条；状态：{current.get("status", "—")}',
                          f'  当前订阅人数：{value(data.get("currentSnapshot", {}).get("memberCount"))}（{data.get("currentSnapshot", {}).get("date") or "—"}；采集时间 UTC {data.get("currentSnapshot", {}).get("collectedAt") or "—"}）',
                          f'  消息：{current.get("url") or "—"}',
                          f'  快照采集时间：{current.get("collectedAt") or "—"}', ''])
            continue
        previous, before = data['previousDay'], data['dayBeforePrevious']
        date_key = 'startDate' if website else 'date'
        if previous[date_key] != day:
            raise ValueError('Product report dates differ')
        from datetime import date, timedelta
        if before[date_key] != (date.fromisoformat(day) - timedelta(days=1)).isoformat():
            raise ValueError('Product prior-day dates differ')
        period = data['last30Days']
        period_days = 30
        name = product.get('nameZh') or product['name']
        lines.extend([f'{index}. {name}', product.get('url') or data.get('url') or data.get('domain', ''),
                      f'前天 {before[date_key]} → 昨日 {day}',
                      f'近 {period_days} 天：{period["startDate"]} 至 {day}'])
        fields = [('pageViews', '浏览量'), ('visits', '访问次数')]
        for key, label in fields:
            if key not in previous:
                continue
            current, prior = previous[key], before[key]
            delta = '—' if current is None or prior is None else change(current, prior)
            lines.append(f'  {label}：{value(prior)} → {value(current)}；日变化 {delta}；近 {period_days} 天 {value(period[key])}')
        lines.append('')
    if contributions is not None:
        if contributions['endDate'] != day or contributions['timezone'] != 'Asia/Shanghai':
            raise ValueError('Repository contribution period differs from daily report')
        lines.extend([
            'GitHub 公开仓库贡献（近 30 个完整自然日）',
            f'{contributions["startDate"]} 至 {contributions["endDate"]}（北京时间）',
            '总量 = Commit + PR + Issue + Review。',
        ])
        for repository in contributions['repositories']:
            lines.append(f'  {repository["name"]}：{repository["total"]}  {repository["url"]}')
        if not contributions['repositories']:
            lines.append('  暂无公开贡献')
        lines.append('')
    lines.extend([
        '网站：Cloudflare Web Analytics，可能含采样估算；访问次数不等于独立用户。',
        '频道订阅人数按每日快照记录；发布条数与状态来自发布回执。Telegram Bot API 不提供频道帖子的浏览量。',
        '公开统计：https://github.com/gelatoni-xh/gelatoni-xh',
    ])
    if os.environ.get('GITHUB_RUN_ID'):
        lines.append(f'本次运行：https://github.com/{os.environ["GITHUB_REPOSITORY"]}/actions/runs/{os.environ["GITHUB_RUN_ID"]}')
    return subject, '\n'.join(lines) + '\n'


def build_failure_message(failed_step, repository, run_id, attempt, event, ref):
    subject = f'产品使用日报失败 · {repository or "GitHub Actions"}'
    run_url = f'https://github.com/{repository}/actions/runs/{run_id}' if repository and run_id else None
    lines = [
        '产品使用日报工作流执行失败。',
        f'失败步骤：{failed_step or "未能确定（可能是工作流初始化或取消前失败）"}',
        f'触发方式：{event or "unknown"}',
        f'分支或标签：{ref or "unknown"}',
    ]
    if attempt:
        lines.append(f'运行尝试：{attempt}')
    if run_url:
        lines.extend(['', f'运行记录：{run_url}'])
    lines.extend(['', '为避免在邮件中暴露凭据或业务数据，此邮件不附带原始日志。'])
    return subject, '\n'.join(lines) + '\n'


def send(config, subject, body):
    sender, recipient = config['from'], config['to']
    if config['provider'] == 'resend':
        payload = {'from': sender, 'to': [recipient], 'subject': subject, 'text': body}
        request = urllib.request.Request(
            'https://api.resend.com/emails', data=json.dumps(payload).encode(),
            headers={'Authorization': f'Bearer {config["api_key"]}',
                     'Content-Type': 'application/json', 'User-Agent': 'traffic-report/1.0'},
        )
        # Avoid dumping response bodies or request details containing credentials.
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                if not json.load(response).get('id'):
                    raise RuntimeError('Resend did not return a message ID')
        except urllib.error.HTTPError as error:
            raise RuntimeError(f'Resend rejected email (HTTP {error.code})') from None
    elif config['provider'] == 'smtp':
        message = EmailMessage()
        message['Subject'], message['From'], message['To'] = subject, sender, recipient
        message.set_content(body)
        port = int(config.get('port', 465))
        context = ssl.create_default_context()
        if port == 465:
            connection = smtplib.SMTP_SSL(config['host'], port, timeout=30, context=context)
        else:
            connection = smtplib.SMTP(config['host'], port, timeout=30)
        with connection as smtp:
            if port != 465:
                smtp.ehlo()
                smtp.starttls(context=context)
                smtp.ehlo()
            smtp.login(config['username'], config['password'])
            if smtp.send_message(message):
                raise RuntimeError('SMTP refused a recipient')
    else:
        raise ValueError('MAIL_CONFIG provider must be smtp or resend')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--preview', action='store_true', help='Print the report without sending')
    parser.add_argument('--failure', action='store_true', help='Send a workflow failure notice instead of the report')
    args = parser.parse_args()
    if args.failure:
        subject, body = build_failure_message(
            os.environ.get('FAILED_STEP'), os.environ.get('GITHUB_REPOSITORY'),
            os.environ.get('GITHUB_RUN_ID'), os.environ.get('GITHUB_RUN_ATTEMPT'),
            os.environ.get('GITHUB_EVENT_NAME'), os.environ.get('GITHUB_REF'),
        )
    else:
        stats = json.loads(Path('analytics/traffic.json').read_text())
        contributions = json.loads(Path('analytics/repo-contributions.json').read_text())
        subject, body = build_message(stats, contributions)
    if args.preview:
        print(subject + '\n\n' + body)
    else:
        config = json.loads(os.environ['MAIL_CONFIG'])
        try:
            send(config, subject, body)
        except Exception as error:
            # SMTP providers can include account information in their errors.
            raise SystemExit(f'Email delivery failed ({type(error).__name__}); check mail configuration and provider status.') from None
        print('Mail provider accepted the daily traffic report.')
