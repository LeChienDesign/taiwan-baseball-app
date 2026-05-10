

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

### 第三階段最小版已完成紀錄

已完成：

```txt
server/merge/buildSummary.ts
server/merge/mergeAbroadPlayers.ts
server/builders/buildAbroadPayload.ts
scripts/validate-events-center.ts
.github/workflows/update-npb-events.yml
```

實際調整：

```txt
buildSummary / AbroadLiveSummary 已從 mergeAbroadPlayers.ts 拆出到 server/merge/buildSummary.ts
mergeAbroadPlayers.ts 只保留 normalizePlayers / dedupePlayers / applyManualAbroadOverrides
buildAbroadPayload.ts 改從 server/merge/buildSummary.ts 匯入 buildSummary
NPB 局間比分若官方尚未提供每局分數，不再用 sum=0 擋 validate
NPB inning sum mismatch 暫列 WARN，不阻擋 workflow
update-npb-events.yml 改回 npm run fetch:events-npb，不再手動傳 --date
```

已驗證：

```bash
npx tsc --noEmit
npm run validate:events -- --league=NPB
npm run fetch:events-npb
```

結果：

```txt
tsc OK
NPB validate OK
NPB fetch OK - 6 games
GitHub Actions NPB workflow OK
main 已同步
```

重要 commit：

```txt
4f314be Relax NPB inning validation
814f206 Update NPB events snapshot
4efaaea Use default NPB fetch date in workflow
```

注意：

```txt
不要把 GitHub Actions 的 YAML 行，例如 run: npm run fetch:events-npb，貼到 Terminal 執行。
run: 是 workflow 檔案內容，不是 shell 指令。
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

目前確認：

```txt
這串流程主要跑 2026 當季資料，不是重爬去年以前的多年歷史資料。
四聯盟目前開季約一個多月，資料量仍屬可控。
真正可能拖慢的是 NPB / KBO 官方頁 response、NPB 旅外球員逐場 box page 候選頁嘗試、以及 abroad-live provider merge。
```

資料維護原則：

```txt
data/abroadPlayers.ts
= 手動維護 seed / 穩定累計 / 歷史資料 / 當季人工校正資料

server/data/abroadPlayers.seed.json
= npm run export:abroad-seed 輸出

server/data/abroadPlayers.live.json
= npm run fetch:abroad-live 產生的 provider merge 結果
```

每日賽後資料策略：

```txt
每日比賽結束後可先跑 npm run fetch:abroad-live
確認 provider 抓到的資料正確後，再把重要累計手動補回 data/abroadPlayers.ts
過去資料、穩定累計、官方資料不穩的球員資料，不建議每次重爬整季歷史
應以手動 seed 作為可靠基準，live provider 只負責每日近況與最近出賽補充
```

建議流程：

```bash
npm run fetch:abroad-live
# 檢查 server/data/abroadPlayers.live.json
# 手動把穩定累計補回 data/abroadPlayers.ts
npm run export:abroad-seed
npm run fetch:abroad-live
npx tsc --noEmit
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

進入條件已完成：

```txt
第三階段最小版已完成
npx tsc --noEmit 通過
npm run validate:events 通過
NPB workflow 已修正並通過
```

下一步才開始處理：

```txt
hooks/useHomeGames.ts
hooks/useSmartLeagueRefresh.ts
lib/homeGameSelector.ts
```

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

### 第五階段已完成紀錄

已完成：

```txt
hooks/useHomeGames.ts
hooks/useSmartLeagueRefresh.ts
lib/homeGameSelector.ts
```

調整內容：

```txt
app/(tabs)/index.tsx 已瘦身，只保留 UI render / logo animation / route navigation
首頁四聯盟 fetch / normalize / featured selector / live selector 已搬到 useHomeGames.ts
smart refresh 已搬到 useSmartLeagueRefresh.ts
首頁 selector / 日期 / 排序 / 12 小時焦點賽事已集中到 homeGameSelector.ts
Provider / Merge / UI 不再混在首頁
```

首頁目前資料流：

