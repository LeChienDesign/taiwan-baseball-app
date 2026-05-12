# Taiwan Baseball App 架構重整計畫

> 這份文件是跨對話視窗的交接錨點。目的不是記錄所有細節，而是防止下一次接手時重新踩同樣的架構雷。

---

# 0. 專案核心鐵則

```txt
不生成圖片 專心改code
不要新增平行檔案
UI 不做 merge
UI 不直接 fetch 四聯盟
provider 不做 UI
provider 不寫人工 UI patch
server/data 不手改當長期資料源
manual 永遠優先
remote 缺值不可覆蓋 local
live data 不可覆蓋 static seed 核心資料
```

## 禁止的開發方式

```txt
看到 UI 壞 → 直接 patch component
看到資料少 → 直接手改 JSON
看到 merge 問題 → 再新增一層 merge
看到 bug → 新增 xxx-new.ts
看到 route 問題 → 再長一套 api
```

## 文件維護規則

```txt
計劃書 / 交接文件以補充與整理為主
可以刪重複、合併低風險提醒
不可刪除會導致資料錯、workflow 錯、架構分裂的踩雷紀錄
不可把未完成事項改寫成已完成
```

---

# 1. 專案架構總覽

## 核心資料流

```txt
server/providers
↓
server/fetch-*.ts
↓
server/data/*.json
↓
lib/
↓
hooks/
↓
components/
↓
app/
```

## 各層責任

```txt
provider = 抓資料 / parse / normalize
fetch = 組合 provider / merge / output JSON
server/data = 最終 live cache
lib = app 讀取與資料轉換
hooks = refresh / polling / app state
components = UI 呈現
app = route / page composition
```

## 禁止反向污染

```txt
components 不做 merge
components 不做 provider 判斷
hooks 不直接 parse HTML
provider 不處理 UI 文案
server/data 不放畫面邏輯
```

---

# 2. Phase 完成進度

```txt
Phase 1 資料流整理
Phase 2 manual layer
Phase 3 provider merge 初步拆分
Phase 4 eventsCenter 四聯盟統一
Phase 5 首頁 smart refresh（規則已定義，待正式完整執行）
Phase 6 UI viewModel 化方向
Phase 7 remote/local merge 修正
Phase 8 cleanup / legacy 移除
Phase 9 handoff rules / 架構鐵則
```

目前狀態：

```txt
四聯盟 live 資料已統一
首頁 focus game 已集中
旅外資料已 provider 化
API route 已清理
重複檔案已大幅移除
```

---

# 3. 首頁架構規則

## 首頁資料流

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

## 首頁禁止事項

```txt
首頁不可自己 merge 四聯盟
首頁不可自己 fetch league
首頁不可自己 sort live game
首頁不可自己 patch status
首頁不可自己組 logo
首頁不可自己寫 refresh interval / AppState
```

## 首頁排查順序

```txt
1. server/data/eventsCenter.<league>.json
2. lib/<league>.ts
3. lib/homeGameSelector.ts
4. hooks/useHomeGames.ts
5. hooks/useSmartLeagueRefresh.ts
6. app/(tabs)/index.tsx
7. ScoreboardCard
```

不要第一步就改 UI。

## smart refresh 規則

```txt
LIVE = 高頻刷新
12 小時內即將開賽 = 中頻刷新
FINAL 後冷卻追 30～60 分鐘
非比賽時段 = 低頻或不刷新
App 回前景只刷新需要的 league，不 refresh all
```

固定定義：

```txt
今日焦點賽事 = 現在起 12 小時內即將開賽的 SCHEDULED 比賽
LIVE 比賽由 liveGames 顯示，不混進 displayedGames
```

---

# 4. 四聯盟 eventsCenter 規則

## 標準格式

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

## 狀態與比分規則

