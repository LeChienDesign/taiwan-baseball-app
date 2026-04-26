#!/usr/bin/env python3
"""
Fetch NPB 2026 full season schedule from TheSportsDB and save as cleaned JSON.

Usage:
  python fetch_npb_2026_schedule.py

Requirements:
  pip install requests
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import requests


LEAGUE_ID = 4591
SEASON = "2026"
API_KEY = "123"
URL = f"https://www.thesportsdb.com/api/v1/json/{API_KEY}/eventsseason.php?id={LEAGUE_ID}&s={SEASON}"
OUTFILE = Path("npb_2026_schedule.json")


TEAM_NAME_MAP = {
    "Chiba Lot": "Chiba Lotte Marines",
    "Chiba Lotte M": "Chiba Lotte Marines",
    "Chunichi Drag": "Chunichi Dragons",
    "Fukuoka SoftB": "Fukuoka SoftBank Hawks",
    "Hanshin Tiger": "Hanshin Tigers",
    "Hiroshima Toy": "Hiroshima Toyo Carp",
    "Hokkaido Nipp": "Hokkaido Nippon-Ham Fighters",
    "Orix Buffaloe": "Orix Buffaloes",
    "Saitama Seibu": "Saitama Seibu Lions",
    "Tohoku Rakute": "Tohoku Rakuten Golden Eagles",
    "Tokyo Yakult ": "Tokyo Yakult Swallows",
    "Yokohama DeNA": "Yokohama DeNA BayStars",
    "Yomiuri Giant": "Yomiuri Giants",
}


def clean_team_name(name: Any) -> Any:
    if not isinstance(name, str):
        return name
    return TEAM_NAME_MAP.get(name.strip(), name.strip())


def to_int(value: Any) -> int | None:
    if value in (None, "", "null"):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def pick(event: dict[str, Any]) -> dict[str, Any]:
    return {
        "idEvent": event.get("idEvent"),
        "strEvent": event.get("strEvent"),
        "strSeason": event.get("strSeason"),
        "intRound": to_int(event.get("intRound")),
        "dateEvent": event.get("dateEvent"),
        "strTime": event.get("strTime"),
        "strTimestamp": event.get("strTimestamp"),
        "strStatus": event.get("strStatus"),
        "strVenue": event.get("strVenue"),
        "idHomeTeam": event.get("idHomeTeam"),
        "idAwayTeam": event.get("idAwayTeam"),
        "strHomeTeam": clean_team_name(event.get("strHomeTeam")),
        "strAwayTeam": clean_team_name(event.get("strAwayTeam")),
        "intHomeScore": to_int(event.get("intHomeScore")),
        "intAwayScore": to_int(event.get("intAwayScore")),
        "strLeague": event.get("strLeague"),
        "idLeague": event.get("idLeague"),
        "strSport": event.get("strSport"),
        "source": "TheSportsDB",
    }


def main() -> None:
    response = requests.get(URL, timeout=60)
    response.raise_for_status()
    payload = response.json()

    events = payload.get("events") or []
    cleaned = [pick(e) for e in events]

    output = {
        "meta": {
            "league_id": LEAGUE_ID,
            "league_name": "Nippon Baseball League",
            "season": SEASON,
            "source_url": URL,
            "event_count": len(cleaned),
        },
        "events": cleaned,
    }

    OUTFILE.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {len(cleaned)} events to {OUTFILE.resolve()}")


if __name__ == "__main__":
    main()
