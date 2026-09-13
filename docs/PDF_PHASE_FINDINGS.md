# PDF Faz Bulguları

Kaynak: `/home/ubuntu/upload/bizim-vinc-kapsamli-gorev.pdf`, sayfalar 1–5.

## Zorunlu çalışma kuralı
Fazlar Faz 0’dan Faz 9’a sırayla ilerlemeli; her faz test edilmeli, git add/commit/push yapılmalı, Vercel ve Render deploylarının Ready/Live olduğu doğrulanmalı ve canlı sitede özellik açılıp test edilmeden sonraki faza geçilmemeli. Supabase değişiklikleri migration ile uygulanmalı ve gerçek CRUD bağlantı testi yapılmalı.

## Faz 0
Render SPA rewrite `/* -> /index.html`; yeni üyelik Auth signup -> admin onay paneli zinciri; `src/` ile `artifacts/bizim-vinc-erp/` arasında tek kaynak veya otomatik senkron; mümkünse staging Supabase/preview ortamı.

## Faz 1
Personel formunda maaş ve işe giriş tarihi zorunlu; personel türü admin tarafından genişletilebilir; havuz durumu kaldırılmalı, Aktif/Pasif kullanılmalı; Pasif için çıkış tarihi ve işten çıkış evrakı zorunlu; personel evrakları İSG, MYK (operatörse), sürücü, adli sicil olarak yönetilmeli; hassas adli sicil erişimi sınırlı ve retention belirtilmeli; mobil personel ekranı 360–390px’te taşmamalı.

## Faz 2
Onay merkezi ve üyelik onboarding yeniden tasarlanmalı; yeni başvurular admin onayında görünmeli; mevcut personelle eşleştirme veya maaş/görev düzenleme yapılabilmeli; onay sonrası personel ve üyelik birlikte oluşmalı; onay merkezi operatör makbuzları, avans, izin, yıllık izin, iş faaliyeti, günlük yoklama ve puantajı ayrı sekmelerde göstermeli.

## Ek kullanıcı kabul kriteri (2026-09-14)
Operatör sekmesi çalışanların ana self-servis/personel sekmesi olacak. Normal üyelikler yalnızca bu sekmeyi görebilecek; izin, avans, makbuz kesme ve diğer çalışan talepleri bu sekmeden gönderilecek. Yönetici rolleri de Operatör sekmesini görebilecek ve yönetebilecek. Operatör, düz işçi vb. roller founder tarafından değiştirilebilir; kurucu hesap rol ve sekme izinlerinin nihai yetkilisidir.
