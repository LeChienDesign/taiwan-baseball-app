import re
import csv
from pathlib import Path

INPUT_PATH = Path("kbo.rtf")
OUTPUT_PATH = Path("data/kbo-2026.csv")

TEAM_MAP = {
    "KIA": "KIA Tigers",
    "LG": "LG Twins",
    "KIWOOM": "Kiwoom Heroes",
    "SSG": "SSG Landers",
    "DOOSAN": "Doosan Bears",
    "SAMSUNG": "Samsung Lions",
    "LOTTE": "Lotte Giants",
    "NC": "NC Dinos",
    "KT": "KT Wiz",
    "HANWHA": "Hanwha Eagles",
}

VENUE_MAP = {
    "JAMSIL": "Jamsil",
    "MUNHAK": "Munhak",
    "DAEGU": "Daegu",
    "CHANGWON": "Changwon",
    "DAEJEON": "Daejeon",
    "SAJIK": "Sajik",
    "SUWON": "Suwon",
    "GWANGJU": "Gwangju",
    "GOCHEOKSKY": "Gocheok Sky Dome",
    "POHANG": "Pohang",
}

DATE_RE = re.compile(r"^(\d{2})\.(\d{2})\([A-Z]{3}\)$")
TIME_RE = re.compile(r"^\d{2}:\d{2}$")
SCORE_RE = re.compile(r"^(\d+):(\d+)$")


def strip_rtf(text: str) -> str:
    text = re.sub(r"\\'[0-9a-fA-F]{2}", "", text)
    text = re.sub(r"\\[a-zA-Z]+-?\d* ?", "", text)
    text = text.replace("{", "").replace("}", "")
    return text


def clean_lines(text: str):
    lines = [line.strip() for line in text.splitlines()]
    return [line for line in lines if line]


def main():
    raw = INPUT_PATH.read_text(encoding="utf-8", errors="ignore")
    plain = strip_rtf(raw)
    lines = clean_lines(plain)

    rows = []
    current_date = None
    game_index = 0
    i = 0

    while i < len(lines):
        line = lines[i]

        m_date = DATE_RE.match(line)
        if m_date:
            current_date = f"2026-{m_date.group(1)}-{m_date.group(2)}"
            game_index = 0
            i += 1
            continue

        if line == "REGULAR" and current_date:
            i += 1
            continue

        if TIME_RE.match(line) and current_date:
            if i + 3 >= len(lines):
                i += 1
                continue

            display_time = line
            away_team_raw = lines[i + 1]
            score_token = lines[i + 2]
            home_team_raw = lines[i + 3]

            away_score = ""
            home_score = ""

            if score_token != ":":
                m_score = SCORE_RE.match(score_token)
                if m_score:
                    away_score = m_score.group(1)
                    home_score = m_score.group(2)

            j = i + 4
            venue = ""

            while j < len(lines):
                if lines[j] in VENUE_MAP:
                    venue = VENUE_MAP[lines[j]]
                    break
                if DATE_RE.match(lines[j]) or TIME_RE.match(lines[j]):
                    break
                j += 1

            game_index += 1
            rows.append({
                "idEvent": f"kbo-2026-{current_date}-{game_index}",
                "strTimestamp": f"{current_date} {display_time}:00",
                "Round": "Regular Season",
                "Home Team": TEAM_MAP.get(home_team_raw, home_team_raw),
                "Home Score": home_score,
                "Away Team": TEAM_MAP.get(away_team_raw, away_team_raw),
                "Away Score": away_score,
                "Venue": venue,
                "DisplayTime": display_time,
            })

            i = j + 1 if venue else i + 4
            continue

        i += 1

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "idEvent",
                "strTimestamp",
                "Round",
                "Home Team",
                "Home Score",
                "Away Team",
                "Away Score",
                "Venue",
                "DisplayTime",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Written {len(rows)} rows to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()