```txt
SCHEDULED 不可被舊 FINAL 覆蓋
LIVE 不可被舊 box score 覆蓋
0-0 不等於 FINAL
FINAL 優先權 > inning text
只要 currentInning / inningState 存在，應視為 LIVE
manual priority > remote
```

## 主客隊規則

```txt
主隊 = 下半局 = homeLine
客隊 = 上半局 = awayLine
首頁比分確認不能只看數字
```

## NPB 特殊規則

```txt
「5回終了」= LIVE
「7回終了」= LIVE
「試合終了」= FINAL
「ゲームセット」= FINAL
官方缺局分時可 WARN / skip inning sum
總分與 line.r 不一致才是 ERROR
```

## CPBL 特殊規則

```txt
schedule page > live detail fallback
若 schedule 顯示尚未開始 / 未開賽 / HH:mm，舊 FINAL 不可覆蓋
CPBL 局間比分來源是 ScoreboardJson，不是 VisitingScoreboards / HomeScoreboards
```

---

# 5. 旅外球員系統

## 旅外資料流

```txt
data/abroadPlayers.ts
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
mergeAbroadPlayerViewModels()
↓
AbroadPlayerAvatar
↓
abroad UI
```

## 旅外 merge 鐵則

```txt
remote 缺值不可覆蓋 local
undefined 不可覆蓋 existing value
manual patch 永遠優先
seed = 初始化資料
live = UI 主要資料來源
UI 不自行 seed + live merge
```

高風險欄位：

```txt
officialPhotoUrl
teamMeta
recentGames
seasonStats
news
```

## 頭像規則

```txt
AbroadPlayerAvatar 是唯一頭像元件
UI 不自行判斷 officialPhotoUrl
UI 不自行 fallback initials
UI 不自行判斷 team logo
```

## NPB 旅外補充

```txt
NPB 打者 recentGames 不可只靠 alias 搜尋
box score parser 優先
後續應建立 npbPlayerAlias.ts 統一中文名 / 英文名 / 假名 / roster 名稱
```

---

# 6. API / 部署規則

目前保留：

```txt
app/api/abroad/live+api.ts
app/api/events-center/mlb+api.ts
```

原因：

```txt
package.json 使用 expo-router/entry
app.json 使用 web.output = server
目前為 Expo Router server output 架構
```

已移除：

```txt
api/abroad/live.ts
api/events-center/mlb.ts
app/abroad/live+api.tsx
```

禁止新增：

```txt
api/*.ts
pages/api/*.ts
app/abroad/*+api.tsx
```

除非整個部署平台改變。

---

# 7. GitHub Actions / Remote JSON 規則

## workflow 分工

目前主要 workflow：

```txt
.github/workflows/update-baseball-data.yml
```

後續拆分方向：

```txt
update-mlb-events.yml
update-npb-events.yml
update-kbo-events.yml
update-cpbl-events.yml
update-abroad-data.yml
update-static-data.yml
```

更新原則：

```txt
LIVE data = 高頻
旅外資料 = 中頻
static data = 低頻
manual layer 永遠優先
一支 workflow 只負責一種資料
每個 workflow name 必須唯一
```

## workflow 高風險規則

```txt
不要用全成功才 commit
任一聯盟成功更新，就應允許該聯盟 JSON push
update-abroad-data.yml 不可 git add eventsCenter.*.json
aggregate workflow 不可高頻 schedule，應只保留 workflow_dispatch
不要用 || true 掩蓋 validate 錯誤
把可接受缺資料降級 WARN，真正資料錯誤保留 ERROR
```

## GitHub raw JSON 判斷順序

```txt
raw JSON 不新 → workflow / commit 問題
raw JSON 新、App 不新 → App remote fetch / Expo cache 問題
```

常用檢查：

```bash
curl -L 'https://raw.githubusercontent.com/LeChienDesign/taiwan-baseball-app/main/server/data/eventsCenter.cpbl.json?t='$(date +%s)
```

原則：

```txt
raw JSON 是 App 遠端資料的 source of truth
不要先怪 UI
GitHub Actions cron 不保證每 5 分鐘準時
```

