"""Send the published traffic summary using SMTP or Resend (standard library only)."""
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


def build_message(stats):
    day = stats['sites']['personal']['previousDay']['startDate']
    before_day = stats['sites']['personal']['dayBeforePrevious']['startDate']
    start = stats['sites']['personal']['last30Days']['startDate']
    bot = stats['businesses']['jobRadar']
    if bot['previousDay']['date'] != day or bot['dayBeforePrevious']['date'] != before_day:
        raise ValueError('Telegram and website report dates differ')
    subject = f'服务使用日报 · {day}'
    lines = [f'服务使用日报：{day}', '统计时区：北京时间，昨日与前天均为完整自然日 00:00–24:00',
             f'昨日：{day}；前天：{before_day}',
             f'近 30 天：{start} 至 {day}', '']
    for key, name in [('personal', '个人站'), ('running', '跑步数据站')]:
        site = stats['sites'][key]
        previous, before, month = site['previousDay'], site['dayBeforePrevious'], site['last30Days']
        lines.extend([
            f'{name}（{site["domain"]}）',
            f'  前天：{before["pageViews"]} 次浏览 / {before["visits"]} 次访问',
            f'  昨日：{previous["pageViews"]} 次浏览 / {previous["visits"]} 次访问',
            f'  昨日较前天：浏览 {change(previous["pageViews"], before["pageViews"])} / 访问 {change(previous["visits"], before["visits"])}',
            f'  近 30 天：{month["pageViews"]} 次浏览 / {month["visits"]} 次访问', '',
        ])
    previous, before, week, totals = bot['previousDay'], bot['dayBeforePrevious'], bot['last7Days'], bot['totals']
    lines.extend([
        'Remote Job Radar（Telegram）',
        f'  前天：新增 {before["newUsers"]} 人 / 活跃 {before["activeUsers"]} 人 / 交互 {before["interactions"]} 次',
        f'  昨日：新增 {previous["newUsers"]} 人 / 活跃 {previous["activeUsers"]} 人 / 交互 {previous["interactions"]} 次',
        f'  昨日较前天：新增 {change(previous["newUsers"], before["newUsers"])} / 活跃 {change(previous["activeUsers"], before["activeUsers"])} / 交互 {change(previous["interactions"], before["interactions"])}',
        f'  近 7 天（{week["startDate"]} 至 {day}）：新增 {week["newUsers"]} 人 / 活跃 {week["activeUsers"]} 人 / 交互 {week["interactions"]} 次',
        f'  当前：注册 {totals["registeredUsers"]} 人 / 启用提醒 {totals["enabledAlertUsers"]} 人',
        f'  快照更新时间：{bot["generatedAt"]}（UTC）',
        '  已排除管理员；活跃人数按区间去重；交互排除 Telegram 重试；自动推送不计活跃。',
        '  删除账号会影响历史数字。Telegram 用户量与网站浏览量分别统计。', '',
    ])
    lines.extend([
        '来源：Cloudflare Web Analytics。可能包含采样估算；访问次数不等于独立用户数。',
        '公开统计：https://github.com/gelatoni-xh/gelatoni-xh',
    ])
    if os.environ.get('GITHUB_RUN_ID'):
        lines.append(f'本次运行：https://github.com/{os.environ["GITHUB_REPOSITORY"]}/actions/runs/{os.environ["GITHUB_RUN_ID"]}')
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
    args = parser.parse_args()
    stats = json.loads(Path('analytics/traffic.json').read_text())
    subject, body = build_message(stats)
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
