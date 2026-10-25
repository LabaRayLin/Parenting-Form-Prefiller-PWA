#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hourly Announcement & Closure Updater for Parenting-Form-Prefiller-PWA
Runs hourly on the hour via GitHub Actions to fetch the latest
Monthly Calendar from Taoyuan Babycare and the Top 3 Facebook Closure Notices.
"""

import html
import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta
import urllib.request
import urllib.parse

# Path constants
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_FILE = os.path.join(PROJECT_DIR, "data", "announcements.json")

# Timezone (UTC+8 Taiwan Time)
TZ_TAIPEI = timezone(timedelta(hours=8))


def get_current_minguo_date():
    now = datetime.now(TZ_TAIPEI)
    minguo_year = now.year - 1911
    month = now.month
    return minguo_year, month, now


def load_existing_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[Warning] Failed to parse existing data file: {e}")
    return {}


def fetch_monthly_calendar_from_api(minguo_year, month):
    """
    Search and fetch the live monthly calendar for Yangmei Siwei Parent-Child Center
    directly from Taoyuan Babycare GlobalSearch API.
    """
    api_url = "https://babycare.tycg.gov.tw/api/GlobalSearch/Search"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json;charset=UTF-8",
        "Accept": "application/json, text/plain, */*"
    }
    
    payload = json.dumps({"keyword": "楊梅四維親子館"}).encode("utf-8")
    req = urllib.request.Request(api_url, data=payload, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            items = data.get("data", {}).get("list", [])
            
            target_item = None
            for item in items:
                title = item.get("info_title", "")
                date_match = re.search(r"(\d+)\s*年\s*(\d+)\s*月", title)
                if "楊梅四維親子館" in title and "活動行事曆" in title and date_match:
                    year_value, month_value = map(int, date_match.groups())
                    if year_value >= 1911:
                        year_value -= 1911
                    if (year_value, month_value) == (minguo_year, month):
                        target_item = item
                        break

            if target_item:
                raw_title = target_item.get("info_title", "")
                
                # Extract actual month and year from announcement title to ensure 100% sync
                m_month = re.search(r'(\d+)\s*月份?', raw_title)
                actual_month = int(m_month.group(1)) if m_month else month
                
                m_year = re.search(r'(\d+)\s*年', raw_title)
                actual_year = int(m_year.group(1)) if m_year else minguo_year
                
                title = raw_title if raw_title else f"楊梅四維親子館 • {actual_year}年{actual_month}月份活動行事曆 ☄️📅"
                cont_str = html.unescape(target_item.get("info_cont", ""))
                
                # Extract image URLs from cont_str
                found_images = re.findall(
                    r'https://babycarems\.tycg\.gov\.tw/files/PC/NEWS/[a-zA-Z0-9\-]+/[a-zA-Z0-9\._]+\.(?:jpg|jpeg|png)',
                    cont_str,
                    re.IGNORECASE
                )
                
                # Deduplicate while preserving order
                unique_images = []
                for img in found_images:
                    if img not in unique_images:
                        unique_images.append(img)
                
                # Fallback to pic_loc if no content images found
                if not unique_images and target_item.get("pic_loc"):
                    unique_images = [f"https://babycarems.tycg.gov.tw/files/{target_item.get('pic_loc')}"]
                
                if unique_images:
                    images_list = [
                        {"url": img, "alt": f"{actual_month}月份活動行事曆 (課表 {idx+1})"}
                        for idx, img in enumerate(unique_images)
                    ]
                    
                    # Clean title formatting
                    clean_title = title.replace("【", "").replace("】", "").strip()
                    if not clean_title.endswith("☄️📅"):
                        clean_title += " ☄️📅"
                    
                    search_url = f"https://babycare.tycg.gov.tw//#/search?keyword={urllib.parse.quote(f'楊梅四維親子館 · {actual_year}年{actual_month}月活動行事曆')}"
                    
                    print(f"[✓] Successfully retrieved live {actual_month}月 calendar images from API: {len(images_list)} image(s)")
                    return {
                        "title": clean_title,
                        "year": actual_year,
                        "month": actual_month,
                        "greeting": f"各位大朋友、小朋友們好 ! 👋🏻\n四維親子館 {actual_month} 月份活動行事曆出爐囉 ! 歡迎各位家長帶著寶貝一同入館遊憩、參與活動 🥳",
                        "images": images_list,
                        "activities": [
                            { "name": "奇幻探索屋", "age": "4m - 12m" },
                            { "name": "小手繪宇宙", "age": "1y0m - 2y0m" },
                            { "name": "繪本星球", "age": "2y0m - 學齡前" },
                            { "name": "奇異創作家", "age": "2y0m - 學齡前" },
                            { "name": "黑魔法廚房", "age": "2y0m - 學齡前" },
                            { "name": "舞動小精靈", "age": "0y - 學齡前" },
                            { "name": "外展活動", "age": "0y - 學齡前" },
                            { "name": "親子活動", "age": "依活動類型而定" }
                        ],
                        "timeSlots": [
                            {
                                "category": "自由入館遊憩",
                                "quota": "網路 25 組、現場 10 組，開館 15 分鐘內報到",
                                "slots": ["上午：09:00 - 12:00", "下午：14:00 - 17:00"]
                            },
                            {
                                "category": "親子活動",
                                "quota": "網路 4 組、現場 2 組，活動前 15 分鐘報到",
                                "slots": ["上午：10:00 - 10:30", "下午：15:00 - 15:30"],
                                "note": "💡 舞動小精靈採全現場報名"
                            }
                        ],
                        "rules": [
                            "網路預約：活動前 14 天開放預約（至桃園育兒資源網）。",
                            "現場名額：活動當日該場次現場開放排隊報名。",
                            "對象：0-6 歲學齡前幼兒（未上小學），需家長陪同，無托育服務。",
                            "服裝：成人請穿著襪子入場，幼兒可穿可不穿。",
                            "取消與記點：如需取消請提早上網或來電；預約逾時未到將記「無故未到」一次並視同放棄。",
                            "飲食：館內禁止飲食，飲水請自備水杯。"
                        ],
                        "phone": "03-482-2207",
                        "searchUrl": search_url
                    }
    except Exception as e:
        print(f"[Warning] Failed to fetch calendar from live API: {e}")
        
    return None


def fetch_monthly_calendar(minguo_year, month, existing_calendar):
    """
    Search and fetch the latest monthly calendar for Yangmei Siwei Parent-Child Center.
    First tries live API, then falls back to existing calendar data while ensuring consistency.
    """
    live_calendar = fetch_monthly_calendar_from_api(minguo_year, month)
    if live_calendar:
        return live_calendar
    
    # Never relabel old calendar images as the current month.
    if existing_calendar.get("year") == minguo_year and existing_calendar.get("month") == month:
        return existing_calendar
    keyword = f"楊梅四維親子館 {minguo_year}年{month}月活動行事曆"
    return {
        "year": minguo_year, "month": month,
        "title": keyword, "greeting": "本月行事曆尚未同步成功，請查看官方網站。",
        "images": [], "searchUrl": "https://babycare.tycg.gov.tw/#/search?keyword=" + urllib.parse.quote(keyword)
    }


FB_PAGE_ID = "61570213655087"


def fetch_fb_closure_notices(existing_closures, previous_sync=None):
    """Read published posts; never manufacture notices or advance success on failure."""
    previous_sync = previous_sync or {}
    checked_at = datetime.now(TZ_TAIPEI).isoformat()
    # Only retain data previously obtained through this verified pipeline.
    saved = existing_closures if previous_sync.get("lastSuccessAt") else []
    status = {
        "status": "unconfigured", "checkedAt": checked_at,
        "lastSuccessAt": previous_sync.get("lastSuccessAt"),
        "pageUrl": f"https://www.facebook.com/{FB_PAGE_ID}",
    }
    token = os.environ.get("FB_PAGE_ACCESS_TOKEN", "").strip()
    if not token:
        try:
            from public_fb import fetch_public_notices
            notices = fetch_public_notices()
            status.update(status="ok", lastSuccessAt=checked_at, source="public-page")
            return notices, status
        except Exception as exc:
            print(f"[Warning] Public FB sync unavailable ({type(exc).__name__}); preserving verified data")
            status["status"] = "error"
            return saved, status
    try:
        version = os.environ.get("FB_GRAPH_API_VERSION", "v22.0")
        if not re.fullmatch(r"v\d+\.\d+", version):
            raise ValueError("Invalid Graph API version")
        params = {"fields": "id,message,created_time,permalink_url", "limit": 100}
        url = f"https://graph.facebook.com/{version}/{FB_PAGE_ID}/posts?" + urllib.parse.urlencode(params)
        posts = {}
        # Follow pagination via cursors without logging URLs containing credentials.
        for _ in range(10):
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
            with urllib.request.urlopen(req, timeout=30) as response:
                payload = json.load(response)
            if "error" in payload or not isinstance(payload.get("data"), list):
                raise ValueError("Invalid Facebook response")
            for post in payload["data"]:
                message = post.get("message", "").strip()
                if not message or not re.search(r"休館|閉館|暫停服務|停班停課|取消辦理|服務時間異動", message):
                    continue
                published = datetime.fromisoformat(post["created_time"].replace("Z", "+00:00"))
                link = post.get("permalink_url", "")
                parsed = urllib.parse.urlparse(link)
                if parsed.scheme != "https" or parsed.hostname not in ("www.facebook.com", "facebook.com"):
                    continue
                lines = [line.strip() for line in message.splitlines() if line.strip()]
                posts[post["id"]] = {
                    "id": post["id"], "author": "楊梅四維親子館", "authorTag": "官方粉專",
                    "date": published.astimezone(TZ_TAIPEI).strftime("%Y/%m/%d"),
                    "publishedAt": published.isoformat(), "badgeType": "notice",
                    "badgeText": "📢 休館與服務異動", "title": lines[0],
                    "highlights": lines[1:4], "fullContent": message, "link": link,
                }
            paging = payload.get("paging", {})
            after = paging.get("cursors", {}).get("after")
            if not paging.get("next") or not after:
                break
            params["after"] = after
            url = f"https://graph.facebook.com/{version}/{FB_PAGE_ID}/posts?" + urllib.parse.urlencode(params)
        notices = sorted(posts.values(), key=lambda post: post["publishedAt"], reverse=True)[:3]
        status.update(status="ok", lastSuccessAt=checked_at)
        return notices, status
    except Exception:
        # Exception URLs or response bodies can contain the access token.
        print("[Warning] Facebook sync failed; check token, permissions and API availability")
        status["status"] = "error"
        return saved, status


def main():
    print("========================================")
    print("🚀 Starting Hourly Announcement Sync Task")
    print("========================================")

    minguo_year, month, now = get_current_minguo_date()
    print(f"[*] Current Taiwan Time: {now.strftime('%Y-%m-%d %H:%M:%S')} (民國 {minguo_year} 年 {month} 月)")

    existing_data = load_existing_data()
    existing_calendar = existing_data.get("calendar", {})
    existing_closures = existing_data.get("closures", [])

    # Fetch Calendar & Closures
    calendar_data = fetch_monthly_calendar(minguo_year, month, existing_calendar)
    closures_data, closure_sync = fetch_fb_closure_notices(existing_closures, existing_data.get("closureSync"))

    # Build updated JSON payload
    updated_payload = {
        "updatedAt": now.isoformat(),
        "calendar": calendar_data,
        "closures": closures_data,
        "closureSync": closure_sync
    }

    # Ensure data directory exists
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(updated_payload, f, ensure_ascii=False, indent=2)

    print(f"[✓] Successfully updated {DATA_FILE}")
    print("========================================")


if __name__ == "__main__":
    main()