---

# 8. 時區與日期規則

```txt
gameDate 永遠優先
footerRight 只能當 UI 顯示，不可反推開賽時間
Provider 層負責唯一時間轉換
lib 不做二次轉換
UI 不碰時區
MLB 使用 todayTaipei + todayNewYork 雙日期策略
```

禁止：

```txt
footerRight 再推算 gameDate
UI 自己 parse HH:mm
provider 轉一次、lib 再轉一次
```

---

# 9. Provider / Merge / ViewModel 規則

## provider 規則

```txt
provider 只負責 fetch / parse / normalize
provider 不產生 UI 文案
provider 不補假資料
缺值保持 undefined，不幻想補 0-0
```

## merge 規則

```txt
merge 最多集中兩層：fetch layer / viewModel layer
UI 禁止 merge
禁止 Object.assign(existing, incoming) 直接硬蓋
remote snapshot 可能比 local 舊
local runtime live > remote snapshot
```

## viewModel 規則

```txt
viewModel 化必須一層一層接
先新增 viewModel
先接單一 component
tsc OK
commit
再往下一層接
```

注意：

```txt
UI props 不等於資料層型別
若資料會直接進 UI Text，避免 unknown
ScoreboardCard line score 欄位允許 number | string
```

---

# 10. Shared Hook / Live Refresh 規則

目前已有：

```txt
hooks/useLiveJson.ts
```

責任：

```txt
remote fetch
cache bust
fallback payload
manual refresh
foreground refresh
active polling
loading / refreshing / error
```

禁止：

```txt
每個頁面自己寫 AppState
每個 hook 自己寫 setInterval
每個 league 自己寫 cache bust
每個畫面自己處理 fallback json
shared hook import 自己
```

抽 shared hook 流程：

```txt
1. 建立 shared hook
2. npx tsc --noEmit
3. commit shared hook
4. 接單一 caller
5. npx tsc --noEmit
6. commit caller migration
```

---

# 11. server/data JSON 規則

```txt
server/data/*.json 是 cache snapshot
不是修正規則
不要手改大型 live JSON 當長期解法
workflow 下一次會覆蓋
真正規則要放 provider / manual layer / validator / viewModel
```

rebase conflict 時：

```bash
git checkout --theirs server/data/eventsCenter.npb.json
# 或重新 fetch 生成
npm run fetch:events-npb
npm run fetch:abroad-live
```

禁止手修大型 JSON conflict，避免留下：

```txt
<<<<<<< HEAD
=======
>>>>>>> commit
```

---

# 12. 禁止新增的平行檔案

---

# 12.5 UI 重構規則（2026-05 新增）

## UI 改版核心方向

```txt
復古棒球票券 / 美式球場 / 會員卡
不是科技 dashboard
不是玻璃擬態
不是 Expo 預設風格
```

主色：

```txt
#FFF7E9 米白紙張
#0B2346 深藍
#F0642B 橘色
```

避免：

```txt
過度 glow
玻璃 blur
大量漸層
科技藍發光
不同頁面不同世界觀
```

---

## UI 架構原則

```txt
先統一 shared component
再改 page composition
先統一 spacing rhythm
再補特殊動畫
```

```txt
shared component 改完
所有 page 必須同步套用
不要首頁一套、內頁另一套
```

---

## UI 禁止事項

```txt
不要新增 NewScoreboardCard.tsx
不要新增新版 page 平行檔案
不要局部改色但保留舊 spacing system
不要 page hardcode style 蓋 shared component
不要 UI component 自己做資料 merge
```

---

## 本次首頁改版涉及檔案

```txt
app/(tabs)/_layout.tsx
app/(tabs)/index.tsx

components/AppEmptyState.tsx
components/HomeQuickActions.tsx
components/ScoreboardCard.tsx
components/TrackedAbroadSection.tsx
```

原則：