```txt
server/data/*.json
↓
lib/* league reader
↓
lib/homeGameSelector.ts
↓
hooks/useHomeGames.ts
hooks/useSmartLeagueRefresh.ts
↓
app/(tabs)/index.tsx
↓
ScoreboardCard
```

首頁焦點賽事規則：

```txt
「今日焦點賽事」改為顯示現在起 12 小時內將進行的 SCHEDULED 比賽
useHomeGames 會同時抓今天與明天四聯盟資料
getUpcomingGamesWithinHours(featuredGames, 12) 負責挑選焦點賽事
這樣晚上也能看到隔天早上的 MLB / 跨日比賽
```

已驗證：

```bash
npx tsc --noEmit
```

結果：

```txt
tsc OK
```

### 第五階段補充紀錄：首頁焦點賽事與 CPBL 尚未開賽修正

問題：

```txt
首頁「今日焦點賽事」應顯示現在起 12 小時內即將開賽的所有 SCHEDULED 比賽
CPBL 2026-05-10 三場 17:05 賽事中，台鋼雄鷹 vs 中信兄弟一度被誤判為 FINAL
導致 CPBL 尚未開賽賽事沒有出現在首頁焦點賽事
```

確認原因：

```txt
server/data/eventsCenter.cpbl.json 原本第三場被 box/live endpoint 舊資料覆蓋為 FINAL 2-4
CPBL 官網賽程頁顯示三場皆尚未開始
fetch:events-cpbl 後仍可能從 live/box HTML fallback 把尚未開賽資料改成 FINAL
lib/cpbl-real.ts 的 normalizeStatus 也會因 0-0 分數存在而把尚未開賽誤判 FINAL
```

已修正檔案：

```txt
server/providers/cpblOfficial.ts
lib/cpbl-real.ts
hooks/useHomeGames.ts
lib/homeGameSelector.ts
server/data/eventsCenter.cpbl.json
server/data/eventsCenter.npb.json
```

修正重點：

```txt
cpblOfficial.ts 新增 schedule 尚未開始保護
若 schedule/seed 顯示 SCHEDULED、尚未開始、未開賽或有 HH:mm 開賽時間
則 live detail / box HTML 的舊 FINAL 不可覆蓋 schedule 狀態

cpbl-real.ts 的 normalizeStatus 調整順序
尚未開始 / 未開賽 / SCHEDULED 必須先於 FINAL 判斷
避免 0-0 尚未開賽被誤判成 FINAL

useHomeGames.ts 維持今日焦點賽事規則：
getUpcomingGamesWithinHours(featuredGames, 12)
不 slice，12 小時內即將開賽的所有 SCHEDULED 比賽都應顯示
```

已驗證：

```bash
npm run fetch:events-cpbl
npx tsc --noEmit
```

驗證結果：

```txt
2026-05-10 CPBL 三場皆為 SCHEDULED / 17:05 / 0-0
首頁今日焦點賽事可顯示 CPBL 尚未開賽賽事
```

重要 commit：

```txt
7e10dbe Fix home focus games and CPBL scheduled status
```

注意：

```txt
若首頁某聯盟賽事沒出現，先確認 server/data/eventsCenter.<league>.json 是否已更新到當日
再確認該賽事是否為 SCHEDULED 且開賽時間在 12 小時內
不要先改 UI
```


更新規則：

```txt
平常不抓
開賽前 10 分鐘開始抓
比賽中抓
開賽後最多追 4 小時
每 5 分鐘更新一次
```

### NPB LIVE / FINAL 判斷修正紀錄

問題：

```txt
NPB 官方狀態文字會出現「5回終了」「7回終了」
這代表該局結束，不是比賽結束
不能用單純 stateText.includes('終了') 判斷 FINAL
```

正確規則：

```txt
「回終了」仍應視為 LIVE
只有「試合終了」或「ゲームセット」才可視為 FINAL
```

已修正位置：

```txt
server/providers/npbOfficial.ts
```

修正重點：

