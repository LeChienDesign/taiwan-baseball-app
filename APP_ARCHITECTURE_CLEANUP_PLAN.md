

# Taiwan Baseball App 架構重整計畫

## 目標

把整個 app 從「東補西補」整理成清楚資料流：

```txt
資料源頭 → provider 抓取 → merge 統一覆蓋 → JSON 輸出 → lib 讀取 → UI 呈現
```

## 核心規則

```txt
data = 靜態資料
registry = 官方來源設定
manual = 人工補丁
provider = 抓資料
merge = 決定誰覆蓋誰
server/data = 最終輸出 JSON
lib = app 讀資料
components = UI
```

## 覆蓋優先順序

```txt
manual > provider > seed > fallback
```

## 第一階段：資料源頭整理

優先整理：

```txt
data/abroadPlayers.ts
data/abroadRegistry.ts
data/teamMetaRegistry.ts
constants/*TeamLogos.ts
```

目標：

```txt
abroadPlayers.ts 只放球員基本資料
abroadRegistry.ts 只放官方來源 / provider / 新聞關鍵字
teamMetaRegistry.ts 統一球隊中文名、logoKey、leagueGroup
TeamLogos 只做圖片 mapping
```

## 第二階段：建立 manual 資料層

新增：

```txt
data/manual/abroadRecentGames.ts
data/manual/abroadSeasonStats.ts
data/manual/abroadPhotos.ts
data/manual/abroadNewsRules.ts
```

用途：

```txt
徐若熙、王彥程、古林睿煬這類官方資料不穩或需人工補的資料，全放 manual。
```

目前 manual layer 已改為：

```txt
server/data/manual/
  abroadPlayers.manual.json
  cpbl.manual.json
  mlb.manual.json
  npb.manual.json
  kbo.manual.json
```

目前資料流：

```txt
remote/local/fallback
↓
manual override
↓
UI
```

共用 merge helper：

```txt
lib/manual/applyGameManualOverrides.ts
```

已套用：

```txt
lib/mlb.ts
lib/npb.ts
lib/kbo.ts
lib/cpbl.ts
```

詳細 manual JSON 規格文件：

```txt
docs/MANUAL_DATA_LAYER.md
```

## 第三階段：重整 provider / merge

目前重點：

```txt
server/fetch-abroad-data.ts
server/providers/mlbAbroad.ts
server/providers/npbAbroad.ts
server/providers/kboAbroad.ts
```

新增：

```txt
server/merge/mergeAbroadPlayers.ts
server/merge/mergeRecentGames.ts
server/merge/mergeSeasonStats.ts
server/merge/mergeNews.ts
```

provider 只做：

```txt
fetch
parse
normalize
```

merge 才決定：

```txt
誰覆蓋誰
資料保留邏輯
同日期 recentGames 擇優
```

## 第四階段：四聯盟賽事中心統一

整理：

```txt
server/fetch-live-baseball-data.ts
server/fetch-npb-live-data.ts
server/fetch-kbo-live-data.ts
server/fetch-cpbl-live-data.ts

lib/mlb.ts
lib/npb.ts
lib/kbo.ts
lib/cpbl.ts
```

所有 eventsCenter JSON 統一：

```ts
{
  updatedAt,
  league,
  games,
  gamesByDate,
  source,
  dateRange
}
```

## GitHub Actions 自動更新紀錄

目前 workflow：

```txt
.github/workflows/update-baseball-data.yml
```

GitHub Actions 頁面：

```txt
https://github.com/LeChienDesign/taiwan-baseball-app/actions
```

目前 workflow 名稱：

```txt
Update Baseball Data
```

目前排程：

```yaml
on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:
```

意思是理論上每 5 分鐘觸發一次，但 GitHub Actions scheduled workflow 不保證精準準時；在高負載或同一個 concurrency group 排隊時，可能延遲或跳過部分排程。

目前 workflow 實際執行內容：

```txt
npm run export:abroad-seed
npm run fetch:abroad-live
npm run fetch:events-mlb
npm run fetch:events-cpbl
npm run fetch:events-npb
npm run fetch:events-kbo
```

目前風險：

```txt
每 5 分鐘跑全量資料太重
abroad-live 沒必要高頻更新
四聯盟賽事也不應平常全量抓
GitHub schedule 實際可能變成 1~2 小時才成功跑一次
```

重整方向：

```txt
旅外球員：低頻，建議每日或手動更新
四聯盟賽事：依比賽時間 smart refresh
LIVE 比分：開賽前 10 分鐘至開賽後 4 小時，每 5 分鐘更新
非比賽時間：不跑或低頻跑
```

