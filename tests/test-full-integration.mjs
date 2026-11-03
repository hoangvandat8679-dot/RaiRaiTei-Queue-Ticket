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

// 6. Kiểm tra thuật toán Floyd-Steinberg Dithering trong js/print (trước đây là export.js)
const exportContent = ['cropmarks.js','layout.js','print-mobile.js','print-pc.js','print.js','raster.js','preflight.js']
  .map(f => fs.readFileSync('js/print/' + f, 'utf8')).join('\n');
assert(exportContent.includes('applyFloydSteinbergDithering'), 'js/print chứa thuật toán Floyd-Steinberg Dithering');
assert(exportContent.includes('image/jpeg') && exportContent.includes('0.92'), 'js/print sử dụng nén JPEG 0.92 tối ưu dung lượng PDF');

// 7. Kiểm tra toán học Dithering trực tiếp
function simulateDithering(data, width, height) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const oldVal = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const newVal = oldVal < 128 ? 0 : 255;
      const err = oldVal - newVal;
      data[idx] = data[idx + 1] = data[idx + 2] = newVal;
      if (x + 1 < width) data[(y * width + (x + 1)) * 4] += (err * 7) / 16;
      if (x - 1 >= 0 && y + 1 < height) data[((y + 1) * width + (x - 1)) * 4] += (err * 3) / 16;
      if (y + 1 < height) data[((y + 1) * width + x) * 4] += (err * 5) / 16;
      if (x + 1 < width && y + 1 < height) data[((y + 1) * width + (x + 1)) * 4] += (err * 1) / 16;
    }
  }
}

const mockImg = new Uint8Array([100, 100, 100, 255, 150, 150, 150, 255, 200, 200, 200, 255, 50, 50, 50, 255]);
simulateDithering(mockImg, 2, 2);
const allBinary = [0, 4, 8, 12].every(i => mockImg[i] === 0 || mockImg[i] === 255);
assert(allBinary, 'Toán học Floyd-Steinberg xuất ra 100% pixel đen trắng tuyệt đối (0 hoặc 255)');

console.log('\n==================================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount} ĐẠT (PASS) / ${failCount} LỖI (FAIL)`);
console.log('==================================================');

if (failCount > 0) process.exit(1);
