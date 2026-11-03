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
        'businesses': {'jobRadar': {
            'dayBeforePrevious': {'date': '2026-11-02', 'newUsers': 0, 'activeUsers': 6, 'interactions': 9},
            'previousDay': {'date': '2026-11-03', 'newUsers': 2, 'activeUsers': 3, 'interactions': 9},
            'last7Days': {'startDate': '2026-10-28', 'newUsers': 6, 'activeUsers': 7, 'interactions': 20},
            'totals': {'registeredUsers': 10, 'enabledAlertUsers': 5},
            'generatedAt': '2026-11-04T00:01:00Z',
        }},
    }


class EmailReportTest(unittest.TestCase):
    def test_combines_sites_and_telegram(self):
        subject, body = module.build_message(fixture())
        self.assertIn('2026-11-03', subject)
        self.assertNotIn('个人站', body)
        self.assertNotIn('gelatoni.uk', body)
        for expected in ['running.example', 'Remote Job Radar',
                         '2026-10-28', '2026-11-04T00:01:00Z', '前天', '+4 (+50.0%)', '+2 (前天为 0)', '-3 (-50.0%)']:
            self.assertIn(expected, body)

    def test_zero_baseline(self):
        self.assertEqual(module.change(0, 0), '+0 (0%)')
        self.assertEqual(module.change(5, 0), '+5 (前天为 0)')

    def test_missing_or_stale_bot_fails(self):
        stats = fixture()
        stats['businesses']['jobRadar']['previousDay']['date'] = '2026-11-02'
        with self.assertRaises(ValueError):
            module.build_message(stats)
        del stats['businesses']
        with self.assertRaises(KeyError):
            module.build_message(stats)


if __name__ == '__main__':
    unittest.main()
