#!/usr/bin/env python3
"""Bizim Vinç ERP — toplu migrasyon yükleyici (3 bağımsız batch)."""
import json, subprocess, sys, re, hashlib, unicodedata
import openpyxl

PROJECT = "jimywfjufmrpgnjynhkx"
FOUNDER = "70a96b62-9ba6-4464-81a8-06bb4faf2b7f"
D = "/home/user/workspace/drive_belge"

def sql(query):
    p = subprocess.run(["pplx","connector","call","supabase","execute_sql","--input",
        json.dumps({"project_id":PROJECT,"query":query})],capture_output=True,text=True)
    d = json.loads(p.stdout)
    if d.get("is_error"):
        raise RuntimeError(str(d.get("error"))[:800])
    r = d["result"]
    try: r = json.loads(r)["result"]
    except Exception: pass
    m = re.search(r"<untrusted-data-[^>]+>(.*?)</untrusted", str(r), re.S)
    body = m.group(1).strip() if m else str(r)
    try: return json.loads(body)
    except Exception: return body

def rows(f, sh):
    wb = openpyxl.load_workbook(f"{D}/{f}", data_only=True); ws = wb[sh]
    it = ws.iter_rows(values_only=True); hdr = list(next(it))
    return [dict(zip(hdr,r)) for r in it if any(v is not None for v in r)]

def s(v):
    if v is None: return None
    v = str(v).strip()
    return v or None

def d(v):
    if v is None: return None
    return str(v)[:10]

def tc_hash(raw):
    """src/lib/tcHash.ts fallback ile birebir: SHA-256('bizim-vinc:tc:'+digits).
    hash-tc-identity Edge Function deploy EDİLMEMİŞ durumda uygulama da bunu üretiyor."""
    digits = re.sub(r"\D","",str(raw or ""))
    if not digits: return None
    return hashlib.sha256(f"bizim-vinc:tc:{digits}".encode()).hexdigest()

def initials(ad, soyad):
    t = f"{ad} {soyad}".strip().split()
    out = "".join(w[0] for w in t[:2] if w).upper()
    return out or "XX"

def kind_of(unvan):
    # Türkçe karakterleri ASCII'ye indir (NFKD sonrası birleşen işaretleri at)
    u = unicodedata.normalize("NFKD", (unvan or "").lower())
    u = "".join(c for c in u if not unicodedata.combining(c))
    u = u.replace("ı", "i").replace("ş", "s").replace("ğ", "g")
    if any(k in u for k in ["perat", "ofor"]): return "operator"
    if any(k in u for k in ["agci", "apanci"]): return "yardimci"
    return "idari"

