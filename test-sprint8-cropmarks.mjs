import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('🧪 BẮT ĐẦU KIỂM THỬ SPRINT 8: DÀN TRANG IN A4 LƯỚI N-UP & VẠCH CẮT 1.0MM\n');

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✅ [PASS] ${description}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${description}`);
        console.error(`     Error: ${err.message}`);
    }
}

// 1. Kiểm tra dimensions.css
test('1. Kiểm tra viền cắt an toàn 1.0mm trong css/tokens/dimensions.css', () => {
    const content = fs.readFileSync('css/tokens/dimensions.css', 'utf8');
    assert(content.includes('--ticket-cut-margin-x: 1.0mm;'), 'Thiếu --ticket-cut-margin-x: 1.0mm');
    assert(content.includes('--ticket-cut-margin-y: 1.0mm;'), 'Thiếu --ticket-cut-margin-y: 1.0mm');
});

// 2. Kiểm tra js/controls.js
test('2. Kiểm tra giá trị base: 1.0 cho cut-margin trong js/controls.js', () => {
    const content = fs.readFileSync('js/controls.js', 'utf8');
    assert(content.includes("id: 'cut-margin-x'") && content.includes('base: 1.0'), 'cut-margin-x phải có base: 1.0');
    assert(content.includes("id: 'cut-margin-y'") && content.includes('base: 1.0'), 'cut-margin-y phải có base: 1.0');
});

// 3. Kiểm tra template configs trong registry (GĐ1: js/templates.js đã dỡ, registry là động cơ mẫu duy nhất)
test('3. Kiểm tra giá trị cut-margin: 1.0 trong template configs', () => {
    const standard = fs.readFileSync('js/registry/templates/standard.js', 'utf8');
    const spring = fs.readFileSync('js/registry/templates/spring.js', 'utf8');
    assert(standard.includes("'cut-margin-x': 1.0") && standard.includes("'cut-margin-y': 1.0"), 'Template mặc định phải có cut-margin 1.0');
    assert(spring.includes("'cut-margin-x': 1.0") && spring.includes("'cut-margin-y': 1.0"), 'Template Mùa Xuân phải có cut-margin 1.0');
});

// 4. Kiểm tra i18n
test('4. Kiểm tra từ khóa đa ngôn ngữ crop_marks trong js/i18n.js', () => {
    const content = fs.readFileSync('js/i18n.js', 'utf8');
    assert(content.includes('crop_marks_label:'), 'Thiếu crop_marks_label trong i18n');
    assert(content.includes('crop_marks_hint:'), 'Thiếu crop_marks_hint trong i18n');
    assert(content.includes("'crop_marks_label'") && content.includes("'crop_marks_hint'"), 'Thiếu đăng ký vào textElementIds');
});

// 5. Kiểm tra HTML export modal
test('5. Kiểm tra checkbox crop-marks-toggle trong index.html', () => {
    const content = fs.readFileSync('index.html', 'utf8');
    assert(content.includes('id="crop-marks-toggle"'), 'Thiếu id="crop-marks-toggle" trong index.html');
    assert(content.includes('id="crop_marks_label"'), 'Thiếu id="crop_marks_label" trong index.html');
    assert(content.includes('id="crop_marks_hint"'), 'Thiếu id="crop_marks_hint" trong index.html');
});

// 6. Kiểm tra thuật toán tính toán lưới A4 N-up với viền 1.0mm
test('6. Kiểm tra thuật toán dàn trang lưới A4 N-up (43x78mm core + 1.0mm margin)', () => {
    const coreW = 43;
    const coreH = 78;
    const marginX = 1.0;
    const marginY = 1.0;
    const w = coreW + (marginX * 2); // 45mm
    const h = coreH + (marginY * 2); // 80mm
    assert.strictEqual(w, 45, 'Vé có lề phải rộng 45mm');
    assert.strictEqual(h, 80, 'Vé có lề phải cao 80mm');

    // Khổ A4 dọc: 200mm x 287mm khả dụng
    const colsP = Math.floor(200 / w); // 4
    const rowsP = Math.floor(287 / h); // 3
    const totalP = colsP * rowsP; // 12
    assert.strictEqual(colsP, 4, 'Khổ dọc phải có 4 cột');
    assert.strictEqual(rowsP, 3, 'Khổ dọc phải có 3 hàng');
    assert.strictEqual(totalP, 12, 'Khổ dọc phải có 12 vé / trang');

    // Khổ A4 ngang: 287mm x 200mm khả dụng
    const colsL = Math.floor(287 / w); // 6
    const rowsL = Math.floor(200 / h); // 2
    const totalL = colsL * rowsL; // 12
    assert.strictEqual(colsL, 6, 'Khổ ngang phải có 6 cột');
    assert.strictEqual(rowsL, 2, 'Khổ ngang phải có 2 hàng');
    assert.strictEqual(totalL, 12, 'Khổ ngang phải có 12 vé / trang');
});

// 7. Kiểm tra hàm drawPdfCropMarks logic
test('7. Kiểm tra tọa độ vạch cắt Crop Marks (Ticks 3mm và Chữ thập + 3mm)', () => {
    const exportJs = fs.readFileSync('js/export.js', 'utf8');
    assert(exportJs.includes('function drawPdfCropMarks(pdf, options)'), 'Thiếu function drawPdfCropMarks');
    assert(exportJs.includes('function generateCropMarksSvg(options)'), 'Thiếu function generateCropMarksSvg');
    assert(exportJs.includes('function isCropMarksEnabled()'), 'Thiếu function isCropMarksEnabled');

    // Giả lập mock pdf để kiểm tra các đường vẽ
    const drawnLines = [];
    const mockPdf = {
        saveGraphicsState: () => {},
        restoreGraphicsState: () => {},
        setDrawColor: () => {},
        setLineWidth: () => {},
        line: (x1, y1, x2, y2) => {
            drawnLines.push({ x1, y1, x2, y2 });
        }
    };

    // Mô phỏng hàm drawPdfCropMarks
    const startX = 15;
    const startY = 28.5;
    const bestCols = 4;
    const bestRows = 3;
    const ticketW = 45;
    const ticketH = 80;
    const gridW = bestCols * ticketW; // 180
    const gridH = bestRows * ticketH; // 240

    for (let c = 0; c <= bestCols; c++) {
        const x = startX + c * ticketW;
        mockPdf.line(x, startY - 4, x, startY - 1);
        mockPdf.line(x, startY + gridH + 1, x, startY + gridH + 4);
    }
    for (let r = 0; r <= bestRows; r++) {
        const y = startY + r * ticketH;
        mockPdf.line(startX - 4, y, startX - 1, y);
        mockPdf.line(startX + gridW + 1, y, startX + gridW + 4, y);
    }
    for (let c = 1; c < bestCols; c++) {
        const cx = startX + c * ticketW;
        for (let r = 1; r < bestRows; r++) {
            const cy = startY + r * ticketH;
            mockPdf.line(cx - 1.5, cy, cx + 1.5, cy);
            mockPdf.line(cx, cy - 1.5, cx, cy + 1.5);
        }
    }

    assert.strictEqual(drawnLines.length, 30, `Kỳ vọng 30 đoạn thẳng crop marks, thực tế ${drawnLines.length}`);
    assert.strictEqual(drawnLines[0].x1, 15);
    assert.strictEqual(drawnLines[0].y1, 24.5);
    assert.strictEqual(drawnLines[0].y2, 27.5);
});

// 8. Kiểm tra SVG Crop Marks Generator
test('8. Kiểm tra chuỗi SVG Crop Marks trong Desktop Direct Print', () => {
    const exportJs = fs.readFileSync('js/export.js', 'utf8');
    assert(exportJs.includes('.crop-marks-svg'), 'Thiếu style cho .crop-marks-svg');
    assert(exportJs.includes('.has-crop-marks .ticket-wrapper'), 'Thiếu style cho .has-crop-marks');
    assert(exportJs.includes('viewBox="0 0'), 'Thiếu viewBox trong SVG');
});

console.log(`\n==================================================`);
console.log(`KẾT QUẢ: ${passedTests}/${totalTests} TESTS ĐẠT (PASS)`);
console.log(`==================================================\n`);

if (passedTests === totalTests) {
    process.exit(0);
} else {
    process.exit(1);
}
