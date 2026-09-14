export type ReportColumn = { key: string; label: string };

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] as string));

export function downloadExcelReport(filename: string, title: string, columns: ReportColumn[], rows: Record<string, unknown>[]) {
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const body = rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join('')}</tr>`).join('');
  const html = `<html><head><meta charset="utf-8"><style>body{font-family:Arial;color:#12352a}header{display:flex;align-items:center;gap:16px;border-bottom:3px solid #087f5b;padding-bottom:12px;margin-bottom:16px}header img{height:54px;width:auto}h1{color:#087f5b;margin:0}table{border-collapse:collapse;width:100%}th{background:#dff7ea;color:#07583f}td,th{border:1px solid #b7dfc8;padding:7px;text-align:left;font-size:12px}</style></head><body><header><img src="/branding/bizim-vinc-logo-horizontal.png" alt="BİZİM VİNÇ ERP"><div><h1>${escapeHtml(title)}</h1><p>En derinden, en yükseklere · Oluşturulma: ${new Date().toLocaleString('tr-TR')}</p></div></header><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  const blob = new Blob([`\ufeff${html}`], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`; link.click();
  URL.revokeObjectURL(url);
}

export function downloadHtmlReport(filename: string, title: string, columns: ReportColumn[], rows: Record<string, unknown>[]) {
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const body = rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join('')}</tr>`).join('');
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Inter,Arial,sans-serif;background:#f4fbf7;color:#12352a;padding:28px}header{display:flex;align-items:center;gap:16px;border-bottom:3px solid #087f5b;padding-bottom:14px;margin-bottom:18px}header img{height:58px;width:auto}h1{color:#087f5b;margin:0}table{background:white;border-collapse:collapse;width:100%;box-shadow:0 8px 30px #0b6b4314}th{background:#087f5b;color:white}td,th{border:1px solid #cde9d8;padding:9px;text-align:left;font-size:13px}tr:nth-child(even){background:#f0faf4}@media print{body{background:white}}</style></head><body><header><img src="/branding/bizim-vinc-logo-horizontal.png" alt="BİZİM VİNÇ ERP"><div><h1>${escapeHtml(title)}</h1><p>En derinden, en yükseklere · Oluşturulma: ${new Date().toLocaleString('tr-TR')}</p></div></header><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename.endsWith('.html') ? filename : `${filename}.html`; link.click();
  URL.revokeObjectURL(url);
}

export function printReport(title: string, columns: ReportColumn[], rows: Record<string, unknown>[]) {
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const body = rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join('')}</tr>`).join('');
  const reportWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!reportWindow) return;
  reportWindow.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>@page{size:A4;margin:14mm}body{font-family:Arial;color:#12352a}header{display:flex;align-items:center;gap:14px;border-bottom:3px solid #087f5b;padding-bottom:12px;margin-bottom:16px}header img{height:58px}h1{margin:0;color:#087f5b;font-size:20px}p{margin:4px 0;font-size:11px;color:#5b6f64}table{border-collapse:collapse;width:100%}th{background:#087f5b;color:white}td,th{border:1px solid #cde9d8;padding:7px;text-align:left;font-size:11px}tr:nth-child(even){background:#f0faf4}</style></head><body><header><img src="${window.location.origin}/branding/bizim-vinc-logo-horizontal.png" alt="BİZİM VİNÇ ERP"><div><h1>${escapeHtml(title)}</h1><p>En derinden, en yükseklere · ${new Date().toLocaleString('tr-TR')}</p></div></header><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table><script>window.onload=function(){window.print();}</script></body></html>`);
  reportWindow.document.close();
}
