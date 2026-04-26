import csv
import json
from pathlib import Path

INPUT_PATH = Path("data/kbo-2026.csv")
OUTPUT_PATH = Path("data/kbo-2026.json")

rows = []

with INPUT_PATH.open("r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append({
            "idEvent": row.get("idEvent", ""),
            "strTimestamp": row.get("strTimestamp", ""),
            "Round": row.get("Round", "Regular Season"),
            "Home Team": row.get("Home Team", ""),
            "Home Score": row.get("Home Score", ""),
            "Away Team": row.get("Away Team", ""),
            "Away Score": row.get("Away Score", ""),
            "Venue": row.get("Venue", ""),
            "DisplayTime": row.get("DisplayTime", ""),
        })

with OUTPUT_PATH.open("w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)

print(f"Written {len(rows)} rows to {OUTPUT_PATH}")