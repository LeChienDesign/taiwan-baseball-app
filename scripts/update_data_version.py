import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

OUTPUT_PATH = Path("data/data-version.json")

tz = timezone(timedelta(hours=8))
now_iso = datetime.now(tz).isoformat(timespec="seconds")

data = {
    "cpbl": {
        "version": now_iso,
        "source": "local+official-patch"
    },
    "npb": {
        "version": now_iso,
        "source": "local"
    },
    "kbo": {
        "version": now_iso,
        "source": "local"
    },
    "mlb": {
        "version": now_iso,
        "source": "mock"
    }
}

OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
with OUTPUT_PATH.open("w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Written data version file to {OUTPUT_PATH}")