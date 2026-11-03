import fs from 'fs';
import path from 'path';

console.log('==================================================');
console.log('🧪 BẮT ĐẦU KIỂM THỬ TỔNG HỢP TOÀN DIỆN V2 (SPRINT 1 - 9)');
console.log('==================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

// 1. Kiểm tra tài nguyên vector SVG Bốn Mùa
const seasons = [
  { name: 'Summer', svg: 'assets/templates/summer.svg', code: 'js/registry/templates/summer.js' },
  { name: 'Autumn', svg: 'assets/templates/autumn.svg', code: 'js/registry/templates/autumn.js' },
  { name: 'Winter', svg: 'assets/templates/winter.svg', code: 'js/registry/templates/winter.js' },
  { name: 'Spring', code: 'js/registry/templates/spring.js' },
  { name: 'Standard', code: 'js/registry/templates/standard.js' }
];

for (const s of seasons) {
  assert(fs.existsSync(s.code), `Tập tin code template ${s.name} tồn tại: ${s.code}`);
  if (s.svg) {
    assert(fs.existsSync(s.svg) && fs.statSync(s.svg).size > 1000, `Tập tin vector SVG ${s.name} tồn tại (>1KB): ${s.svg}`);
  }
}

// 2. Kiểm tra Template Registry Engine
const regContent = fs.readFileSync('js/registry/template-registry.js', 'utf8');
assert(regContent.includes('spring-template') && regContent.includes('summer-template') &&
       regContent.includes('autumn-template') && regContent.includes('winter-template'),
       'TemplateRegistry dọn dẹp đầy đủ cả 4 seasonal classes khi chuyển đổi');
assert(regContent.includes('initButtons'), 'TemplateRegistry có hàm initButtons() gắn sự kiện');
assert(regContent.includes('DOMContentLoaded'), 'TemplateRegistry tự động kích hoạt khi DOMContentLoaded');

// 3. Kiểm tra các nút bấm trong index.html
const htmlContent = fs.readFileSync('index.html', 'utf8');
const expectedBtnTemplates = ['spring', 'summer', 'autumn', 'winter', 'standard'];
for (const tid of expectedBtnTemplates) {
  assert(htmlContent.includes(`data-template="${tid}"`), `index.html có nút với data-template="${tid}"`);
}

// 4. Kiểm tra đa ngôn ngữ i18n
const i18nContent = fs.readFileSync('js/i18n.js', 'utf8');
for (const tid of ['spring', 'summer', 'autumn', 'winter', 'standard']) {
  assert(i18nContent.includes(`template_${tid}_name`), `js/i18n.js có nhãn template_${tid}_name`);
}

// 5. Kiểm tra CSS styling cho các mẫu mùa
const cssContent = fs.readFileSync('css/main.css', 'utf8');
const templatesCssContent = fs.readFileSync('css/templates.css', 'utf8');
for (const tid of ['summer', 'autumn', 'winter']) {
  assert(templatesCssContent.includes(`.template-card-${tid}`), `css/templates.css có style card preview cho ${tid}`);
  assert(templatesCssContent.includes(`.ticket-core.${tid}-template`), `css/templates.css có style ticket-core cho ${tid}`);
}

// 6. js/print: nén JPEG 0.92 cho PDF; thuật toán dithering in nhiệt đã gỡ
// hẳn theo phạm vi sản phẩm (Đạt chốt: app không có in nhiệt — ghim vắng mặt).
const exportContent = ['cropmarks.js','layout.js','print-mobile.js','print-pc.js','print.js','raster.js','preflight.js']
  .map(f => fs.readFileSync('js/print/' + f, 'utf8')).join('\n');
assert(!exportContent.includes('applyFloydSteinbergDithering') && !exportContent.includes('toggleThermalPreview'), 'js/print không còn cơ chế in nhiệt (dithering/toggle đã gỡ)');
assert(exportContent.includes('image/jpeg') && exportContent.includes('0.92'), 'js/print sử dụng nén JPEG 0.92 tối ưu dung lượng PDF');


// ============================================================
// VÒNG PHỤ THUỘC IMPORT (ghim sự cố 4/11/2026): app chạy ES Modules
// native — nếu đồ thị import có vòng, thứ tự khởi tạo của trình duyệt
// thật khác bản đóng gói của harness và các hằng (translations,
// currentLang) bị đọc trước khi khởi tạo (lỗi TDZ), làm chết thầm lặng
// cả nhóm tính năng. Harness jsdom KHÔNG lộ được lớp lỗi này nên phải
// cấm vòng import bằng kiểm tra tĩnh trên đồ thị thật.
{
  const jsRoot = path.join(process.cwd(), 'js');
  const moduleFiles = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== 'vendor') walk(p); }
      else if (entry.name.endsWith('.js')) moduleFiles.push(p);
    }
  })(jsRoot);
  const graph = new Map();
  for (const file of moduleFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const deps = [];
    for (const m of src.matchAll(/import\s+(?:[^'"]*?\s+from\s+)?['"](\.[^'"]+)['"]/g)) {
      deps.push(path.normalize(path.join(path.dirname(file), m[1])));
    }
    graph.set(file, deps);
  }
  const foundCycles = [];
  const state = new Map(); const stack = [];
  const dfs = (node) => {
    state.set(node, 1); stack.push(node);
    for (const dep of graph.get(node) || []) {
      if (!graph.has(dep)) continue;
      if (state.get(dep) === 1) foundCycles.push(stack.slice(stack.indexOf(dep)).concat(dep).map(p => path.basename(p)).join(' -> '));
      else if (!state.get(dep)) dfs(dep);
    }
    stack.pop(); state.set(node, 2);
  };
  for (const file of moduleFiles) if (!state.get(file)) dfs(file);
  assert(foundCycles.length === 0, `Đồ thị import không có vòng phụ thuộc (${moduleFiles.length} module)` + (foundCycles.length ? ' — vòng: ' + foundCycles[0] : ''));
  const i18nSrc = fs.readFileSync(path.join(jsRoot, 'i18n.js'), 'utf8');
  assert(!/^import\s/m.test(i18nSrc), 'i18n.js là module lá (không import module app nào)');
}

console.log('\n==================================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount} ĐẠT (PASS) / ${failCount} LỖI (FAIL)`);
console.log('==================================================');

if (failCount > 0) process.exit(1);
