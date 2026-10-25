import importlib.util
import io
import json
import os
import unittest
from pathlib import Path
from unittest.mock import patch, Mock

spec = importlib.util.spec_from_file_location('updater', Path(__file__).with_name('update_announcements.py'))
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)


class CalendarTests(unittest.TestCase):
    def test_select_current_year_and_month_instead_of_first_calendar(self):
        def item(year, month):
            return {'info_title': f'楊梅四維親子館 {year}年{month}月活動行事曆',
                    'info_cont': '&lt;img src=&quot;https://babycarems.tycg.gov.tw/files/PC/NEWS/example/calendar.jpg&quot;&gt;'}
        payload = {'data': {'list': [item(115, 11), item(114, 10), item(115, 10)]}}
        with patch.object(updater.urllib.request, 'urlopen', return_value=io.BytesIO(json.dumps(payload).encode())):
            calendar = updater.fetch_monthly_calendar_from_api(115, 10)
        self.assertEqual((calendar['year'], calendar['month']), (115, 10))
        self.assertEqual(len(calendar['images']), 1)

    def test_failure_never_relabels_previous_month_images(self):
        previous = {'year': 115, 'month': 9, 'images': [{'url': 'september.jpg'}]}
        with patch.object(updater, 'fetch_monthly_calendar_from_api', return_value=None):
            calendar = updater.fetch_monthly_calendar(115, 10, previous)
        self.assertEqual(calendar['month'], 10)
        self.assertEqual(calendar['images'], [])
        self.assertIn('尚未同步成功', calendar['greeting'])

    def test_missing_current_month_does_not_select_next_month(self):
        payload = {'data': {'list': [{'info_title': '楊梅四維親子館 115年11月活動行事曆', 'pic_loc': 'november.jpg'}]}}
        with patch.object(updater.urllib.request, 'urlopen', return_value=io.BytesIO(json.dumps(payload).encode())):
            self.assertIsNone(updater.fetch_monthly_calendar_from_api(115, 10))


class FacebookSyncTests(unittest.TestCase):
    def test_missing_token_discards_unverified_legacy_posts(self):
        with patch.dict(os.environ, {'FB_PAGE_ACCESS_TOKEN': ''}), patch.dict('sys.modules', {'public_fb': Mock(fetch_public_notices=Mock(side_effect=RuntimeError('unavailable')))}):
            posts, status = updater.fetch_fb_closure_notices([{'id': 'old_fake'}])
        self.assertEqual(posts, [])
        self.assertEqual(status['status'], 'error')
        self.assertIsNone(status['lastSuccessAt'])

    def test_failure_preserves_verified_posts_and_success_date(self):
        saved = [{'id': 'verified'}]
        with patch.dict(os.environ, {'FB_PAGE_ACCESS_TOKEN': 'test'}), patch.object(
            updater.urllib.request, 'urlopen', side_effect=OSError('offline')
        ):
            posts, status = updater.fetch_fb_closure_notices(saved, {'lastSuccessAt': '2026-10-01'})
        self.assertEqual(posts, saved)
        self.assertEqual(status['status'], 'error')
        self.assertEqual(status['lastSuccessAt'], '2026-10-01')

    def test_pagination_filter_deduplicate_and_sort(self):
        def post(number, message='休館公告'):
            return {'id': str(number), 'message': message,
                    'created_time': f'2026-10-{number:02}T00:00:00+0000',
                    'permalink_url': f'https://www.facebook.com/posts/{number}'}
        pages = [
            {'data': [post(1), post(9, '一般活動')],
             'paging': {'next': 'unused', 'cursors': {'after': 'cursor'}}},
            {'data': [post(1), post(4), post(3), post(2)]},
        ]
        responses = [io.BytesIO(json.dumps(page).encode()) for page in pages]
        with patch.dict(os.environ, {'FB_PAGE_ACCESS_TOKEN': 'test'}), patch.object(
            updater.urllib.request, 'urlopen', side_effect=responses
        ) as fetch:
            posts, status = updater.fetch_fb_closure_notices([])
        self.assertEqual([post['id'] for post in posts], ['4', '3', '2'])
        self.assertEqual(status['status'], 'ok')
        self.assertTrue(status['lastSuccessAt'])
        self.assertIn('after=cursor', fetch.call_args.args[0].full_url)
        self.assertNotIn('test', fetch.call_args.args[0].full_url)

    def test_successful_empty_result_clears_old_posts(self):
        with patch.dict(os.environ, {'FB_PAGE_ACCESS_TOKEN': 'test'}), patch.object(
            updater.urllib.request, 'urlopen', return_value=io.BytesIO(b'{"data": []}')
        ):
            posts, status = updater.fetch_fb_closure_notices([{'id': 'old'}], {'lastSuccessAt': 'old'})
        self.assertEqual(posts, [])
        self.assertEqual(status['status'], 'ok')


if __name__ == '__main__':
    unittest.main()
