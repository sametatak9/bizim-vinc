# Kapsamlı görev PDF'si — faz kabul kriterleri

Kaynak: `/home/ubuntu/upload/bizim-vinc-kapsamli-gorev.pdf`, 14 sayfa.

## Sıralı fazlar

- Faz 0: Render SPA rewrite, üyelikten profile/membership/onay akışı, tek kod kaynağı/senkronizasyon, staging ayrımı; commit/push/deploy ve canlı test.
- Faz 1: Maaş ve işe giriş tarihi zorunlu; dinamik personel türü; havuz durumu kaldırılacak, Aktif/Pasif; pasifte çıkış tarihi ve çıkış evrakı zorunlu. İSG, MYK (yalnız operatör), sürücü, adli sicil belgeleri gerçek yükleme ve dijital kartta görünürlük; adli sicil yalnız kurucu/HR. Mobil 360–390 px.
- Faz 2: Onay Merkezi yeniden tasarım; üyelik onayıyla personel oluşturma/eşleme, maaş-görev bilgisi düzenleme. Makbuz, avans, izin, iş, mesai, günlük yoklama talepleri ayrı sekmeler; kararlar Personel Kart geçmişine yazılır.
- Faz 3: Personel Kart arşiv sekmesi; aktif/pasif filtre; kişi bazında izin, maaş, operasyon kayıtlarının kronolojik görünümü; kişi PDF/HTML raporu.
- Faz 4: Aylık puantaj takvimi; onaylı yoklama/mesai puantaja işler, manuel düzeltme; Excel/HTML maaş raporu; Maaş Hesapla → Maaş Ödeme iki adım; parçalı ödeme ve bakiye; avans/kesinti/devamsızlık/ödemelerle canlı bakiye; değişikliklerde audit; operatör için offline kuyruk/retry.
- Faz 5: Vinç geçmişi; iş, yakıt, bakım ve operasyon kayıtlarını vinç bazında kronolojik arşiv.
- Faz 6: Makbuz fiyatsız çalışma saati evrakı; operatör fiyat giremez, admin girer; seçili makbuzları faturalama ekranında kalem bazında fiyatlandırma. Fatura ve irsaliye ayrı standartlar; cari, ödeme/tahsilat, banka-kasa; arşiv/iptal durum değişikliği; bakiye ve ödeme planı; banka API hazırlık şeması; Postgres sequence/transaction lock ve numeric/kurus hassasiyeti.
- Faz 7: Logolu sözleşme/teklif; standart makine kiralama sözleşmesi; cari/vinç seçimi; tekliften sözleşmeye dönüşüm; serbest teklif metni, sabit sözleşme metni; PDF arşiv, onay, cari/vinç geçmişi.
- Faz 8: yalnız founder sekmesi; rol/yeni üyelik türü ve kişi bazlı sayfa yetkisi; dağınık yönetimi tek yere toplama; RLS founder her şeyi, diğer roller kısıtlı test.
- Faz 9: Dashboard borçlu cari/faturasız makbuz rozetleri/sayaç; store.tsx modüler store’lara bölünmesi.

## Çalışma kuralı

Her faz sırayla uygulanır; Supabase migration/RLS gerekiyorsa uygulanır ve gerçek DB CRUD testi yapılır; lint/build, git commit/push, PR/main merge, Vercel+Render deploy ve canlı rota/özellik testi tamamlanmadan sonraki faza geçilmez.

## Kullanıcıya eklenen kalıcı gereksinim

`/operator` URL'si uygulamada **Personel Talepleri** self-service merkezidir. Normal `personel`/`operator` üyeleri yalnızca bu sekmeyi görür; yöneticiler de görür; founder nihai rol/tab yetkisine sahiptir. Talepler: yoklama, mesai, izin, avans, makbuz ve masraf.
