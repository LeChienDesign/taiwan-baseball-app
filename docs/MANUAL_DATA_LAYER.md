# Manual Data Layer

Manual data layer 是官方 / remote / local / fallback 資料之後的最後人工覆寫層。

```txt
official / remote / local / fallback
↓
manual override
↓
UI
```

## Files

```txt
server/data/manual/
  abroadPlayers.manual.json
  cpbl.manual.json
  mlb.manual.json
  npb.manual.json
  kbo.manual.json
```

## League game manual format

```json
{
  "games": {
    "2026-05-05-中信兄弟-味全龍": {
      "status": "FINAL",
      "awayScore": 3,
      "homeScore": 5,
      "footerLeft": "FINAL",
      "footerRight": "Manual checked"
    }
  },
  "teams": {},
  "notes": []
}
```

## Supported game keys

```txt
game.id
game.gamePk
YYYY-MM-DD-awayTeam-homeTeam
```

## Abroad players manual format

```json
{
  "players": {
    "yen-cheng-wang": {
      "team": "Hanwha Eagles",
      "level": "一軍 / 韓華鷹",
      "status": "待命",
      "teamMeta": {
        "code": "HAN",
        "abbreviation": "HAN",
        "logoKey": "hanwha-eagles",
        "displayName": "韓華鷹",
        "leagueGroup": "KBO"
      }
    }
  },
  "notes": []
}
```

## Shared helper

```txt
lib/manual/applyGameManualOverrides.ts
```

Used by:

```txt
lib/mlb.ts
lib/npb.ts
lib/kbo.ts
lib/cpbl.ts
```

## Rule

Manual always wins.

適合用在：

```txt
官方資料錯誤
LIVE 狀態延遲
比分修正
局間比分修正
team / logo / teamMeta 修正
球員狀態修正
臨時緊急補丁
```
