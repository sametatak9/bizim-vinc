-- 0038_faz4_payment_lists_dedupe_cleanup.sql
-- 0037'nin yarattigi 5 yinelenen payment_lists satirini (ve cascade ile bagli
-- payment_list_items satirlarini) siler. 0037'nin import ettigini sandigi 67
-- odeme satiri aslinda ayni gun daha erken baska bir surecle zaten yuklenmisti;
-- ON CONFLICT o satirlari atladi ama payment_lists tarafinda ayni isimli 5 yeni
-- (farkli id'li) liste olusmasini engelleyemedi. Bu migration sadece o 5 fazla
-- satiri temizler; orijinal (bu sabahki) 7 payment_lists ve 424 payments satirina
-- dokunmaz. Idempotent (DELETE ... WHERE id IN (...) tekrar calistirilirsa etkisiz).

DELETE FROM public.payment_lists
WHERE id IN (
  '457f41db-68f0-4cf8-8b05-e4f57183cbc8',
  '92f342e2-dc8a-45c1-b75c-15f4e4cefd80',
  '4c834cc2-838b-462c-bc13-ba374d1d0d23',
  '652e3b27-4401-4e21-aa59-05089774ca73',
  'ecaa744d-ea19-4102-99c7-a95dd0976cdd'
);

UPDATE public.import_batches
SET notes = notes || ' | DUZELTME (0038): bu satirlarin tamami bu sabahki (oturum oncesi) importla zaten mevcuttu, ON CONFLICT ile 0 yeni odeme eklendi; olusturulan 5 yinelenen payment_lists satiri silindi.'
WHERE id = '0a38011b-ebdd-4f18-ba73-e688fbb4dc77';