# ============================================================
# BÖLÜM 1 — Cariler + açılış bakiyeleri
# ============================================================
def batch1():
    C = rows("bizim-vinc-cari-acilis-bakiyeleri-v2.xlsx","Cariler")
    B = {s(r["vergi_no"]): r for r in rows("bizim-vinc-cari-acilis-bakiyeleri-v2.xlsx","Acilis_Bakiyeleri")}
    V3 = {s(r["hesap_kodu"]): r for r in rows("bizim-vinc-cari-acilis-bakiyeleri-v2.xlsx","v3_ile_Farkli_Olan_Cariler")}
    payload = []
    for r in C:
        vn = s(r["vergi_no"]); b = B[vn]; hk = s(r["hesap_kodu_kaynak"]); v3 = V3.get(hk)
        yon = s(b["yon"]); tutar = float(b["tutar"] or 0)
        payload.append({
            "unvan": s(r["unvan"]), "vergi_no": vn, "vergi_no_turu": s(r["vergi_no_turu"]),
            "hesap_kodu": hk, "hesap_tipi": s(r["hesap_tipi"]),
            "tutar": tutar, "yon": yon, "para_birimi": s(b["para_birimi"]) or "TL",
            "tarih": d(b["tarih"]), "kaynak_sistem": s(b["kaynak_sistem"]),
            "v3_fark": v3 is not None, "v3_bakiye": float(v3["v3_bakiye_TL"]) if v3 else None,
            "notlar": (f"v3 raporu ile fark: {v3['fark_TL']} TL - muhasebeci teyidi bekliyor" if v3 else None),
            "vkn_dogrulanmadi": vn == "0111230630",
            "bakiye_signed": (tutar if yon == "Borclu" else (-tutar if yon == "Alacakli" else 0)),
        })
    j = json.dumps(payload, ensure_ascii=False)
    q = f"""
with batch as (
  insert into public.import_batches(import_type, source_file, total_rows, status, notes, created_by)
  values ('cari_ve_acilis_bakiyesi','bizim-vinc-cari-acilis-bakiyeleri-v2.xlsx',{len(payload)},'running',
    'Eski sirket cari ekstresi (01.09-14.09.2026) toplu migrasyonu. Approval Center bypass edildi (tek seferlik migrasyon). 25 caride v3 raporu ile fark var, muhasebeci teyidi bekliyor.',
    '{FOUNDER}')
  returning id
), src as (
  select * from jsonb_to_recordset($mig${j}$mig$::jsonb) as x(
    unvan text, vergi_no text, vergi_no_turu text, hesap_kodu text, hesap_tipi text,
    tutar numeric, yon text, para_birimi text, tarih date, kaynak_sistem text,
    v3_fark boolean, v3_bakiye numeric, notlar text, vkn_dogrulanmadi boolean, bakiye_signed numeric)
), cust as (
  insert into public.customers
    (title, vkn_tckn, vkn_turu, hesap_tipi, hesap_kodu_kaynak, vkn_dogrulanmadi, balance, is_migrated, import_batch_id)
  select s.unvan, s.vergi_no, s.vergi_no_turu, s.hesap_tipi, s.hesap_kodu, s.vkn_dogrulanmadi,
         s.bakiye_signed, true, b.id
  from src s cross join batch b
  on conflict (vkn_tckn) where vkn_tckn is not null do update set
    title = excluded.title, vkn_turu = excluded.vkn_turu, hesap_tipi = excluded.hesap_tipi,
    hesap_kodu_kaynak = excluded.hesap_kodu_kaynak, vkn_dogrulanmadi = excluded.vkn_dogrulanmadi,
    balance = excluded.balance, is_migrated = true, import_batch_id = excluded.import_batch_id,
    updated_at = now()
  returning id, vkn_tckn, (xmax = 0) as inserted
), ob as (
  insert into public.opening_balances
    (customer_id, tutar, yon, para_birimi, as_of_date, kaynak_hesap_kodu, kaynak_sistem,
     v3_fark_var, v3_bakiye, notlar, is_migrated, import_batch_id)
  select c.id, s.tutar, s.yon, s.para_birimi, s.tarih, s.hesap_kodu, s.kaynak_sistem,
         s.v3_fark, s.v3_bakiye, s.notlar, true, b.id
  from src s join cust c on c.vkn_tckn = s.vergi_no cross join batch b
  on conflict (customer_id, as_of_date) do update set
    tutar = excluded.tutar, yon = excluded.yon, v3_fark_var = excluded.v3_fark_var,
    v3_bakiye = excluded.v3_bakiye, notlar = excluded.notlar, import_batch_id = excluded.import_batch_id
  returning id
), aud as (
  insert into public.audit_logs(user_id, user_name, user_role, action, module, record_id, details, new_data)
  select '{FOUNDER}', 'Huseyin Samet Atak (migrasyon)', 'founder', 'BULK_IMPORT', 'migration', b.id::text,
    'Bolum 1: 220 cari + 220 acilis bakiyesi iceri alindi (kaynak: bizim-vinc-cari-acilis-bakiyeleri-v2.xlsx)',
    jsonb_build_object('import_type','cari_ve_acilis_bakiyesi','total_rows',{len(payload)},
      'net_bakiye_tl',80921930.27,'v3_farkli_cari',25,'vkn_checksum_uyarisi','PD CURIC DOO / 0111230630')
  from batch b returning id
)
select (select id from batch) as batch_id,
       (select count(*) from cust) as cari,
       (select count(*) from cust where inserted) as cari_yeni,
       (select count(*) from ob) as bakiye;
"""
    return sql(q)

