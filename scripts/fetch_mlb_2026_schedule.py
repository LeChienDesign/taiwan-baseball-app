

#!/usr/bin/env python3
"""Fetch MLB 2026 regular-season schedule and export data/mlb-2026.csv.

This is a build-time helper, matching the app's existing season-data scripts.
It does not update live scores. Live data stays in server/fetch-live-baseball-data.ts.
"""

from __future__ import annotations

import csv
import json
import sys
from datetime import date, timedelta
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT_CSV = ROOT / "data" / "mlb-2026.csv"

SEASON = 2026
START_DATE = date(SEASON, 3, 1)
END_DATE = date(SEASON, 11, 30)

MLB_SCHEDULE_URL = "https://statsapi.mlb.com/api/v1/schedule"

TEAM_SHORTS = {
    "Arizona Diamondbacks": "ARI",
    "Athletics": "ATH",
    "Atlanta Braves": "ATL",
    "Baltimore Orioles": "BAL",
    "Boston Red Sox": "BOS",
    "Chicago Cubs": "CHC",
    "Chicago White Sox": "CWS",
    "Cincinnati Reds": "CIN",
    "Cleveland Guardians": "CLE",
    "Colorado Rockies": "COL",
    "Detroit Tigers": "DET",
    "Houston Astros": "HOU",
    "Kansas City Royals": "KC",
    "Los Angeles Angels": "LAA",
    "Los Angeles Dodgers": "LAD",
    "Miami Marlins": "MIA",
    "Milwaukee Brewers": "MIL",
    "Minnesota Twins": "MIN",
    "New York Mets": "NYM",
    "New York Yankees": "NYY",
    "Philadelphia Phillies": "PHI",
    "Pittsburgh Pirates": "PIT",
    "San Diego Padres": "SD",
    "San Francisco Giants": "SF",
    "Seattle Mariners": "SEA",
    "St. Louis Cardinals": "STL",
    "Tampa Bay Rays": "TB",
    "Texas Rangers": "TEX",
    "Toronto Blue Jays": "TOR",
    "Washington Nationals": "WSH",
}


def daterange(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def fetch_json(url: str) -> dict:
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "taiwan-baseball-app schedule builder",
        },
    )

    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def build_schedule_url(start: date, end: date) -> str:
    query = urlencode(
        {
            "sportId": 1,
            "startDate": start.isoformat(),
            "endDate": end.isoformat(),
            "hydrate": "team,venue",
        }
    )
    return f"{MLB_SCHEDULE_URL}?{query}"


def team_name(game: dict, side: str) -> str:
    return game.get("teams", {}).get(side, {}).get("team", {}).get("name", "")


def team_short(name: str) -> str:
    return TEAM_SHORTS.get(name, name[:3].upper())


def normalize_game(game_date: str, game: dict) -> dict:
    away_name = team_name(game, "away")
    home_name = team_name(game, "home")
    official_date = game.get("gameDate") or ""
    game_pk = game.get("gamePk") or ""
    venue = game.get("venue", {}).get("name", "")

    return {
        "id": f"mlb-{game_pk}",
        "gamePk": game_pk,
        "gameDate": game_date,
        "status": "SCHEDULED",
        "awayTeam": away_name,
        "awayShort": team_short(away_name),
        "homeTeam": home_name,
        "homeShort": team_short(home_name),
        "awayScore": 0,
        "homeScore": 0,
        "venue": venue,
        "officialDate": official_date,
        "displayTime": official_date,
    }


def fetch_schedule() -> list[dict]:
    games: list[dict] = []
    url = build_schedule_url(START_DATE, END_DATE)
    payload = fetch_json(url)

    for day in payload.get("dates", []):
        game_date = day.get("date") or ""

        for game in day.get("games", []):
            game_type = game.get("gameType")
            if game_type not in {"R", "S", "F", "D", "L", "W"}:
                continue

            if not team_name(game, "away") or not team_name(game, "home"):
                continue

            games.append(normalize_game(game_date, game))

    games.sort(key=lambda row: (row["gameDate"], str(row["officialDate"]), str(row["gamePk"])))
    return games


def write_csv(rows: list[dict]) -> None:
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "id",
        "gamePk",
        "gameDate",
        "status",
        "awayTeam",
        "awayShort",
        "homeTeam",
        "homeShort",
        "awayScore",
        "homeScore",
        "venue",
        "officialDate",
        "displayTime",
    ]

    with OUT_CSV.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    try:
        rows = fetch_schedule()
    except (HTTPError, URLError, TimeoutError) as error:
        print(f"Failed to fetch MLB schedule: {error}", file=sys.stderr)
        return 1

    write_csv(rows)
    dates = sorted({row["gameDate"] for row in rows})
    print(f"Wrote MLB schedule CSV to {OUT_CSV}")
    print(f"Games: {len(rows)}")
    if dates:
        print(f"Range: {dates[0]} → {dates[-1]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