```txt
首頁風格變更優先從 shared component 開始
不要先 patch page
```

---

## UI 改版順序

```txt
1. shared card
2. scoreboard
3. empty state
4. tab bar
5. section spacing
6. page composition
7. typography
8. animation / polish
```

---

## LIVE GAMES 後續優化

```txt
隊名字距重新配置
logo 對比提高
中央比分區降低工程感
line score density 微調
LIVE badge 再票券化
```

---

## TODAY FOCUS 後續優化

```txt
empty state 高度降低
card density 提高
focus card 更像球場票券
增加 hero game 感
```

---

## Hero 後續優化

```txt
safe area spacing 微調
更像真實 ticket / season pass
加入品牌字體
加入 subtle texture
```

---

## Typography 後續方向

```txt
建立 typography token
避免直接散寫 fontWeight
避免 iOS / Android 顯示差異
未來建立：
display
headline
title
body
caption
score
```

---

## UI 最終目標

```txt
不是「棒球資料 app」
而是「棒球品牌 app」
```

---

## 首頁復古票券版調整紀錄（2026-05-11）

目前首頁主視覺方向：

```txt
App 名稱：野席報
副標：球場通信
風格：復古棒球票券 / 舊紙質感 / 美式球場通信
主背景：paper_bg.png
Hero：棒球帽、baseball_map、PLAY EVERY DAY 等復古圖像元素
右上通知：horn.png，LIVE 有比賽時顯示紅點
首頁上方品牌列 topBar 已移出 ScrollView，固定不跟著內容滑動
topBar 保留舊紙背景視覺上的延續感，主要靠 container / paper_bg，不另外做黑色 header
下方 tab bar 後續方向改接近 Today’s Games 的紙感底色，不走深藍大色塊
```

首頁主要圖片資源：

```txt
assets/yaren_one_icons_png_pack/paper_bg.png
assets/yaren_one_icons_png_pack/score_ticket_bg.png
assets/yaren_one_icons_png_pack/today_games_ticket_bg.png
assets/yaren_one_icons_png_pack/player_focus_ticket_bg.png
assets/yaren_one_icons_png_pack/horn.png
```

LIVE / 比分票券調整：

```txt
liveScoreCard 使用 score_ticket_bg.png
scoreTicketBg 不再改動比例，內容靠 padding / row style 對齊
LIVE badge 保留外框，但只有內部小點呼吸
LIVE / 例行賽 / 今日場次 / LIVE 數字放在 liveMetaRow
今日場次與 LIVE 後方數字使用比分字體 APP_FONT
liveStatNumber 使用橘色 #E85F2A，保留雙位數空間 minWidth
```

Today’s Games 票券調整：

```txt
Today’s Games 使用 today_games_ticket_bg.png
不新增新 component，先維持在 app/(tabs)/index.tsx 微調
Today’s Games 目前顯示 5 場比賽
不顯示 MLB / CPBL / NPB / KBO label
時間放左側欄位 gameTime
隊伍與 vs 分開渲染：away / vs / home
vs 固定使用 APP_FONT，不跟中文隊名一起換字體
中文隊名才套 gameTeamTextCn / CN_FONT
隊伍與 vs 顏色統一為 #F7D9B8，與 TODAY'S GAMES 一致
底圖尺寸與內容位置分開調，避免文字撐壞票券比例
```

Today’s Games 可微調位置：

```txt
todayGamesCard.flex：控制左卡寬度
playerFocusCard.flex：控制右卡寬度
gridRow.gap：控制兩張卡中間距
todayGamesCard.height / minHeight / maxHeight：控制整張票券固定高度
todayGamesCardBgImage：控制底圖本身，必須 absoluteFillObject，不讓資料撐開底圖
todayGamesContentLayer.paddingLeft / paddingRight：控制內容左右位置
todayGamesContentLayer.paddingTop / paddingBottom：控制內容上下位置
todayGamesFixedList.height：控制賽事列表固定可視高度，被遮擋先調這裡
gameListRow.minHeight / marginBottom：控制每場高度與行距
flipTimeCell.width / minHeight：控制左側時間翻牌格
flipMatchupCell.minHeight / paddingHorizontal：控制右側對戰翻牌格
gameTeamLogo.width / height：控制隊伍 logo 大小
gameLogoMatchupWrap.gap：控制兩隊 logo 與 vs 間距
gameVsText.width / fontSize / lineHeight：控制 vs 欄
```