```txt
extractHeaderScoreGames() 負責判斷 LIVE / FINAL
enrichGameWithLineScore() 只補 detail line score，不再改 status
不可掃整個 detail HTML 找「試合終了」，避免抓到非本場或頁面其他文字造成誤判
```

驗證方式：

```bash
npm run fetch:events-npb
npm run validate:events
```

目前狀態：

```txt
NPB LIVE 狀態可正確顯示
validate:events 可通過
NPB inning sum mismatch 仍可能出現 WARN，但不阻擋 workflow
```

## 旅外球員頭像修正紀錄

問題：

```txt
NPB / KBO 旅外球員在列表、詳情、首頁追蹤區頭像顯示不一致
有些畫面只顯示球隊 logo 或姓名首字
```

確認結果：

```txt
components/AbroadPlayerAvatar.tsx 本身邏輯正確
優先順序為 officialPhotoUrl → local player photo → team logo → 姓名首字
app/(tabs)/abroad.tsx 與 app/(tabs)/abroad/[id].tsx 已正確傳入 officialPhotoUrl
```

NPB 修正：

```txt
server/providers/npbAbroad.ts 已能在 NPB_FETCH_PHOTOS=1 時抓官方照片
NPB 預設非每月指定日期不抓照片，避免過度抓取
需要補照片時可執行：NPB_FETCH_PHOTOS=1 npm run fetch:abroad-live
```

KBO 修正：

```txt
server/providers/kboAbroad.ts 已新增官方照片解析
避免抓到韓華官網語言切換 icon，例如 ico_lang_ko.png
王彥程官方照片可正確解析為 /KBO_IMAGE/person/middle/2026/56719.jpg
```

remote/local 覆蓋問題：

```txt
useAbroadLiveData 原本會先顯示 local fallback，接著 fetch GitHub raw remote
如果 remote 的 abroadPlayers.live.json 較舊，會把 local 裡的 officialPhotoUrl 蓋成 undefined
目前 hooks/useAbroadLiveData.ts 暫時改為 remoteUrl: undefined
hooks/useLiveJson.ts 已允許 remoteUrl optional
沒有 remoteUrl 時只使用 fallbackPayload，不 fetch remote
```

首頁追蹤區修正：

```txt
components/TrackedAbroadSection.tsx 已改用 AbroadPlayerAvatar
首頁追蹤區也會 merge seedAbroadPlayers + livePlayers
首頁、旅外列表、球員詳情頁目前共用同一套頭像邏輯
```

目前旅外頭像資料流：

```txt
server/providers/npbAbroad.ts / kboAbroad.ts
↓
server/data/abroadPlayers.live.json officialPhotoUrl
↓
hooks/useAbroadLiveData.ts
↓
mergeAbroadPlayerViewModels(seed, live)
↓
AbroadPlayerAvatar
↓
首頁追蹤區 / 旅外列表 / 球員詳情頁
```

已驗證：

```bash
npx tsc --noEmit
npm run fetch:abroad-live
NPB_FETCH_PHOTOS=1 npm run fetch:abroad-live
```

已推上 main：

```txt
KBO / NPB 官方照片可顯示
首頁追蹤區可顯示 officialPhotoUrl
main 已同步到 GitHub
```

後續建議：

```txt
不要長期停用 remoteUrl
下一步應做 remote/local smarter merge
remote 缺欄位時不可用 undefined 覆蓋 local 有值欄位
特別是 officialPhotoUrl、teamMeta、recentGames、seasonStats
```

注意：

```txt
不要把頭像 fallback 分散寫在 UI
AbroadPlayerAvatar 應維持為唯一頭像顯示元件
UI 只傳 player viewModel，不自行判斷照片來源
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

```md

### 第八階段已完成紀錄

已清除：

```txt
components/parallax-scroll-view 2.tsx
kbo.rtf
app/abroad/live+api.tsx
api/abroad/live.ts
api/events-center/mlb.ts
```

判斷結果：

```txt
app/api/abroad/live+api.ts
app/api/events-center/mlb+api.ts
```

為目前 Expo Router / web output server 合理 API route，保留。

