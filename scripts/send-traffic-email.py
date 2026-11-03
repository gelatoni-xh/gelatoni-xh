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


def build_message(stats):
    day = stats['sites']['personal']['previousDay']['startDate']
    start = stats['sites']['personal']['last30Days']['startDate']
    subject = f'网站访问日报 · {day}'
    lines = [f'网站访问日报：{day}', '统计时区：北京时间，前一天 00:00–24:00',
             f'近 30 天：{start} 至 {day}', '']
    for key, name in [('personal', '个人站'), ('running', '跑步数据站')]:
        site = stats['sites'][key]
        previous, month = site['previousDay'], site['last30Days']
        lines.extend([
            f'{name}（{site["domain"]}）',
            f'  前一天：{previous["pageViews"]} 次浏览 / {previous["visits"]} 次访问',
            f'  近 30 天：{month["pageViews"]} 次浏览 / {month["visits"]} 次访问', '',
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