Today’s Games 近期踩雷紀錄：

```txt
1. 不要用 displayedGames 當 Today’s Games 唯一來源；displayedGames 是首頁焦點篩選，不等於今日全部賽程。
2. Today’s Games 目前需求是「未開賽 + 未來 12 小時內」，LIVE / FINAL / 局數文字都要排除。
3. footerRight 可以當 UI 顯示與 fallback 時間，但不應長期在 UI 反推 gameDate；正規解法仍應回 provider 補標準 startTime。
4. CPBL 曾只有 footerRight = 18:35，若 getGameStartDate 沒讀 footerRight，Today’s Games 會空白。
5. MLB 檔案日期常是美國日期，例如台灣 5/12 時 eventsCenter.mlb.json 可能是 2026-05-11；首頁要用 MLB 檔案最新 key 或由 selector 統一處理，不要硬套 todayKey。
6. NPB / KBO / CPBL 用台灣日期，MLB 用美國日期，這個差異不可在 UI 隨手 parse 修補。
7. Today’s Games 最多顯示 5 場，超過 5 場用翻頁 / 翻牌，不要撐高卡片。
8. Today’s Games 底圖必須和資料層分離：底圖 absolute、內容 fixed layer，否則資料多寡會把票券拉伸變形。
9. Today’s Games 與 Player Focus 左右卡高度要同時固定，例如 height / minHeight / maxHeight 都設 178，避免左右互相拉伸。
10. logo 不顯示先查 eventsCenter team.logoKey，再查 constants/teamLogos.ts 與 assets 是否有對應，不要先改 UI。
11. CPBL logo 檔名目前使用中文，例如 assets/cpbl/味全龍.png、統一7-ELEVEn獅.png；若用英文 logoKey，要在 localTeamLogoByKey 或 teamLogos alias 明確對應。
12. constants/teamLogos.ts 沒有固定 export getTeamLogo 時，不能直接 named import；曾造成 getTeamLogo is undefined。可用既有 export 或 namespace fallback，但長期應整理成明確 export。
13. 養樂多 key 對應為 swallows，eventsCenter 若出現 yakult-swallows / tokyo-yakult-swallows，需要 alias 到 swallows。
14. 改 Today’s Games 排版時，只改 index.tsx 既有區塊；不要新增平行 component，也不要生成圖片。
```

Player Focus 票券調整：

```txt
Player Focus 使用 player_focus_ticket_bg.png
playerFocusCard 與 todayGamesCard 用 flex 分配寬度
目前曾調整為 todayGamesCard flex 1.15 / playerFocusCard flex 0.85
若需要左右等寬，兩者都改回 flex: 1
Player Focus 不再固定只顯示林安可，改為最近 2 天有出賽的旅外球員自動切換
recentActivePlayers 以 recentGames[0] 日期判斷，無符合球員時 fallback 林安可
自動切換間隔約 4.2 秒
圖像使用 AbroadPlayerAvatar，外層可加 avatar_ring.png 作為頭像前景圈
avatar ring 要放在頭像前面，使用 zIndex 高於頭像，並可用 opacity 做半透明
avatar ring 不要直接在 Image 上加 pointerEvents，React Native ImageProps 會 TS2769；要包一層 View pointerEvents="none"
白底 playerTicketPanel 已移除，backgroundColor 改 transparent
查看球員動態改為絕對定位 playerFooterButton，避免擠壓上方數據
查看球員動態隔線已移除，不再使用 borderTopWidth / borderTopColor
下方數據跟著切換球員：打者顯示打擊數據，投手顯示投球數據
數據改回英文縮寫顯示，避免中文太擠
vs 對手隊名優先使用 opponentAbbr / opponentCode，fallback 才用隊名轉縮寫
球員英文名不要 UI 自己亂組縮寫；優先讀資料源欄位 nameAbbrEn / abbrNameEn / shortNameEn / displayNameAbbr
若資料源沒有縮寫，再 fallback 原英文名大寫
```