```txt
api/abroad/live.ts
api/events-center/mlb.ts
```

為舊式 Vercel / serverless API 入口，目前專案沒有部署線索引用，已移除。

已驗證：

```bash
npx tsc --noEmit
npm run fetch:abroad-live
npm run fetch:events-mlb
npm run fetch:events-npb
npm run fetch:events-kbo
npm run fetch:events-cpbl
```

驗證結果：

```txt
TypeScript OK
四聯盟 fetch OK
旅外 live fetch OK
main 已同步 GitHub
```

收尾檢查：

```bash
git status --short
npx tsc --noEmit
find . -name ".DS_Store"
find . -name "*.bak" -o -name "* 2.*" -o -name "*.rtf"
```

目前僅剩：

```txt
assets/brand/yaren-one-logo 2.png
assets/brand/yaren-one-logo 2.ai
```

這兩個屬於品牌 Logo 備用 / 向量來源檔，暫時保留，不列為垃圾檔。

重要 commit：

```txt
5385950 Clean duplicate and legacy project files
1402165 Remove misplaced abroad API route duplicate
6379039 Remove legacy API directory
```
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
3. 第三階段最小版：buildSummary 拆分、mergeAbroadPlayers 瘦身（已完成）
4. 修正 NPB validate / workflow，確認四聯盟驗證通過（已完成）
5. 第五階段：useHomeGames / useSmartLeagueRefresh / homeGameSelector（已完成）
6. 第三階段後續版：mergeRecentGames / mergeSeasonStats / mergeNews
7. 第六階段：抽 shared scoreboard domain，再重整 UI viewModel
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

