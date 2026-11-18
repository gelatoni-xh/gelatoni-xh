"""Verify the combined daily email without sending email."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('traffic_email', Path(__file__).with_name('send-traffic-email.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def fixture():
    return {
        'sites': {key: {'domain': key + '.example',
            'dayBeforePrevious': {'startDate': '2026-11-02', 'pageViews': 8, 'visits': 0},
            'previousDay': {'startDate': '2026-11-03', 'pageViews': 12, 'visits': 4},
            'last30Days': {'startDate': '2026-10-05', 'pageViews': 120, 'visits': 40}}
            for key in ['running']},
        'channelStats': {
            'aiChannel': {'currentSnapshot': {'memberCount': 105, 'collectedAt': '2026-11-04T00:01:00Z'},
                'previousDay': {'date': '2026-11-03', 'status': 'sent', 'publishedItems': 2,
                'memberCount': 105, 'url': 'https://t.me/ai_product_radar_cn/6', 'collectedAt': '2026-11-03T01:00:00Z'},
                'dayBeforePrevious': {'date': '2026-11-02', 'status': 'sent', 'publishedItems': 1, 'memberCount': 102}},
            'steamChannel': {'currentSnapshot': {'memberCount': 44, 'collectedAt': '2026-11-04T00:01:00Z'},
                'previousDay': {'date': '2026-11-03', 'status': 'no_content', 'publishedItems': 0,
                'memberCount': None, 'url': None, 'collectedAt': None},
                'dayBeforePrevious': {'date': '2026-11-02', 'status': 'sent', 'publishedItems': 1, 'memberCount': None}},
        },
    }


class EmailReportTest(unittest.TestCase):
    def test_combines_website_and_channel_reports_without_bot_metrics(self):
        stats = fixture()
        stats['reportDate'] = '2026-11-03'
        stats['products'] = [
            {'key': 'running', 'kind': 'website', 'name': 'Running'},
            {'key': 'aiChannel', 'kind': 'telegram-channel', 'name': 'AI Product Radar', 'nameZh': 'AI产品雷达', 'url': 'https://t.me/ai_product_radar_cn'},
            {'key': 'steamChannel', 'kind': 'telegram-channel', 'name': 'Steam Deals Radar', 'nameZh': 'Steam折扣情报局', 'url': 'https://t.me/steam_deals_radar_cn'},
        ]
        subject, body = module.build_message(stats)
        self.assertIn('2026-11-03', subject)
        self.assertNotIn('个人站', body)
        self.assertNotIn('gelatoni.uk', body)
        for expected in ['running.example', 'AI产品雷达', 'Steam折扣情报局', '前天',
                         '105', '44', 'sent', 'no_content']:
            self.assertIn(expected, body)
        self.assertNotIn('Remote Job Radar', body)
        self.assertNotIn('JAVIndexBot', body)

    def test_multiple_products_with_unknown_history(self):
        stats = fixture()
        stats['reportDate'] = '2026-11-03'
        stats['products'] = [
            {'key': 'running', 'kind': 'website', 'name': 'Running'},
            {'key': 'aiChannel', 'kind': 'telegram-channel', 'name': 'AI Product Radar', 'nameZh': 'AI产品雷达', 'url': 'https://t.me/ai_product_radar_cn'},
            {'key': 'steamChannel', 'kind': 'telegram-channel', 'name': 'Steam Deals Radar', 'nameZh': 'Steam折扣情报局', 'url': 'https://t.me/steam_deals_radar_cn'},
        ]
        subject, body = module.build_message(stats)
        self.assertIn('产品使用日报', subject)
        self.assertIn('2. AI产品雷达', body)
        self.assertIn('105', body)
        self.assertNotIn('None', body)
        self.assertNotIn('当前启用提醒', body)

    def test_zero_baseline(self):
        self.assertEqual(module.change(0, 0), '+0 (0%)')
        self.assertEqual(module.change(5, 0), '+5 (前天为 0)')

    def test_repository_contributions_in_daily_email(self):
        contributions = {'startDate': '2026-10-05', 'endDate': '2026-11-03',
                         'timezone': 'Asia/Shanghai', 'repositories': [
                             {'name': 'gelatoni-xh/example', 'url': 'https://github.com/gelatoni-xh/example', 'total': 7}]}
        _, body = module.build_message(fixture(), contributions)
        self.assertIn('gelatoni-xh/example：7', body)
        self.assertIn('2026-10-05 至 2026-11-03', body)
        contributions['endDate'] = '2026-11-02'
        with self.assertRaises(ValueError):
            module.build_message(fixture(), contributions)

    def test_failure_notice_has_step_and_actions_link_without_log_content(self):
        subject, body = module.build_failure_message(
            'Fetch Cloudflare and channel statistics', 'gelatoni-xh/gelatoni-xh', '42444370481', '2', 'schedule', 'refs/heads/main'
        )
        self.assertIn('失败', subject)
        self.assertIn('Fetch Cloudflare and channel statistics', body)
        self.assertIn('https://github.com/gelatoni-xh/gelatoni-xh/actions/runs/42444370481', body)
        self.assertIn('运行尝试：2', body)
        self.assertNotIn('MAIL_CONFIG', body)
        self.assertNotIn('raw SSH output', body)

if __name__ == '__main__':
    unittest.main()