Player Focus 可微調位置：

```txt
playerCardTitle：控制 ★ PLAYER FOCUS ★ 標題字級與位置
playerFocusBody.paddingLeft / paddingRight / paddingTop：控制整組球員圖與數據位置
playerAvatarStack.width / height / marginLeft / marginRight / translateY：控制頭像整組位置
playerAvatarRing.width / height / left / top / opacity：控制頭像前景圈大小、位置、透明度
playerTicketPanel.left / right / bottom / alignItems：控制下方近期數據位置與齊右
focusNumber.fontSize / lineHeight / marginRight：控制背號
focusHeaderRow.left / right / bottom：控制背號與姓名整組位置
focusName.fontSize / lineHeight：控制英文名
focusSubName.fontSize / lineHeight：控制中文名
focusGameTitle.fontSize / lineHeight / textAlign：控制日期與 vs 對戰文字
focusGameStatsBox.alignSelf / marginTop：控制數據盒寬度與上方距離
focusGameLine.fontSize / lineHeight / fontFamily / textAlign：控制打擊 / 投手英文數據
playerFooterButton.right / bottom：單獨控制查看球員動態位置，不影響上方數據
playerFooter.fontSize / opacity：控制查看球員動態文字大小與存在感
```


Player Focus 字體規則：

```txt
英文與數字使用 APP_FONT
中文使用 CN_FONT
混合字串若同一個 Text 內同時有中文與英文，優先拆成多個 Text 分別套字體
不要為了套字體新增平行 component
```

Player Focus 近期踩雷紀錄：

```txt
1. 球員英文名縮寫不要在 UI 猜規則；不同聯盟姓名順序不同，應優先使用資料源 / 聯盟提供的縮寫欄位。
2. 若要顯示縮寫，欄位優先順序為 nameAbbrEn / abbrNameEn / shortNameEn / displayNameAbbr，再 fallback nameEn / enName / englishName。
3. Player Focus 自動切換球員時，頭像、姓名、背號、vs、打擊 / 投手數據都必須跟著同一個 focusPlayer 走。
4. 投手與打者不能共用打擊格式；投手應顯示 IP / H / ER / BB / K / HR，打者才顯示 AB / H / RBI / R / HR / BB / K。
5. playerFooter 不能用一般 flow 排版，否則會擠壓上方數據；應用 playerFooterButton 絕對定位。
6. avatar ring 疊在頭像前面時，Image 不支援 pointerEvents；要用外層 View pointerEvents="none" 包住。
7. avatar ring 尺寸要跟頭像對齊時，先調 width / height / left / top，不要改 AbroadPlayerAvatar 本體。
8. 半透明效果用 opacity 微調即可，不要重新輸出圖片。
```

UI 編輯提醒：