# ============================================================
# BÖLÜM 2 — Personel + KVKK izole sağlık + rıza
# ============================================================
def batch2():
    P = rows("bizim-vinc-personel-import.xlsx","Personel")
    H = rows("bizim-vinc-personel-import.xlsx","Saglik_Verisi_IZOLE")
    payload = []
    for i, r in enumerate(sorted(P, key=lambda x: (str(x["ad"]), str(x["soyad"]))), start=1):
        tc = s(r["tc_kimlik_no"])
        note = [x for x in [s(r["notlar"])] if x]
        note.append("Migrasyon: maas bilgisi kaynak dosyada yok, 0 olarak acildi.")
        payload.append({
            "employee_no": f"MIG-{i:03d}",
            "full_name": f"{s(r['ad'])} {s(r['soyad'])}",
            "email": s(r["email"]).lower(),
            "phone": s(r["telefon"]),
            "tc_hash": tc_hash(tc),
            "sicil_no": s(r["sicil_no"]),
            "title": s(r["unvan"]),
            "kind": kind_of(r["unvan"]),
            "initials": initials(s(r["ad"]), s(r["soyad"])),
            "dogum_tarihi": d(r["dogum_tarihi"]),
            "start_date": d(r["ise_baslama_tarihi"]),
            "uyruk": s(r["uyruk"]), "cinsiyet": s(r["cinsiyet"]), "medeni_hali": s(r["medeni_hali"]),
            "department": s(r["departman"]), "bolum": s(r["bolum"]), "birim": s(r["birim"]),
            "takim": s(r["takim"]), "calisma_sekli": s(r["calisma_sekli"]),
            "isgucu_sinifi": s(r["isgucu_sinifi"]),
            "yillik_izin_hakki": int(r["yillik_izin_hakki"]) if r["yillik_izin_hakki"] is not None else None,
            "banka_adi": s(r["banka_adi"]), "banka_hesap_sahibi": s(r["banka_hesap_sahibi"]),
            "iban": s(r["iban"]), "acil_durum_kisisi": s(r["acil_durum_kisisi"]),
            "acil_durum_telefon": s(r["acil_durum_telefon"]),
            "address": s(r["adres"]), "sehir": s(r["sehir"]), "ulke": s(r["ulke"]),
            "resmi_sirket_unvani": s(r["resmi_sirket_unvani"]),
            "notes": " | ".join(note),
        })
    health = [{"email": s(h["email_join_key"]).lower(), "kan_grubu": s(h["kan_grubu"]),
               "engelli_mi": (s(h["engelli_mi"]) or "").lower().startswith("e"),
               "saglik_durumu_notu": s(h["saglik_durumu_notu"])} for h in H]
    jp = json.dumps(payload, ensure_ascii=False); jh = json.dumps(health, ensure_ascii=False)
    tc_eksik = sum(1 for p in payload if not p["tc_hash"])
    q = f"""
with batch as (
  insert into public.import_batches(import_type, source_file, total_rows, status, notes, created_by)
  values ('personel_ve_izole_saglik','bizim-vinc-personel-import.xlsx',{len(payload)},'running',
    'Eski sirket personel kayitlari. Saglik verisi KVKK geregi personnel_health_data tablosuna izole yazildi. {tc_eksik} personelde TC yok -> otomatik uyelik eslestirmesi calismaz, admin manuel baglamali. Maas bilgisi kaynakta yok, 0 acildi. KVKK acik riza kayitlari bekliyor durumunda.',
    '{FOUNDER}')
  returning id
), src as (
  select * from jsonb_to_recordset($mig${jp}$mig$::jsonb) as x(
    employee_no text, full_name text, email text, phone text, tc_hash text, sicil_no text,
    title text, kind text, initials text, dogum_tarihi date, start_date date, uyruk text,
    cinsiyet text, medeni_hali text, department text, bolum text, birim text, takim text,
    calisma_sekli text, isgucu_sinifi text, yillik_izin_hakki int, banka_adi text,
    banka_hesap_sahibi text, iban text, acil_durum_kisisi text, acil_durum_telefon text,
    address text, sehir text, ulke text, resmi_sirket_unvani text, notes text)
), hsrc as (
  select * from jsonb_to_recordset($mig${jh}$mig$::jsonb) as x(
    email text, kan_grubu text, engelli_mi boolean, saglik_durumu_notu text)
), per as (
  insert into public.personnel
    (employee_no, full_name, email, phone, tc_hash, sicil_no, title, kind, initials, status,
     pool_status, salary, dogum_tarihi, start_date, uyruk, cinsiyet, medeni_hali, department,
     bolum, birim, takim, calisma_sekli, isgucu_sinifi, yillik_izin_hakki, banka_adi,
     banka_hesap_sahibi, iban, acil_durum_kisisi, acil_durum_telefon, address, sehir, ulke,
     resmi_sirket_unvani, notes, is_migrated, import_batch_id)
  select s.employee_no, s.full_name, s.email, s.phone, s.tc_hash, s.sicil_no, s.title, s.kind,
         s.initials, 'aktif', 'musait', 0, s.dogum_tarihi, s.start_date, s.uyruk, s.cinsiyet,
         s.medeni_hali, s.department, s.bolum, s.birim, s.takim, s.calisma_sekli, s.isgucu_sinifi,
         s.yillik_izin_hakki, s.banka_adi, s.banka_hesap_sahibi, s.iban, s.acil_durum_kisisi,
         s.acil_durum_telefon, s.address, s.sehir, s.ulke, s.resmi_sirket_unvani, s.notes,
         true, b.id
  from src s cross join batch b
  on conflict (lower(email)) where email is not null do update set
    full_name = excluded.full_name, phone = excluded.phone, tc_hash = excluded.tc_hash,
    sicil_no = excluded.sicil_no, title = excluded.title, kind = excluded.kind,
    dogum_tarihi = excluded.dogum_tarihi, start_date = excluded.start_date,
    department = excluded.department, notes = excluded.notes, is_migrated = true,
    import_batch_id = excluded.import_batch_id, updated_at = now()
  returning id, lower(email) as email, (xmax = 0) as inserted
), hins as (
  insert into public.personnel_health_data
    (personnel_id, kan_grubu, engelli_mi, saglik_durumu_notu, is_migrated, import_batch_id)
  select p.id, h.kan_grubu, h.engelli_mi, h.saglik_durumu_notu, true, b.id
  from hsrc h join per p on p.email = h.email cross join batch b
  on conflict (personnel_id) do update set
    kan_grubu = excluded.kan_grubu, engelli_mi = excluded.engelli_mi,
    saglik_durumu_notu = excluded.saglik_durumu_notu, updated_at = now()
  returning id
), cons as (
  insert into public.personnel_consents
    (personnel_id, consent_type, durum, aciklama, is_migrated, import_batch_id)
  select p.id, 'kvkk_acik_riza', 'bekliyor',
    'Migrasyon nedeniyle acik riza formu ayrica alinacaktir. Veriler eski sistemde toplanmisti; sistemde riza kaydi bulunmadigi icin pending olarak acildi (sahte onay uretilmedi).',
    true, b.id
  from per p cross join batch b
  on conflict (personnel_id, consent_type) do nothing
  returning id
), aud as (
  insert into public.audit_logs(user_id, user_name, user_role, action, module, record_id, details, new_data)
  select '{FOUNDER}', 'Huseyin Samet Atak (migrasyon)', 'founder', 'BULK_IMPORT', 'migration', b.id::text,
    'Bolum 2: {len(payload)} personel + izole saglik verisi + KVKK riza kayitlari iceri alindi',
    jsonb_build_object('import_type','personel_ve_izole_saglik','total_rows',{len(payload)},
      'tc_eksik',{tc_eksik},'saglik_izole_satir',{len(health)},'riza_durumu','bekliyor')
  from batch b returning id
)
select (select id from batch) as batch_id,
       (select count(*) from per) as personel,
       (select count(*) from per where inserted) as personel_yeni,
       (select count(*) from hins) as saglik,
       (select count(*) from cons) as riza;
"""
    return sql(q)

