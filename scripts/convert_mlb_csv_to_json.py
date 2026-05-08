

#!/usr/bin/env python3
"""Convert data/mlb-2026.csv into data/mlb-2026.json for the app calendar."""

from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IN_CSV = ROOT / "data" / "mlb-2026.csv"
OUT_JSON = ROOT / "data" / "mlb-2026.json"

DEFAULT_INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9]


def parse_score(value: str) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def format_display_time(value: str) -> str:
    if not value:
        return "待定"

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return value

    return parsed.strftime("%H:%M")


def build_empty_line(team_short: str, score: int) -> dict:
    return {
        "team": team_short,
        "innings": ["", "", "", "", "", "", "", "", ""],
        "r": score,
        "h": "",
        "e": "",
    }


def normalize_row(row: dict) -> dict:
    away_score = parse_score(row.get("awayScore", "0"))
    home_score = parse_score(row.get("homeScore", "0"))
    away_short = row.get("awayShort") or row.get("awayTeam", "Away")[:3].upper()
    home_short = row.get("homeShort") or row.get("homeTeam", "Home")[:3].upper()
    official_date = row.get("officialDate", "")
    display_time = format_display_time(row.get("displayTime") or official_date)

    return {
        "id": row.get("id") or f"mlb-{row.get('gamePk', '')}",
        "gamePk": parse_score(row.get("gamePk", "0")),
        "league": "MLB",
        "gameDate": row.get("gameDate", ""),
        "status": row.get("status") or "SCHEDULED",
        "awayTeam": {
            "name": row.get("awayTeam", "Away"),
            "short": away_short,
            "record": "",
        },
        "homeTeam": {
            "name": row.get("homeTeam", "Home"),
            "short": home_short,
            "record": "",
        },
        "awayScore": away_score,
        "homeScore": home_score,
        "innings": DEFAULT_INNINGS,
        "awayLine": build_empty_line(away_short, away_score),
        "homeLine": build_empty_line(home_short, home_score),
        "footerLeft": "SCHEDULED",
        "footerRight": display_time,
        "gameTime": display_time,
        "venue": row.get("venue", ""),
        "officialDate": official_date,
    }


def main() -> int:
    if not IN_CSV.exists():
        raise FileNotFoundError(f"Missing input CSV: {IN_CSV}")

    with IN_CSV.open("r", encoding="utf-8-sig", newline="") as file:
        rows = list(csv.DictReader(file))

    games = [normalize_row(row) for row in rows if row.get("gameDate")]
    games.sort(key=lambda game: (game["gameDate"], game.get("officialDate", ""), game["id"]))

    games_by_date: dict[str, list[dict]] = {}
    for game in games:
        games_by_date.setdefault(game["gameDate"], []).append(game)

    dates = sorted(games_by_date.keys())
    payload = {
        "updatedAt": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "season": 2026,
        "startDate": dates[0] if dates else "",
        "endDate": dates[-1] if dates else "",
        "games": games,
        "gamesByDate": games_by_date,
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUT_JSON.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")

    print(f"Wrote MLB schedule JSON to {OUT_JSON}")
    print(f"Games: {len(games)}")
    if dates:
        print(f"Range: {dates[0]} → {dates[-1]}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
