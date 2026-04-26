import csv
from pathlib import Path

INPUT_PATH = Path("data/cpbl-major-2026.csv")
OUTPUT_PATH = Path("data/cpbl-major-2026.fixed.csv")

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


def clean(value):
    return (value or "").strip()


def is_url(value: str) -> bool:
    v = clean(value).lower()
    return v.startswith("http://") or v.startswith("https://")


def normalize_row(raw: list[str]) -> dict:
    raw = [clean(x) for x in raw]

    if len(raw) >= len(HEADER):
        return {HEADER[i]: raw[i] if i < len(raw) else "" for i in range(len(HEADER))}

    row = {key: "" for key in HEADER}

    fixed_positions = min(7, len(raw))
    for i in range(fixed_positions):
        row[HEADER[i]] = raw[i]

    extras = raw[7:]
    urls = [x for x in extras if is_url(x)]
    non_urls = [x for x in extras if not is_url(x)]

    if len(urls) == 1:
        row["Thumb"] = urls[0]
    elif len(urls) >= 2:
        row["Poster"] = urls[0]
        row["Thumb"] = urls[1]

    extra_fields = [
        "Venue",
        "DisplayTime",
        "Status",
        "Away Inning Line",
        "Home Inning Line",
        "Away Hits",
        "Home Hits",
        "Away Errors",
        "Home Errors",
        "gameSno",
        "kindCode",
        "year",
        "officialLiveUrl",
    ]

    for idx, field in enumerate(extra_fields):
        if idx < len(non_urls):
            row[field] = non_urls[idx]

    return row


def main():
    with INPUT_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        raise RuntimeError("CSV is empty")

    data_rows = rows[1:] if rows else []
    fixed = [normalize_row(r) for r in data_rows]

    with OUTPUT_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=HEADER)
        writer.writeheader()
        writer.writerows(fixed)

    print(f"Written fixed CSV to {OUTPUT_PATH} ({len(fixed)} rows)")


if __name__ == "__main__":
    main()