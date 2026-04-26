#!/bin/zsh

set -e

echo "== 更新 CPBL CSV -> JSON =="
python3 scripts/convert_cpbl_csv_to_json.py

echo "== 補 CPBL 官方 live keys =="
python3 scripts/patch_cpbl_official_keys.py

echo "== 更新 NPB CSV -> JSON =="
python3 scripts/convert_npb_csv_to_json.py

echo "== 更新 KBO RTF -> CSV =="
python3 scripts/convert_kbo_rtf_to_csv.py

echo "== 更新 KBO CSV -> JSON =="
python3 scripts/convert_kbo_csv_to_json.py

echo "== 更新資料版本 =="
python3 scripts/update_data_version.py

echo "== 全部完成 =="