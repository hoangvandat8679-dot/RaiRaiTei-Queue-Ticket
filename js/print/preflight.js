import { t } from '../i18n.js';
import { isMobilePrintDevice } from './print-mobile.js';

/**
 * RaiRaiTei Queue Ticket Studio — Kiểm tra trước in + trang kiểm tra in (GĐ4 vé 4.1)
 *
 * 1) Preflight: khi mở hộp thoại in, kiểm tra thư viện in đã nạp chưa và ảnh
 *    trong vé đã tải xong chưa. Chưa sẵn sàng thì khóa nút in/xuất kèm lý do
 *    cụ thể, thay vì để người dùng bấm rồi lỗi lặng lẽ.
 * 2) Trang kiểm tra in: một tờ A4 chứa thước mm, đường tham chiếu 100 mm,
 *    khung vé 43 × 78 mm, dấu chữ thập ở 4 góc + tâm, dải xám — để đối chiếu
 *    tỉ lệ và độ lệch của máy in bằng thước thật. PC in qua khung iframe mm
 *    (cùng cơ chế với in vé); điện thoại sinh PDF vector bằng jsPDF (đơn vị
 *    mm thật, không qua ảnh chụp nên thước không bị sai tỉ lệ).
 */

const tr = (key, fallback) => { const v = t(key); return v && v !== key ? v : fallback; };

function checkLibraries() {
  const missing = [];
  if (typeof window.html2canvas !== 'function') missing.push('html2canvas');
  if (!window.htmlToImage) missing.push('html-to-image');
  if (!(window.jspdf && window.jspdf.jsPDF)) missing.push('jsPDF');
  return missing;
}

function checkImages() {
  const wrapper = document.getElementById('ticket-preview-wrapper');
  if (!wrapper) return true;
  const imgs = wrapper.querySelectorAll('img');
  for (const img of imgs) {
    const src = img.getAttribute('src');
    if (src && (!img.complete || img.naturalWidth === 0)) return false;
  }
  return true;
}

function runPrintPreflight() {
  const problems = [];
  const missing = checkLibraries();
  if (missing.length) {
    problems.push(
      tr('preflight_lib_missing', 'Thư viện in ({name}) chưa tải được. Hãy nạp lại trang.')
        .replace('{name}', missing.join(', '))
    );
  }
  if (!checkImages()) {
    problems.push(
      tr('preflight_img_not_ready', 'Ảnh trong vé chưa tải xong. Đợi một chút rồi thử lại.')
    );
  }
  return { ok: problems.length === 0, problems };
}

function refreshPreflightUI() {
  const box = document.getElementById('preflight-status');
  const genBtn = document.getElementById('generate-pdf-btn');
  const pngBtn = document.getElementById('export-single-png-btn');
  if (!box) return runPrintPreflight();
  const result = runPrintPreflight();
  if (result.ok) {
    box.classList.add('hidden');
    box.textContent = '';
    if (genBtn) { genBtn.disabled = false; genBtn.classList.remove('opacity-40', 'pointer-events-none'); }
    if (pngBtn) { pngBtn.disabled = false; pngBtn.classList.remove('opacity-40', 'pointer-events-none'); }
  } else {
    box.classList.remove('hidden');
    box.textContent = '⚠ ' + tr('preflight_not_ready', 'Chưa sẵn sàng để in') + ': ' + result.problems.join(' ');
    if (genBtn) { genBtn.disabled = true; genBtn.classList.add('opacity-40', 'pointer-events-none'); }
    if (pngBtn) { pngBtn.disabled = true; pngBtn.classList.add('opacity-40', 'pointer-events-none'); }
  }
  return result;
}

// ---------- Trang kiểm tra: bản HTML cho PC (đơn vị mm thật) ----------
function rulerTicks(lengthMm, horizontal) {
  let out = '';
  for (let i = 0; i <= lengthMm; i++) {
    const len = i % 10 === 0 ? 5 : i % 5 === 0 ? 3.5 : 2;
    const pos = horizontal ? `left:${i}mm;top:0;width:0;height:${len}mm;border-left:0.2mm solid #000;`
                           : `top:${i}mm;left:0;height:0;width:${len}mm;border-top:0.2mm solid #000;`;
    out += `<div style="position:absolute;${pos}"></div>`;
    if (i % 10 === 0) {
      const labelPos = horizontal ? `left:${i - 2}mm;top:5.5mm;` : `top:${i - 1.5}mm;left:5.5mm;`;
      out += `<div style="position:absolute;${labelPos}font-size:2.6mm;">${i}</div>`;
    }
  }
  return out;
}

