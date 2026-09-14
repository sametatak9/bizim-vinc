import { PaymentCategory } from '../types';

/**
 * Ödeme yükümlülüğü açılırken kategoriye göre istenecek ek alanlar.
 * `key` doğrudan PaymentObligation alanına yazılır; `metaKey: true` olanlar
 * karşılığı olmayan alanlardır ve obligation.meta içine konur.
 */
export type ObligationFieldType = 'text' | 'date' | 'number' | 'select' | 'crane' | 'personnel' | 'customer';

export interface ObligationField {
  key: string;
  label: string;
  type: ObligationFieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  meta?: boolean;
  options?: { value: string; label: string }[];
}

const KURUM = (label: string, required = true): ObligationField => ({
  key: 'institutionName', label, type: 'text', required, placeholder: 'Kurum / firma adı',
});
const SOZLESME: ObligationField = { key: 'contractNo', label: 'Sözleşme / referans no', type: 'text' };
const BASLANGIC: ObligationField = { key: 'startDate', label: 'Başlangıç tarihi', type: 'date' };
const BITIS: ObligationField = { key: 'endDate', label: 'Vade / bitiş tarihi', type: 'date' };
const FAIZ: ObligationField = { key: 'interestRate', label: 'Faiz oranı (%)', type: 'number' };
const IBAN_FIELD: ObligationField = { key: 'iban', label: 'Ödeme yapılacak IBAN', type: 'text', placeholder: 'TR..' };
const FATURA_NO: ObligationField = { key: 'invoiceNo', label: 'Fatura no', type: 'text' };
const FATURA_TARIHI: ObligationField = { key: 'invoiceDate', label: 'Fatura tarihi', type: 'date' };
const ARAC: ObligationField = { key: 'craneId', label: 'İlgili araç / vinç', type: 'crane', hint: 'Masrafın hangi makineye ait olduğunu seçin' };
const PLAKA: ObligationField = { key: 'plate', label: 'Plaka', type: 'text', placeholder: '34 ABC 123' };

