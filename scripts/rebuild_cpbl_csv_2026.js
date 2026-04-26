import csv
from pathlib import Path

INPUT_PATH = Path("data/cpbl-major-2026.csv")
OUTPUT_PATH = Path("data/cpbl-major-2026.rebuilt.csv")

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

CPBL_TIME_MAP = {
    "08:05:00": "16:05",
    "09:05:00": "17:05",
    "10:35:00": "18:35",
    "07:05:00": "15:05",
    "14:05:00": "14:05",
    "17:05:00": "17:05",
}

def clean(v):
    return (v or "").strip()

def is_url(v: str) -> bool:
    v = clean(v).lower()
    return v.startswith("http://") or v.startswith("https://")

def derive_display_time(ts: str) -> str:
    ts = clean(ts)
    if len(ts) >= 19:
        hhmmss = ts[11:19]
        if hhmmss in CPBL_TIME_MAP:
            return CPBL_TIME_MAP[hhmmss]
        return ts[11:16]
    return ""

def normalize_short_row(raw: list[str]) -> dict:
    raw = [clean(x) for x in raw]
    row = {k: "" for k in HEADER}

    fixed = min(7, len(raw))
    for i in range(fixed):
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
    for i, field in enumerate(extra_fields):
        if i < len(non_urls):
            row[field] = non_urls[i]

    return row

def normalize_dict_row(src: dict) -> dict:
    row = {k: clean(src.get(k)) for k in HEADER}

    # 錯位修正：如果有 URL 跑進 Venue/DisplayTime/Status，拉回 Thumb
    for field in ["Venue", "DisplayTime", "Status"]:
        if is_url(row[field]) and not row["Thumb"]:
            row["Thumb"] = row[field]
            row[field] = ""

    # 自動補 DisplayTime
    if not row["DisplayTime"]:
        row["DisplayTime"] = derive_display_time(row["strTimestamp"])

    # 自動補 Status
    if not row["Status"]:
        if clean(row["Home Score"]) != "" and clean(row["Away Score"]) != "":
            row["Status"] = "FINAL"
        else:
            row["Status"] = "SCHEDULED"

    # 只要有 gameSno 就順便補 CPBL 官方欄位基本值
    if row["gameSno"] and not row["kindCode"]:
        row["kindCode"] = "A"
    if row["gameSno"] and not row["year"]:
        row["year"] = "2026"
    if row["gameSno"] and not row["officialLiveUrl"]:
        row["officialLiveUrl"] = (
            f"https://en.cpbl.com.tw/box/index?gameSno={row['gameSno']}"
            f"&kindCode={row['kindCode'] or 'A'}&year={row['year'] or '2026'}"
        )

    return row

def main():
    with INPUT_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        raise RuntimeError("CSV is empty")

    header = rows[0]
    data_rows = rows[1:]

    rebuilt = []

    # 如果表頭看起來像正確表頭，就用 DictReader；不然也照短列修
    looks_like_header = header[:7] == HEADER[:7]

    if looks_like_header:
        with INPUT_PATH.open("r", encoding="utf-8-sig", newline="") as f:
            dict_reader = csv.DictReader(f)
            for src in dict_reader:
                rebuilt.append(normalize_dict_row(src))
    else:
        for raw in data_rows:
            rebuilt.append(normalize_dict_row(normalize_short_row(raw)))

    with OUTPUT_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=HEADER)
        writer.writeheader()
        writer.writerows(rebuilt)

    print(f"Rebuilt CSV -> {OUTPUT_PATH} ({len(rebuilt)} rows)")

if __name__ == "__main__":
    main()