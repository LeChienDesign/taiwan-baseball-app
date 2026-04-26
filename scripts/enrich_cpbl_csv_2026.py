import csv
from pathlib import Path

INPUT_PATH = Path("data/cpbl-major-2026.csv")
OUTPUT_PATH = Path("data/cpbl-major-2026.enriched.csv")

HEADER = [
    "idEvent",
    "strTimestamp",
    "Round",
    "Home Team",
    "Home Score",
    "Away Team",
    "Away Score",
    "Venue",
    "DisplayTime",
    "Status",
    "Away Inning Line",
    "Home Inning Line",
    "Away Hits",
    "Home Hits",
    "Away Errors",
    "Home Errors",
    "Poster",
    "Thumb",
    "gameSno",
    "kindCode",
    "year",
    "officialLiveUrl",
]

TIME_MAP = {
    "07:05:00": "15:05",
    "08:05:00": "16:05",
    "09:05:00": "17:05",
    "10:35:00": "18:35",
    "14:05:00": "14:05",
    "17:05:00": "17:05",
}

def clean(v):
    return (v or "").strip()

def derive_display_time(ts: str) -> str:
    ts = clean(ts)
    if len(ts) >= 19:
        hhmmss = ts[11:19]
        return TIME_MAP.get(hhmmss, ts[11:16])
    return ""

def main():
    with INPUT_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    fixed = []
    for row in rows:
        out = {key: clean(row.get(key)) for key in HEADER}

        if not out["DisplayTime"]:
            out["DisplayTime"] = derive_display_time(out["strTimestamp"])

        has_home = out["Home Score"] != ""
        has_away = out["Away Score"] != ""

        if not out["Status"]:
            out["Status"] = "FINAL" if (has_home and has_away) else "SCHEDULED"

        fixed.append(out)

    with OUTPUT_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=HEADER)
        writer.writeheader()
        writer.writerows(fixed)

    print(f"Written enriched CSV -> {OUTPUT_PATH} ({len(fixed)} rows)")

if __name__ == "__main__":
    main()