export const OBLIGATION_FIELDS: Record<PaymentCategory, ObligationField[]> = {
  leasing: [
    KURUM('Leasing kurumu / banka'),
    { ...SOZLESME, label: 'Leasing sözleşme no', required: true },
    ARAC, PLAKA, BASLANGIC, BITIS, FAIZ, IBAN_FIELD,
    { key: 'kdvOrani', label: 'KDV oranı (%)', type: 'number', meta: true },
  ],
  kredi: [
    KURUM('Banka'),
    { ...SOZLESME, label: 'Kredi / sözleşme no', required: true },
    BASLANGIC, BITIS, FAIZ, IBAN_FIELD,
    { key: 'krediTuru', label: 'Kredi türü', type: 'select', meta: true, options: [
      { value: 'isletme', label: 'İşletme kredisi' },
      { value: 'tasit', label: 'Taşıt kredisi' },
      { value: 'yatirim', label: 'Yatırım kredisi' },
      { value: 'rotatif', label: 'Rotatif / spot' },
    ] },
  ],
  kredi_karti: [
    KURUM('Banka'),
    { key: 'kartSon4', label: 'Kart son 4 hane', type: 'text', meta: true, placeholder: '1234' },
    { key: 'hesapKesim', label: 'Hesap kesim günü', type: 'number', meta: true },
    BITIS,
  ],
  petrol_dbs: [
    KURUM('Petrol / akaryakıt firması'),
    { key: 'subscriberNo', label: 'DBS / müşteri no', type: 'text', required: true },
    ARAC, PLAKA, FATURA_NO, FATURA_TARIHI, IBAN_FIELD,
  ],
  elektrik_su: [
    KURUM('Kurum (elektrik / su / doğalgaz)'),
    { key: 'subscriberNo', label: 'Abone / tesisat no', type: 'text', required: true },
    FATURA_NO, FATURA_TARIHI,
    { key: 'aboneAdresi', label: 'Abonelik adresi / şantiye', type: 'text', meta: true },
    { key: 'sayacNo', label: 'Sayaç no', type: 'text', meta: true },
  ],
  kira: [
    KURUM('Kiralayan / mal sahibi'),
    { ...SOZLESME, label: 'Kira sözleşme no' },
    BASLANGIC, BITIS, IBAN_FIELD,
    { key: 'kiralananYer', label: 'Kiralanan yer', type: 'text', meta: true },
    { key: 'stopajOrani', label: 'Stopaj oranı (%)', type: 'number', meta: true },
  ],
  kdv_vergi: [
    KURUM('Vergi dairesi / SGK'),
    { key: 'subscriberNo', label: 'Sicil / mükellef no', type: 'text' },
    { key: 'donem', label: 'Dönem (örn. 2026/08)', type: 'text', meta: true },
    { key: 'tahakkukNo', label: 'Tahakkuk / referans no', type: 'text', meta: true },
    BITIS,
  ],
  yakit: [
    KURUM('Tedarikçi / istasyon'),
    ARAC, PLAKA, FATURA_NO, FATURA_TARIHI,
    { key: 'litre', label: 'Litre', type: 'number', meta: true },
  ],
  bakim: [
    KURUM('Servis / tedarikçi'),
    ARAC, PLAKA, FATURA_NO, FATURA_TARIHI,
    { key: 'isEmriNo', label: 'İş emri no', type: 'text', meta: true },
    { key: 'kmSaat', label: 'Km / çalışma saati', type: 'number', meta: true },
  ],
  maas: [
    { key: 'recipientId', label: 'Personel', type: 'personnel', required: true },
    { key: 'donem', label: 'Dönem (YYYY-AA)', type: 'text', meta: true },
    IBAN_FIELD,
  ],
  avans: [
    { key: 'recipientId', label: 'Personel', type: 'personnel', required: true },
    { key: 'talepNedeni', label: 'Talep nedeni', type: 'text', meta: true },
    IBAN_FIELD,
  ],
  masraf: [
    KURUM('Tedarikçi / firma', false),
    FATURA_NO, FATURA_TARIHI, ARAC,
    { key: 'masrafTuru', label: 'Masraf türü', type: 'text', meta: true },
  ],
  diger: [
    KURUM('Kurum / firma', false),
    SOZLESME, FATURA_NO, FATURA_TARIHI, BASLANGIC, BITIS, IBAN_FIELD,
  ],
};

/** Kategorinin varsayılan plan davranışı (tekrar eden abonelik mi, taksitli sözleşme mi). */
export const CATEGORY_DEFAULTS: Record<PaymentCategory, { recurring: boolean; installments: number; hint: string }> = {
  leasing: { recurring: false, installments: 12, hint: 'Sözleşme toplamı taksitlere bölünür.' },
  kredi: { recurring: false, installments: 12, hint: 'Kredi taksit planı oluşturulur.' },
  kredi_karti: { recurring: true, installments: 12, hint: 'Her ay hesap kesim tutarı planlanır.' },
  petrol_dbs: { recurring: true, installments: 12, hint: 'DBS aylık tahakkuk olarak planlanır.' },
  elektrik_su: { recurring: true, installments: 12, hint: 'Fatura geldikçe tutar güncellenebilir.' },
  kira: { recurring: true, installments: 12, hint: 'Aylık kira ödemesi tekrar eder.' },
  kdv_vergi: { recurring: false, installments: 1, hint: 'Tek tahakkuk ya da taksitlendirme.' },
  yakit: { recurring: false, installments: 1, hint: 'Fatura bazlı tek ödeme.' },
  bakim: { recurring: false, installments: 1, hint: 'Servis faturası tek ödeme.' },
  maas: { recurring: true, installments: 12, hint: 'Aylık maaş ödemesi.' },
  avans: { recurring: false, installments: 1, hint: 'Tek seferlik avans ödemesi.' },
  masraf: { recurring: false, installments: 1, hint: 'Tek seferlik masraf.' },
  diger: { recurring: false, installments: 1, hint: 'Serbest plan.' },
};
