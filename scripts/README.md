# 無權杖公開頁面同步

未設定 FB_PAGE_ACCESS_TOKEN 時，排程使用 Playwright 開啟官方公開粉專 ymswpcc，關閉登入提示後讀取貼文連結，再讀取各篇的公開摘要全文。最多捲動五次，依頁面順序取前三筆休館、服務異動或入館提醒。這是公開頁面順序，不保證為依發布日期排序；若遇登入牆、限制頁或缺少公告全文，會保留上次成功資料並顯示更新失敗。

不需粉專管理權限或使用者登入 Cookie。FB 改版可能影響擷取。發布欄位保留擷取當時頁面顯示的時間文字，請搭配同步時間閱讀。

GitHub Actions 已加入 Playwright 與 Chromium 安裝。手動執行 Hourly Calendar & FB Closure Sync，再依原有流程部署網站即可。

# FB 休館公告同步

每小時排程透過 Facebook Graph API 讀取官方粉專 `61570213655087` 的已發布貼文，
最多掃描最近 1,000 則，篩選休館與服務異動，按發布時間取最近三筆。
不會使用舊版內建的示範公告。

## 設定

1. 在 GitHub repository → Settings → Secrets and variables → Actions，
   新增 secret `FB_PAGE_ACCESS_TOKEN`。此權杖必須具備讀取該粉專貼文的權限；
   一般個人帳號或不具該粉專存取權的權杖無法直接使用。
   參考 Meta 官方文件：https://developers.facebook.com/docs/pages-api/posts/
2. 如需指定 Graph API 版本，新增 repository variable `FB_GRAPH_API_VERSION`；
   預設 `v22.0`。
3. 在 Actions 手動執行 `Hourly Calendar & FB Closure Sync`，確認產出的
   `data/announcements.json` 中 `closureSync.status` 為 `ok`。
4. 依原有靜態網站部署流程發布變更。本機資料夾的程式變更不會自行部署。

權杖只放在 GitHub Secret，不得加入前端或 JSON。
未設定權杖時顯示官方 FB 連結；同步失敗時保留先前成功資料並標示狀態，
`lastSuccessAt` 不會被每次執行時間覆蓋。`updatedAt` 是整體資料檔產生時間。

## 驗證

```sh
python -m unittest discover -s scripts -p 'test_*.py'
node --check app.js
node --check sw.js
```

排程為每小時整點（台灣時間 00:00、01:00，以此類推）；實際開始時間可能因 GitHub Actions 排隊而延後。
