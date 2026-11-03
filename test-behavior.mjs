// ============================================================
// Test hành vi thật (GĐ1 vé 1.4) — nạp app vào jsdom bằng đúng mã
// nguồn của repo (CSS/JS nội tuyến như trang thật), bấm nút như
// người dùng và kiểm tra kết quả hiển thị/tính toán.
// Khác với 2 test tĩnh (đọc chuỗi trong file), test này bắt được
// lỗi hành vi: lỗi dải tên quán bị CSS ép trong suốt ở các mẫu
// mùa (đã sửa 3/11/2026) làm mục A đỏ ngay.
// Chạy: npm test  (hoặc node test-behavior.mjs)
// ============================================================
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail = '') {
    if (cond) { pass++; console.log(`  ✅ ${name}`); }
    else { fail++; failures.push(name); console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// --- Dựng app: nội tuyến CSS/JS local vào HTML, bỏ script CDN ---
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link[^>]*href="(css\/[^"?]+)[^"]*"[^>]*>/g, (m, p) => {
    try { return '<style>' + fs.readFileSync(path.join(root, p), 'utf8') + '</style>'; } catch { return ''; }
});
html = html.replace(/<script[^>]*src="([^"]+)"[^>]*>\s*<\/script>/g, (m, src) => {
    if (src.startsWith('http')) return '';
    const p = src.split('?')[0];
    try { return '<script>' + fs.readFileSync(path.join(root, p), 'utf8') + '</script>'; } catch { return ''; }
});
const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'dangerously', pretendToBeVisual: true });
const { window } = dom;
await new Promise(r => setTimeout(r, 1200));
const d = window.document;

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

console.log('\n==================================================');
console.log(`TEST HÀNH VI: ${pass} ĐẠT / ${fail} LỖI`);
if (failures.length) console.log('Lỗi ở:', failures.join(' | '));
console.log('==================================================');
process.exit(fail > 0 ? 1 : 0);
