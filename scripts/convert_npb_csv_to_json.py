import csv
import json
from pathlib import Path

INPUT = Path("data/npb-2026-raw.csv")
OUTPUT = Path("data/npb-2026.json")

TEAM_MAP = {
    "Yomiuri Giants": "讀賣巨人",
    "Tokyo Yakult Swallows": "東京養樂多燕子",
    "Yokohama DeNA BayStars": "橫濱 DeNA 海灣之星",
    "Hiroshima Toyo Carp": "廣島東洋鯉魚",
    "Tohoku Rakuten Golden Eagles": "東北樂天金鷲",
    "Chiba Lotte Marines": "千葉羅德海洋",
    "Chunichi Dragons": "中日龍",
    "Hanshin Tigers": "阪神虎",
    "Hokkaido Nippon-Ham Fighters": "北海道日本火腿鬥士",
    "Saitama Seibu Lions": "埼玉西武獅",
    "Fukuoka SoftBank Hawks": "福岡軟銀鷹",
    "Orix Buffaloes": "歐力士猛牛",
}

def to_tw_time(ts: str) -> tuple[str, str]:
    # 原始資料時間看起來是 UTC，轉台灣時間 +8
    # 例如 2026-04-04 05:00:00 -> 2026-04-04 13:00:00 / 13:00
    from datetime import datetime, timedelta
    dt = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
    tw = dt + timedelta(hours=8)
    return tw.strftime("%Y-%m-%d %H:%M:%S"), tw.strftime("%H:%M")

def clean_score(v: str):
    v = (v or "").strip()
    return v if v != "" else ""

def main():
    rows = []

    with INPUT.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            raw_ts = (row.get("strTimestamp") or "").strip()
            if not raw_ts:
                continue

            tw_ts, display_time = to_tw_time(raw_ts)

            home_team_en = (row.get("Home Team") or "").strip()
            away_team_en = (row.get("Away Team") or "").strip()

            home_team = TEAM_MAP.get(home_team_en, home_team_en)
            away_team = TEAM_MAP.get(away_team_en, away_team_en)

            item = {
                "idEvent": (row.get("idEvent") or "").strip(),
                "strTimestamp": tw_ts,
                "Round": "例行賽",
                "Home Team": home_team,
                "Home Score": clean_score(row.get("Home Score") or ""),
                "Away Team": away_team,
                "Away Score": clean_score(row.get("Away Score") or ""),
                "Venue": "",
                "DisplayTime": display_time,
            }

            rows.append(item)

    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    print(f"done: {OUTPUT} ({len(rows)} games)")

if __name__ == "__main__":
    main()