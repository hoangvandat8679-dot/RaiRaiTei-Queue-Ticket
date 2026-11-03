// ============================================================
// Test hành vi thật (GĐ1 vé 1.4) — nạp app vào jsdom bằng đúng mã
// nguồn của repo (CSS/JS nội tuyến như trang thật), bấm nút như
// người dùng và kiểm tra kết quả hiển thị/tính toán.
// Khác với 2 test tĩnh (đọc chuỗi trong file), test này bắt được
// lỗi hành vi: lỗi dải tên quán bị CSS ép trong suốt ở các mẫu
// mùa (đã sửa 3/11/2026) làm mục A đỏ ngay.
// Chạy: npm test  (hoặc node test-behavior.mjs)
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadApp, makeChecker } from './tests/lib/load-app.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const { check, summary } = makeChecker('TEST HÀNH VI');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// --- Dựng app qua bộ nạp dùng chung (tests/lib/load-app.mjs) ---
const { window, document: d } = await loadApp(root);

// --- A. Dải tên quán phải nhìn thấy được ở cả 5 mẫu ---
// (bắt lại đúng lỗi 3/11/2026: Hạ/Thu/Đông bị ép nền trong suốt + chữ trắng)
// jsdom không thay biến CSS var() thành màu thật; nó trả lại giá trị
// đã khai báo. "Trong suốt" (transparent / rgba(0,0,0,0)) là dấu hiệu lỗi.
console.log('\nA. Tên quán hiển thị ở 5 mẫu:');
for (const id of ['standard', 'spring', 'summer', 'autumn', 'winter']) {
    d.querySelector(`[data-template="${id}"]`).click();
    await new Promise(r => setTimeout(r, 400));
    const el = d.getElementById('display-branch');
    const s = window.getComputedStyle(el);
    const bg = s.backgroundColor;
    const isTransparent = bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)';
    const hasStripImage = s.backgroundImage !== 'none' && s.backgroundImage !== '';
    check(`${id}: dải tên quán có nền (màu/biến màu/ảnh dải), không trong suốt`, !isTransparent || hasStripImage,
        `bg=${bg} img=${s.backgroundImage}`);
    check(`${id}: chữ tên quán không rỗng`, (el.textContent || '').trim().length > 0);
}

// --- B. parseCustomRange với các chuỗi biên ---
console.log('\nB. parseCustomRange:');
const p = window.parseCustomRange;
check('rỗng -> []', eq(p(''), []));
check('khoảng đơn giản', eq(p('1-3'), [1, 2, 3]));
check('trùng nhau được gộp và sắp xếp', eq(p('3;1;3;2'), [1, 2, 3]));
check('số ngoài 1-5000 bị loại', eq(p('0;5001;7'), [7]));
check('khoảng ngược bị loại', eq(p('5-2;9'), [9]));
check('khoảng vượt 5000 bị loại', eq(p('4999-5001;4'), [4]));
check('chữ rác bị bỏ qua, không treo máy', eq(p('abc;2;x-y'), [2]));
check('dấu phẩy không phải ký tự tách (chỉ nhận ";")', eq(p('1,2'), []));

// --- C. Tính lưới A4 ---
// Vùng in A4 sau khi chừa 5mm mỗi cạnh: dọc 200x287mm, ngang 287x200mm.
// In hai mặt (mặc định bật) trừ 18mm tiêu đề khỏi chiều cao vùng in.
console.log('\nC. calculateAILayout:');
const setVal = (id2, v) => { const el = d.getElementById(id2); el.value = v; el.dispatchEvent(new window.Event('input', { bubbles: true })); };
setVal('core-width-input', '43');
setVal('core-height-input', '78');
window.calculateAILayout();
const cfg = window.layoutConfig;
check('vé 43x78: tổng = cột x hàng', cfg.totalPerPage === cfg.bestCols * cfg.bestRows, JSON.stringify(cfg));
check('vé 43x78 mặc định: 12 vé/trang, hướng dọc (khớp bản live)', cfg.totalPerPage === 12 && cfg.orientation === 'portrait', JSON.stringify(cfg));
setVal('core-width-input', '100');
setVal('core-height-input', '100');
window.calculateAILayout();
const cfg2 = window.layoutConfig;
check('vé 100x100 (+lề cắt 1mm = 102): 1 cột x 2 hàng = 2 vé/trang, dọc thắng khi hòa', cfg2.totalPerPage === 2 && cfg2.bestCols === 1 && cfg2.bestRows === 2 && cfg2.orientation === 'portrait', JSON.stringify(cfg2));