```txt
若只是對齊底圖，不要改資料流
若只是排版，不要新增 component 平行檔
底圖比例不對時，先檢查 resizeMode / minHeight / flex / padding
文字壓線時，先調 paddingTop、gameListRow.marginBottom、lineHeight
不要用假資料修資料架構問題；目前 Today’s Games 仍是首頁暫時排版資料
首頁 topBar 固定方式：把 topBar 放在 ScrollView 外面，ScrollView 只包內容區
topBar 不要用 position absolute 硬蓋，避免 SafeArea / Dynamic Island / refreshControl 互相打架
下方 tab bar 紙感方向：tabBarStyle.backgroundColor 可用 #F2E4CF，inactive tint 用 #0B2346，active tint 保留 #E85F2A
tab bar 若要紙感陰影，可用 shadowColor #7B4F2A / shadowOpacity 0.12 / shadowRadius 10 / elevation 8
底部 tab bar 目前使用 app/(tabs)/_layout.tsx 控制，不在 index.tsx
底部 tab bar 背景圖使用 assets/home/bottom_tab_ticket.png，透過 tabBarBackground + Image resizeMode="stretch" 顯示
底部 tab bar 若不要 icon / 倒三角區域，要在 screenOptions 設 tabBarIcon: () => null，並把 tabBarIconStyle display none / width 0 / height 0 / margin 0
底部 tab bar 文字若要自訂字體，不能只改 fontFamily；_layout.tsx 也必須 useFonts 載入該字體
首頁中文主要字體 key 目前是 ZaoZiGongFangXingHei，來源為 assets/fonts/ZaoZiGongFangXingHei.ttf
tab bar 文字目前用自訂 tabBarLabel 回傳 Text，才可穩定套 styles.tabLabel
若 tab bar 字體怎麼改都沒變，優先檢查該 layout 是否有載入 useFonts，而不是一直換 fontFamily 名稱
bottom tab labels 需求：首頁 / 賽事中心 / 社區棒球 / 旅外球員
```

---

```txt
ScoreboardCard2.tsx
NewScoreboardCard.tsx
LeagueCalendarPage2.tsx
cpbl-new.tsx
mlb-new.ts
npb-new.ts
kbo-new.ts
home-new.tsx
betterProvider.ts
merge2.ts
final-final.ts
backup-xxx.ts
test-xxx.ts
```

原則：

```txt
優先修改既有負責檔案
不要用平行檔案逃避重構
不要因為 bug 再發明新架構
```

---

# 13. Git / 編輯器操作規則

```txt
每次修改後先看 git diff
每次提交前先跑 tsc
push 被拒絕先 rebase
不要 force push
Xcode 顯示 Edited 不等於已存檔
改完 Cmd + S 再跑 tsc / git status
zsh 路徑含括號要加引號
```

常用：

```bash
git status --short
git diff
git diff --cached
git pull --rebase origin main
npx tsc --noEmit
```

路徑範例：

```bash
git add 'app/(tabs)/index.tsx'
```

---

# 14. 驗證流程

## 一般修改

```bash
npx tsc --noEmit
```

## 修改四聯盟

```bash
npm run fetch:events-mlb
npm run fetch:events-npb
npm run fetch:events-kbo
npm run fetch:events-cpbl
npx tsc --noEmit
```

## 修改旅外資料

```bash
npm run export:abroad-seed
npm run fetch:abroad-live
npx tsc --noEmit
```

## 修改 workflow

```bash
npx tsc --noEmit
# 再檢查 GitHub Actions 結果
```

## App 顯示舊資料時

```txt
1. 先查 raw JSON 是否最新
2. raw 最新才檢查 App remote fetch
3. 最後才清 Expo cache
```

需要清 cache 時：

```bash
npx expo start -c
```

---

# 15. 下一階段 Roadmap

## 下一個重點

```txt
remote/local smarter merge
```

原因：

```txt
remote GitHub raw 可能較舊
曾覆蓋 local officialPhotoUrl / live score
未來需欄位級 merge
```

優先檔案：

```txt
hooks/useAbroadLiveData.ts
hooks/useLiveJson.ts
lib/viewModels/abroadPlayerViewModel.ts
```

後續方向：

```txt
完整 viewModel 化
provider normalization
live polling optimization
workflow split
home feed abstraction
manual patch 集中到 data/manual/*
shared schema / shared types
```

---

# 最終結論

```txt
先穩架構，再加功能。
任何新功能都必須接在既有資料流上。
不要新增平行世界。
```
```
