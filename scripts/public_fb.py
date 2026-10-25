"""Read only the logged-out public Facebook UI. No cookies or private endpoints."""
import os
import re
from playwright.sync_api import sync_playwright

PAGE_URL = 'https://www.facebook.com/ymswpcc/'


def fetch_public_notices():
    with sync_playwright() as playwright:
        options = {'headless': True}
        if os.environ.get('FB_BROWSER_CHANNEL'):
            options['channel'] = os.environ['FB_BROWSER_CHANNEL']
        browser = playwright.chromium.launch(**options)
        try:
            page = browser.new_page(locale='zh-TW')
            page.goto(PAGE_URL, wait_until='domcontentloaded', timeout=60000)
            close = page.get_by_role('button', name='關閉', exact=True)
            try:
                close.click(timeout=10000)
            except Exception:
                pass
            selector = '[data-ad-preview="message"]'
            page.locator(selector).first.wait_for(timeout=30000)
            candidates = {}
            for _ in range(5):
                rows = page.locator(selector).evaluate_all('''elements => elements.map(e => {
                    let root = e;
                    for (let i = 0; i < 12 && root; i++, root = root.parentElement) {
                        const a = root.querySelector('a[href*="/ymswpcc/posts/"]');
                        if (a) return {text: e.innerText, link: a.href, date: a.innerText};
                    }
                    return null;
                }).filter(Boolean)''')
                for row in rows:
                    if re.search(r'休館|閉館|暫停服務|停班停課|服務時間異動|入館提醒', row['text']):
                        link = row['link'].split('?')[0]
                        candidates.setdefault(link, row)
                if len(candidates) >= 3:
                    break
                page.mouse.wheel(0, 1400)
                page.wait_for_timeout(1500)
            if not candidates:
                raise RuntimeError('No verifiable public announcements; not treating login wall as empty feed')
            notices = []
            detail = browser.new_page(locale='zh-TW')
            for link, row in list(candidates.items())[:3]:
                detail.goto(link, wait_until='domcontentloaded', timeout=60000)
                meta = detail.locator('meta[property="og:description"]')
                message = meta.get_attribute('content', timeout=20000)
                if not message or not re.search(r'休館|閉館|暫停服務|停班停課|服務時間異動|入館提醒', message):
                    raise RuntimeError('Missing announcement body')
                lines = [line.strip() for line in message.splitlines() if line.strip()]
                notices.append({'id': link.rsplit('/', 1)[-1], 'author': '楊梅四維親子館',
                                'authorTag': '官方公開貼文', 'date': '擷取時顯示：' + row['date'],
                                'badgeType': 'notice', 'badgeText': '📢 休館與服務異動',
                                'title': lines[0], 'fullContent': message, 'highlights': lines[1:4],
                                'link': link})
            return notices
        finally:
            browser.close()