function cross(x, y, label) {
  return `<div style="position:absolute;left:${x - 5}mm;top:${y}mm;width:10mm;border-top:0.25mm solid #000;"></div>
          <div style="position:absolute;left:${x}mm;top:${y - 5}mm;height:10mm;border-left:0.25mm solid #000;"></div>
          ${label ? `<div style="position:absolute;left:${x + 6}mm;top:${y - 2}mm;font-size:3mm;">${label}</div>` : ''}`;
}

function buildCheckSheetHTML() {
  const grays = Array.from({ length: 10 }, (_, i) => {
    const v = Math.round(255 - i * (255 / 9));
    return `<div style="width:15mm;height:10mm;background:rgb(${v},${v},${v});border:0.15mm solid #000;"></div>`;
  }).join('');
  return `<div class="a4-print-page" style="position:relative;width:210mm;height:297mm;padding:10mm;box-sizing:border-box;font-family:'Noto Sans JP',sans-serif;color:#000;">
    <div style="position:absolute;left:10mm;top:10mm;width:190mm;height:277mm;border:0.3mm solid #000;"></div>
    <div style="position:absolute;left:10mm;top:10mm;width:190mm;height:8mm;">${rulerTicks(190, true)}</div>
    <div style="position:absolute;left:10mm;top:10mm;width:8mm;height:277mm;">${rulerTicks(277, false)}</div>
    <div style="position:absolute;left:60mm;top:24mm;font-size:5mm;font-weight:900;">印刷チェックページ — TRANG KIỂM TRA IN</div>
    <div style="position:absolute;left:60mm;top:32mm;font-size:3mm;">RaiRaiTei Queue Ticket — in 100% (実際のサイズ / Kích thước thật), giấy A4 dọc</div>
    <div style="position:absolute;left:30mm;top:50mm;width:100mm;border-top:0.4mm solid #000;"></div>
    <div style="position:absolute;left:30mm;top:47mm;height:6mm;border-left:0.4mm solid #000;"></div>
    <div style="position:absolute;left:130mm;top:47mm;height:6mm;border-left:0.4mm solid #000;"></div>
    <div style="position:absolute;left:62mm;top:54mm;font-size:3.5mm;">Đường 100 mm — đo bằng thước thật / 100mmの線を定規で測る</div>
    <div style="position:absolute;left:30mm;top:70mm;width:43mm;height:78mm;border:0.4mm solid #000;"></div>
    <div style="position:absolute;left:30mm;top:150mm;font-size:3.5mm;">Khung vé 43 × 78 mm / チケット枠 43×78mm</div>
    <div style="position:absolute;left:90mm;top:70mm;display:flex;">${grays}</div>
    <div style="position:absolute;left:90mm;top:82mm;font-size:3.5mm;">Dải xám / グレースケール (10 mức)</div>
    ${cross(25, 25, '')}${cross(185, 25, '')}${cross(25, 272, '')}${cross(185, 272, '')}${cross(105, 148.5, 'Tâm tờ / 中心')}
    <div style="position:absolute;left:30mm;top:255mm;font-size:3.2mm;line-height:1.7;">Cách kiểm tra: (1) Đo đường 100 mm: lệch quá ±1 mm thì kiểm tra lại tỉ lệ in (chọn 100%). (2) Lật tờ giấy soi đèn: các dấu + ở 4 góc mặt trước/sau phải trùng nhau. (3) Dải xám phải phân biệt được đủ 10 mức.<br>確認方法: (1) 100mmの線を測り、±1mmを超えたら印刷倍率を確認。(2) 紙を光に透かし、四隅の+印が表裏で重なるか確認。(3) グレー10段階が見分けられるか確認。</div>
  </div>`;
}