```md

---

# 第九階段：交接文件與架構鐵則

## 目的

第九階段不是新增功能，而是防止架構再次分裂。

目前專案已完成多輪重整：

```txt
資料流整理
manual layer
provider / merge 初步分離
eventsCenter 四聯盟統一
首頁 smart refresh
UI viewModel 化方向
重複與舊檔清理
```

後續任何對話或 AI 接手前，必須先讀本文件，再改檔案。

## 下一個對話必讀順序

```txt
1. APP_ARCHITECTURE_CLEANUP_PLAN.md
2. 專案交接規則.rtf / 交接規則摘要
3. app-file-map.txt（若需要最新檔案表，重新產生）
4. app-import-map.txt（若需要引用關係，重新產生）
5. package.json
6. app.json
7. .github/workflows/update-baseball-data.yml
```

若沒有最新 `app-file-map.txt` 或 `app-import-map.txt`，不要靠猜測新增檔案。

## 架構鐵則

```txt
server/providers = 抓資料 / parse / normalize
server/fetch-*.ts = 組合 provider 並輸出 JSON
server/merge = 決定覆蓋順序與資料保留
server/data = 最終輸出 JSON
lib = app 讀資料與轉換
hooks = 畫面需要的狀態與 refresh 行為
components = 純 UI 呈現
app = route / page composition
```

禁止反向操作：

```txt
UI 不做 provider 判斷
UI 不做資料 merge
provider 不寫人工補丁
data 不放 live 暫存邏輯
server/data JSON 不手改當成長期資料來源
```

## API route 規則

目前保留：

```txt
app/api/abroad/live+api.ts
app/api/events-center/mlb+api.ts
```

原因：

```txt
package.json 使用 expo-router/entry
app.json 設定 web.output = server
所以 app/api/*+api.ts 是 Expo Router server output 的合理入口
```

已刪除：

```txt
api/abroad/live.ts
api/events-center/mlb.ts
app/abroad/live+api.tsx
```

禁止再新增平行 API：

```txt
api/xxx.ts
app/abroad/xxx+api.tsx
pages/api/xxx.ts
```

除非明確改變部署平台，並同步更新本文件。

## 首頁規則

首頁資料流固定：

```txt
server/data/*.json
↓
lib/* league reader
↓
lib/homeGameSelector.ts
↓
hooks/useHomeGames.ts
hooks/useSmartLeagueRefresh.ts
↓
app/(tabs)/index.tsx
↓
ScoreboardCard
```

首頁不可再直接寫四聯盟 fetch / merge / sort。

若首頁賽事顯示錯，排查順序：

```txt
1. server/data/eventsCenter.<league>.json 是否正確
2. lib/<league>.ts 是否正確讀取
3. lib/homeGameSelector.ts 是否挑選正確
4. hooks/useHomeGames.ts 是否取得正確日期
5. ScoreboardCard 是否只是顯示錯
```

不要第一步就改 UI。

## eventsCenter 規則

四聯盟 eventsCenter JSON 應統一：

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

狀態判斷注意：

```txt
SCHEDULED 不可被舊 box/live FINAL 覆蓋
NPB 的「5回終了」「7回終了」是 LIVE，不是 FINAL
只有「試合終了」「ゲームセット」才是 FINAL
主隊是下半局 / homeLine
客隊是上半局 / awayLine
```

## 旅外球員規則

旅外資料流固定：

```txt
data/abroadPlayers.ts seed
↓
server/data/abroadPlayers.seed.json
↓
server/providers/*Abroad.ts
↓
server/fetch-abroad-data.ts
↓
server/data/abroadPlayers.live.json
↓
hooks/useAbroadLiveData.ts
↓
mergeAbroadPlayerViewModels(seed, live)
↓
AbroadPlayerAvatar / abroad UI
```

頭像規則：

```txt
AbroadPlayerAvatar 是唯一頭像顯示元件
UI 不自行判斷 officialPhotoUrl / team logo / initials
```

remote/local merge 後續重點：

```txt
remote 缺欄位時，不可用 undefined 覆蓋 local 有值欄位
特別是 officialPhotoUrl、teamMeta、recentGames、seasonStats
```

## GitHub Actions 規則

目前主要 workflow：

```txt
.github/workflows/update-baseball-data.yml
```

目前仍偏重，後續應拆成：

```txt
update-live-games.yml
update-abroad-data.yml
update-static-data.yml
```

原則：

```txt
LIVE 資料才高頻更新
旅外資料低頻更新
靜態資料手動或每日更新
manual 永遠優先
```

## 禁止新增的平行檔案

沒有明確理由，不要新增：

```txt
ScoreboardCard2.tsx
NewScoreboardCard.tsx
LeagueCalendarPage2.tsx
cpbl-new.tsx
mlb-new.ts
npb-new.ts
kbo-new.ts
home-new.tsx
api/xxx.ts
app/abroad/xxx+api.tsx
backup-xxx.ts
test-xxx.ts
```

應優先修改現有負責檔案。

## 每次改動前必問

```txt
1. 這是 UI 問題、資料問題、抓資料問題、merge 問題，還是 route 問題？
2. 現有哪個檔案已經負責這件事？
3. 是否真的需要新增檔案？
4. 改完要跑哪個驗證？
```

## 基本驗證指令

一般改動：

```bash
npx tsc --noEmit
```

改四聯盟資料：

```bash
npm run fetch:events-mlb
npm run fetch:events-npb
npm run fetch:events-kbo
npm run fetch:events-cpbl
npx tsc --noEmit
```

改旅外資料：

```bash
npm run export:abroad-seed
npm run fetch:abroad-live
npx tsc --noEmit
```

改 GitHub Actions：

```bash
npx tsc --noEmit
# 並到 GitHub Actions 頁面確認 workflow 結果
```

## 目前下一步建議

第九階段完成後，下一階段建議處理：

```txt
remote/local smarter merge
```

原因：

```txt
目前曾因 remote GitHub raw 版本較舊，導致 local live 裡的 officialPhotoUrl 被 undefined 蓋掉
後續應建立欄位級 merge 規則
remote 缺值不可覆蓋 local 有值
```

優先檔案：

```txt
hooks/useAbroadLiveData.ts
hooks/useLiveJson.ts
lib/viewModels/abroadPlayerViewModel.ts
```

第九階段結論：

```txt
先穩架構，再加功能。
任何新功能都必須接在既有資料流上，不新增平行世界。
```
```
