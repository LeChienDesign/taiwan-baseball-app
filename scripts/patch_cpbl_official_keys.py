import json
from pathlib import Path

BASE_PATH = Path("data/cpbl-major-2026.json")
MAP_PATH = Path("data/cpbl-official-map.json")
OUTPUT_PATH = Path("data/cpbl-major-2026.json")


def clean(value):
    return str(value or "").strip()


def date_only(value):
    return clean(value)[:10]


def make_key(match_date, away_team, home_team):
    return f"{clean(match_date)}__{clean(away_team)}__{clean(home_team)}"


def main():
    if not BASE_PATH.exists():
        raise FileNotFoundError(f"Missing base file: {BASE_PATH}")

    if not MAP_PATH.exists():
        raise FileNotFoundError(f"Missing map file: {MAP_PATH}")

    with BASE_PATH.open("r", encoding="utf-8") as f:
        base_rows = json.load(f)

    with MAP_PATH.open("r", encoding="utf-8") as f:
        patch_rows = json.load(f)

    patch_map = {}
    for item in patch_rows:
        key = make_key(
            item.get("matchDate"),
            item.get("awayTeam"),
            item.get("homeTeam"),
        )
        if key:
            patch_map[key] = item

    merged = []
    patched_count = 0

    for row in base_rows:
        key = make_key(
            date_only(row.get("strTimestamp")),
            row.get("Away Team"),
            row.get("Home Team"),
        )
        patch = patch_map.get(key)

        if patch:
            row["gameSno"] = clean(patch.get("gameSno"))
            row["kindCode"] = clean(patch.get("kindCode"))
            row["year"] = clean(patch.get("year"))
            row["Venue"] = clean(patch.get("Venue")) or clean(row.get("Venue"))
            row["DisplayTime"] = clean(patch.get("DisplayTime")) or clean(row.get("DisplayTime"))
            row["officialLiveUrl"] = clean(patch.get("officialLiveUrl")) or clean(row.get("officialLiveUrl"))
            patched_count += 1
        else:
            row["gameSno"] = clean(row.get("gameSno"))
            row["kindCode"] = clean(row.get("kindCode"))
            row["year"] = clean(row.get("year"))
            row["Venue"] = clean(row.get("Venue"))
            row["DisplayTime"] = clean(row.get("DisplayTime"))
            row["officialLiveUrl"] = clean(row.get("officialLiveUrl"))

        merged.append(row)

    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f"Patched {patched_count} CPBL rows -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()