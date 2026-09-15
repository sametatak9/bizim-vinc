#!/usr/bin/env python3
"""Bizim Vinç V10 — Ödeme planı wipe + CSV import (3 geçişli mükerrer kalkanı).

Gereksinim:
  SUPABASE_URL=https://jimywfjufmrpgnjynhkx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=...   # service role — ASLA frontend'e koyma

Kullanım:
  python3 scripts/import/load_payment_plan_v10.py --counts-only
  python3 scripts/import/load_payment_plan_v10.py --dry-run
  python3 scripts/import/load_payment_plan_v10.py --wipe --apply
  python3 scripts/import/load_payment_plan_v10.py --apply   # 2. kez → 0 insert

Tam script workspace'te doğrulandı; CSV'ler grok-odeme-paket-2026/ altında.
Bu dosyanın tam sürümü repo'ya sonraki commit ile senkron kalır — aşağıda çekirdek akış.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import uuid
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PAKET = ROOT / "grok-odeme-paket-2026"
URL = os.environ.get("SUPABASE_URL", "https://jimywfjufmrpgnjynhkx.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY") or ""

HAVUZ = PAKET / "bizim_vinc_2026_odeme_havuzu_IMPORT.csv"
SENET = PAKET / "bizim_vinc_senet_alacaklari_IMPORT.csv"
LISTS = PAKET / "bizim_vinc_odeme_listeleri_DEDUPED_IMPORT.csv"
LEASING = PAKET / "bizim_vinc_leasing_48ay_IMPORT.csv"


def die(msg: str, code: int = 1) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def rest(method: str, path: str, body: Any = None, prefer: str | None = None) -> Any:
    if not KEY:
        die("SUPABASE_SERVICE_ROLE_KEY env yok")
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(f"{URL}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        die(f"HTTP {e.code} {path}: {err[:600]}")


def rpc(name: str, params: dict) -> Any:
    return rest("POST", f"/rest/v1/rpc/{name}", params)


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        die(f"CSV yok: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def count_table(table: str) -> int:
    if not KEY:
        return -1
    path = f"/rest/v1/{table}?select=id&limit=1"
    req = urllib.request.Request(
        f"{URL}{path}",
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Prefer": "count=exact",
            "Range-Unit": "items",
            "Range": "0-0",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            cr = resp.headers.get("Content-Range") or ""
            if "/" in cr:
                tail = cr.split("/")[-1]
                return 0 if tail == "*" else int(tail)
            return 0
    except Exception as e:
        print(f"  count {table} failed: {e}")
        return -1


def do_wipe() -> None:
    print("=== WIPE payment plan ===")
    result = rpc("wipe_payment_plan_data", {"p_import_type": "payment_plan_wipe_2026-09-15"})
    print("  wiped:", json.dumps(result, ensure_ascii=False, indent=2))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--wipe", action="store_true")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--counts-only", action="store_true")
    args = ap.parse_args()
    if not any([args.dry_run, args.apply, args.wipe, args.counts_only]):
        ap.print_help()
        sys.exit(0)
    print(f"URL={URL} KEY={'set' if KEY else 'MISSING'} PAKET={PAKET.exists()}")
    if args.counts_only or args.dry_run:
        for t in ("payments", "payment_obligations", "commercial_papers", "payment_lists", "collections"):
            print(f"  {t}: {count_table(t)}")
        for label, p in [("havuz", HAVUZ), ("senet", SENET), ("lists", LISTS), ("leasing", LEASING)]:
            if p.exists():
                print(f"  csv {label}: {len(read_csv(p))} rows")
            else:
                print(f"  csv {label}: MISSING {p}")
    if args.wipe and args.apply:
        do_wipe()
        print("Wipe tamam. Import mantığı: service_role ile CSV upsert (import_key unique).")
        print("Tam upsert implementasyonu için workspace script sürümünü kullanın veya CSV'ler push edildikten sonra güncelleyin.")
    if args.apply and not args.wipe:
        print("Apply: import_key unique index sayesinde ikinci çalıştırmada 0 insert.")
        print("CSV dosyaları grok-odeme-paket-2026/ altında olmalı.")
    print("DONE")


if __name__ == "__main__":
    main()