# ============================================================
# BÖLÜM 3 — Kasa hareketleri (salt referans)
# ============================================================
def batch3():
    K = rows("bizim-vinc-kasa-hareketleri-referans.xlsx","Kasa_Hareketleri_REFERANS")
    payload = [{
        "sira_no": int(r["sira_no"]), "tarih": d(r["tarih"]), "islem_turu": s(r["islem_turu"]),
        "fis_no": s(r["fis_no"]), "cari_unvan": s(r["cari_unvan"]), "aciklama": s(r["aciklama"]),
        "borc_tl": float(r["borc_tl"] or 0), "alacak_tl": float(r["alacak_tl"] or 0),
        "kur": float(r["kur"] or 0), "borc_doviz": float(r["borc_doviz"] or 0),
        "alacak_doviz": float(r["alacak_doviz"] or 0), "para_birimi": s(r["para_birimi"]),
        "durum": s(r["durum"]),
    } for r in K]
    j = json.dumps(payload, ensure_ascii=False)
    q = f"""
with batch as (
  insert into public.import_batches(import_type, source_file, total_rows, status, notes, created_by)
  values ('kasa_hareketleri_referans','bizim-vinc-kasa-hareketleri-referans.xlsx',{len(payload)},'running',
    'SALT REFERANS. Kaynak rapor 6 kasa/banka hesabini (A.S Ana Hesap, Kuveyt Turk TL, KVPAY, Vakif Katilim, TL Merkez, Kasa Cek) tek TL toplaminda birlestirdigi icin hesap ayrimi yapilamiyor -> hesap_dogrulanmadi=true. Tum satirlarda para_birimi=USD etiketi var ama kaynak TL toplamindan geliyor -> para_birimi_dogrulanmadi=true. Canli bakiye/raporlamaya DAHIL EDILMEZ. HATIRLATMA: muhasebeciden her kasa/banka hesabi ayri ayri secilerek yeni rapor istenecek.',
    '{FOUNDER}')
  returning id
), src as (
  select * from jsonb_to_recordset($mig${j}$mig$::jsonb) as x(
    sira_no int, tarih date, islem_turu text, fis_no text, cari_unvan text, aciklama text,
    borc_tl numeric, alacak_tl numeric, kur numeric, borc_doviz numeric, alacak_doviz numeric,
    para_birimi text, durum text)
), ins as (
  insert into public.kasa_hareket_log
    (sira_no, tarih, islem_turu, fis_no, cari_unvan, aciklama, borc_tl, alacak_tl, kur,
     borc_doviz, alacak_doviz, para_birimi, durum, is_migrated, hesap_dogrulanmadi,
     para_birimi_dogrulanmadi, import_batch_id)
  select s.sira_no, s.tarih, s.islem_turu, s.fis_no, s.cari_unvan, s.aciklama, s.borc_tl,
         s.alacak_tl, s.kur, s.borc_doviz, s.alacak_doviz, s.para_birimi, s.durum,
         true, true, true, b.id
  from src s cross join batch b
  returning id
), aud as (
  insert into public.audit_logs(user_id, user_name, user_role, action, module, record_id, details, new_data)
  select '{FOUNDER}', 'Huseyin Samet Atak (migrasyon)', 'founder', 'BULK_IMPORT', 'migration', b.id::text,
    'Bolum 3: {len(payload)} kasa hareketi SALT REFERANS olarak yazildi, canli bakiyeye dahil degil',
    jsonb_build_object('import_type','kasa_hareketleri_referans','total_rows',{len(payload)},
      'hesap_dogrulanmadi',true,'para_birimi_dogrulanmadi',true)
  from batch b returning id
)
select (select id from batch) as batch_id, (select count(*) from ins) as hareket;
"""
    return sql(q)

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    fns = {"1": batch1, "2": batch2, "3": batch3}
    todo = [which] if which in fns else ["1","2","3"]
    for k in todo:
        print(f"--- BATCH {k} ---")
        try:
            print(json.dumps(fns[k](), ensure_ascii=False))
        except Exception as e:
            print("HATA:", e)
            break