後續要把 GitHub Actions 拆成：

```txt
update-abroad-data.yml
update-events-daily.yml
update-live-games.yml
```

## 第五階段：首頁 smart refresh

整理：

```txt
app/(tabs)/index.tsx
lib/homeFeaturedGames.ts
hooks/useAbroadLiveData.ts
```

新增：

```txt
hooks/useHomeGames.ts
hooks/useSmartLeagueRefresh.ts
lib/homeGameSelector.ts
```

更新規則：

```txt
平常不抓
開賽前 10 分鐘開始抓
比賽中抓
開賽後最多追 4 小時
每 5 分鐘更新一次
```

## 第六階段：UI viewModel 化

整理：

```txt
components/ScoreboardCard.tsx
components/TrackedAbroadSection.tsx
components/AbroadPlayerAvatar.tsx
app/(tabs)/abroad.tsx
app/(tabs)/abroad/[id].tsx
```

新增：

```txt
lib/viewModels/abroadPlayerViewModel.ts
lib/viewModels/scoreboardGameViewModel.ts
```

UI 禁止：

```txt
merge data
判斷 provider
處理 fallback
```

## 第七階段：圖片與 logo 整理

目前先維持：

```txt
assets/abroad
assets/mlbteams
assets/npb
assets/kbo
assets/cpbl
assets/league
```

等資料層穩定後再搬，不要太早動 require path。

## 第八階段：刪除重複與舊檔

最後才處理：

```txt
.bak
重複 provider
舊 fallback
unused mock
重複 logo mapping
```

刪除前必須先跑：

```bash
rg "檔名或函式名" .
```

## 禁止事項

```txt
不要在 provider 裡寫手動補丁
不要在 UI 裡 merge 資料
不要在 data 裡放 live 更新結果
不要讓同一份資料存在 3 個地方
不要改完檔案就盲跑，要先確認資料流
```

## 最佳重整順序

```txt
1. 畫出目前資料流
2. 整理 abroadPlayers / registry / manual
3. 建立 merge 層
4. 重整 abroad fetch
5. 重整四聯盟 eventsCenter
6. 重整首頁 smart refresh
7. 重整 UI viewModel
8. 整理圖片路徑
9. 刪除重複檔案
10. 更新交接文件
```

---

# GitHub Actions 重整結論

## 現況

目前：

```yaml
schedule:
  - cron: '*/5 * * * *'
```

理論上每 5 分鐘執行一次，但實際 GitHub Actions 不保證準時。

目前觀察：

```txt
實際常變成 1~2 小時才跑一次
```

原因：

```txt
GitHub 免費 runner 排隊
workflow 過重
同一 workflow 跑太多 fetch
scheduled workflow 會被延遲
```

## 目前問題

現在 workflow 一次做太多：

```txt
旅外球員
MLB
NPB
KBO
CPBL
全部一起更新
```

導致：

```txt
更新慢
容易 timeout
debug 困難
資料流混亂
```

## 重整方向

拆成三層：

### 1. update-live-games.yml

用途：

```txt
只更新 LIVE 比賽
```

更新頻率：

```txt
比賽期間每 5 分鐘
非比賽時間停止
```

只處理：

```txt
MLB
NPB
KBO
CPBL
eventsCenter
```

---

### 2. update-abroad-data.yml

用途：

```txt
更新旅外球員資料
```

更新頻率：

```txt
每日 1~2 次即可
```

原因：

```txt
先發投手不會每天上場
很多資料其實是靜態
新聞也不需要高頻更新
```

---

### 3. update-static-data.yml

用途：

```txt
更新 seed / standings / logos / 靜態資料
```

更新頻率：

```txt
手動或每日一次
```

---

## 新原則

```txt
LIVE 資料才高頻更新
靜態資料低頻更新
manual 資料永遠優先
```

## GitHub Actions 必須記錄的內容

所有 workflow 都必須記錄：

```txt
workflow 名稱
更新目的
cron 頻率
輸出 JSON
影響檔案
```

避免：

```txt
不知道哪支 workflow 在改資料
```

## 目前主要 workflow 路徑

```txt
.github/workflows/update-baseball-data.yml
```

GitHub Actions 頁面：

```txt
https://github.com/LeChienDesign/taiwan-baseball-app/actions
```

## 未來目標

最後希望資料流變成：

```txt
GitHub Actions
↓
fetch
↓
provider normalize
↓
merge
↓
server/data JSON
↓
app hooks
↓
UI
```

而不是：

```txt
fetch 完直接東補西補
UI 自己再修資料
```
