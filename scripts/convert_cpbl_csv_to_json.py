import csv
import json
from pathlib import Path

INPUT_PATH = Path("data/cpbl-major-2026.csv")
OUTPUT_PATH = Path("data/cpbl-major-2026.json")

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


def normalize_row_from_list(raw: list[str]) -> dict:
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

    # URL 優先放 Poster / Thumb
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


def normalize_row_from_dict(row: dict) -> dict:
    normalized = {key: clean(row.get(key)) for key in HEADER}

    # 修正錯位：如果 DisplayTime 是 URL，移回 Thumb
    if is_url(normalized["DisplayTime"]) and not normalized["Thumb"]:
        normalized["Thumb"] = normalized["DisplayTime"]
        normalized["DisplayTime"] = ""

    if is_url(normalized["Venue"]) and not normalized["Thumb"]:
        normalized["Thumb"] = normalized["Venue"]
        normalized["Venue"] = ""

    if is_url(normalized["Status"]) and not normalized["Thumb"]:
        normalized["Thumb"] = normalized["Status"]
        normalized["Status"] = ""

    # 如果 Poster 空、Thumb 有值就保持；如果 Poster 有值但 Thumb 空也可以接受
    return normalized


def main():
    with INPUT_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        sample = f.read()
        f.seek(0)

        lines = sample.splitlines()
        if not lines:
            raise RuntimeError("CSV is empty")

        first_row = next(csv.reader([lines[0]]), [])
        has_expected_header = first_row[:7] == HEADER[:7]

        cleaned = []

        if has_expected_header:
            reader = csv.DictReader(f)
            for row in reader:
                cleaned.append(normalize_row_from_dict(row))
        else:
            f.seek(0)
            reader = csv.reader(f)
            for raw in reader:
                cleaned.append(normalize_row_from_list(raw))

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

    print(f"Done: {OUTPUT_PATH} ({len(cleaned)} rows)")


if __name__ == "__main__":
    main()