function printCheckPagePC() {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const styles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => n.outerHTML).join('\n');
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">${styles}
    <style>@page { size: A4 portrait; margin: 0; } html, body { margin:0; padding:0; background:#fff; }</style>
    </head><body>${buildCheckSheetHTML()}</body></html>`);
  doc.close();
  setTimeout(() => {
    try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (e) { /* bỏ qua */ }
    setTimeout(() => frame.remove(), 60000);
  }, 600);
}

// ---------- Trang kiểm tra: PDF vector cho điện thoại (jsPDF, mm thật) ----------
function printCheckPageMobile() {
  if (!(window.jspdf && window.jspdf.jsPDF)) {
    alert(tr('preflight_lib_missing', 'Thư viện in ({name}) chưa tải được. Hãy nạp lại trang.').replace('{name}', 'jsPDF'));
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  doc.setDrawColor(0); doc.setTextColor(0);
  doc.setLineWidth(0.3); doc.rect(10, 10, 190, 277);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 190; i++) { const len = i % 10 === 0 ? 5 : i % 5 === 0 ? 3.5 : 2; doc.line(10 + i, 10, 10 + i, 10 + len); if (i % 10 === 0) { doc.setFontSize(7); doc.text(String(i), 9 + i, 17.5); } }
  for (let i = 0; i <= 277; i += 1) { const len = i % 10 === 0 ? 5 : i % 5 === 0 ? 3.5 : 2; doc.line(10, 10 + i, 10 + len, 10 + i); if (i % 10 === 0) { doc.setFontSize(7); doc.text(String(i), 17.5, 10.8 + i); } }
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('PRINT CHECK PAGE', 60, 27);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text('RaiRaiTei Queue Ticket - print at 100% (actual size), A4 portrait', 60, 33);
  doc.setLineWidth(0.4); doc.line(30, 50, 130, 50); doc.line(30, 47, 30, 53); doc.line(130, 47, 130, 53);
  doc.setFontSize(10); doc.text('100 mm line - measure with a real ruler', 55, 56);
  doc.rect(30, 70, 43, 78); doc.text('Ticket frame 43 x 78 mm', 30, 152);
  for (let i = 0; i < 10; i++) { const v = Math.round(255 - i * (255 / 9)); doc.setFillColor(v, v, v); doc.rect(90 + i * 10.5, 70, 10, 10, 'FD'); }
  doc.text('Gray scale (10 steps)', 90, 84);
  const crossAt = (x, y) => { doc.setLineWidth(0.25); doc.line(x - 5, y, x + 5, y); doc.line(x, y - 5, x, y + 5); };
  crossAt(25, 25); crossAt(185, 25); crossAt(25, 272); crossAt(185, 272); crossAt(105, 148.5);
  doc.setFontSize(9); doc.text('Center', 112, 147);
  doc.text(['How to check:', '(1) Measure the 100 mm line: if off by more than 1 mm, fix the print scale (choose 100%).', '(2) Hold the sheet against light: the + marks at 4 corners must align front/back.', '(3) The gray strip must show 10 distinguishable steps.'], 30, 258);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const tab = window.open('', '_blank');
  if (tab) {
    tab.document.write(`<html><head><title>RaiRaiTei-PrintCheck.pdf</title></head><body style="margin:0;background:#334155;"><div style="height:54px;background:#1e293b;display:flex;align-items:center;padding:0 16px;"><a href="${url}" download="RaiRaiTei-PrintCheck.pdf" style="background:#2563eb;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:700;font-family:sans-serif;">Download PDF</a></div><iframe src="${url}" style="width:100%;height:calc(100% - 54px);border:none;"></iframe></body></html>`);
    tab.document.close();
  } else {
    const a = document.createElement('a');
    a.href = url; a.download = 'RaiRaiTei-PrintCheck.pdf';
    document.body.appendChild(a); a.click(); a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 300000);
}

function printTestPage() {
  const isMobile = isMobilePrintDevice();
  if (isMobile) printCheckPageMobile(); else printCheckPagePC();
}

export const PrintCheck = { runPrintPreflight, refreshPreflightUI, printTestPage };
export { runPrintPreflight, refreshPreflightUI, printTestPage };