// --- D. GĐ3: bản nháp tự lưu, cổng version, ước lượng bộ nhớ ---
console.log('\nD. Dữ liệu bền (GĐ3):');
check('design có version > 1 bị từ chối', window.designHistory.apply({ format: 'rairaitei-design', version: 99, template: 'standard' }) === false);
check('design không ghi version (bản cũ) vẫn được nhận', window.designHistory.apply({ format: 'rairaitei-design', template: 'standard' }) === true);
check('PresetManager.estimateStorageUsage trả về số >= 0', typeof window.PresetManager.estimateStorageUsage === 'function' && window.PresetManager.estimateStorageUsage() >= 0);
const branchBg = d.getElementById('branch-bg');
branchBg.value = '#123456';
branchBg.dispatchEvent(new window.Event('input', { bubbles: true }));
await new Promise(r => setTimeout(r, 1400));
const draftRaw = window.localStorage.getItem('rairaitei_draft_v1');
let draftOk = false, draftVal = null;
try { const parsed = JSON.parse(draftRaw); draftOk = parsed.format === 'rairaitei-draft' && parsed.version === 1; draftVal = parsed.design.colors['branch-bg']; } catch (e) { /* draftOk giữ false */ }
check('sau khi sửa, bản nháp được tự lưu đúng định dạng', draftOk, String(draftRaw).slice(0, 80));
check('bản nháp chụp đúng giá trị vừa sửa (branch-bg = #123456)', draftVal === '#123456', String(draftVal));
branchBg.value = '#e60012';
branchBg.dispatchEvent(new window.Event('input', { bubbles: true }));
check('DraftManager.restoreNow khôi phục được bản nháp', window.DraftManager.restoreNow() === true);
check('giá trị trở lại như bản nháp sau khôi phục', d.getElementById('branch-bg').value === '#123456', d.getElementById('branch-bg').value);
window.DraftManager.clear();

// --- E. GĐ4: preflight trước in ---
console.log('\nE. Kiểm tra trước in (GĐ4):');
// jsdom không tải ảnh thật: đánh dấu các ảnh trong vé là đã tải (môi trường kiểm thử).
d.querySelectorAll('#ticket-preview-wrapper img').forEach((img) => {
  Object.defineProperty(img, 'complete', { value: true, configurable: true });
  Object.defineProperty(img, 'naturalWidth', { value: 100, configurable: true });
});
check('PrintCheck sẵn sàng với đủ 3 thư viện local', !!(window.PrintCheck && window.PrintCheck.runPrintPreflight().ok));
window.refreshPreflightUI();
check('preflight đạt: nút in được bật, hộp cảnh báo ẩn', !d.getElementById('generate-pdf-btn').disabled && d.getElementById('preflight-status').classList.contains('hidden'));
const savedH2C = window.html2canvas;
window.html2canvas = undefined;
window.refreshPreflightUI();
check('thiếu thư viện: nút in bị khóa + hiện lý do', d.getElementById('generate-pdf-btn').disabled && !d.getElementById('preflight-status').classList.contains('hidden') && d.getElementById('preflight-status').textContent.includes('html2canvas'));
window.html2canvas = savedH2C;
window.refreshPreflightUI();
check('đủ lại thư viện: nút in mở lại', !d.getElementById('generate-pdf-btn').disabled);
check('hàm in trang kiểm tra tồn tại', typeof window.printTestPage === 'function');

// --- F. R0: đường in — crop marks + dàn trang ---
console.log('\nF. Đường in (R0):');
const svg = window.generateCropMarksSvg({ startX: 5, startY: 5, bestCols: 4, bestRows: 3, ticketW: 45, ticketH: 80, pageWidth: 210, pageHeight: 297 });
const lineCount = (svg.match(/<line /g) || []).length;
check('crop marks SVG: 4x3 ô -> 30 vạch (ticks + chữ thập)', lineCount === 30, String(lineCount));
check('crop marks SVG: viewBox đúng khổ A4 210x297', svg.includes('viewBox="0 0 210 297"'));
let pdfOk = false;
try {
  const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
  window.drawPdfCropMarks(doc, { startX: 5, startY: 5, bestCols: 4, bestRows: 3, ticketW: 45, ticketH: 80, pageWidth: 210, pageHeight: 297 });
  pdfOk = doc.output('blob').size > 1000;
} catch (e) { pdfOk = false; }
check('drawPdfCropMarks vẽ lên jsPDF thật không lỗi, PDF có nội dung', pdfOk);

console.log('\n==================================================');
process.exit(summary() > 0 ? 1 : 0);
