#!/bin/zsh

set -e

echo "== 更新 CPBL CSV -> JSON =="
python3 scripts/convert_cpbl_csv_to_json.py

echo "== 更新 NPB CSV -> JSON =="
python3 scripts/convert_npb_csv_to_json.py

echo "== 抓取 MLB CSV =="
python3 scripts/fetch_mlb_2026_schedule.py

echo "== 更新 MLB CSV -> JSON =="
python3 scripts/convert_mlb_csv_to_json.py

echo "== 更新資料版本 =="
python3 scripts/update_data_version.py

echo "== 全部完成 =="
