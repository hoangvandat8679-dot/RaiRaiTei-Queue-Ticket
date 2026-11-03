/**
 * print/cropmarks.js — vạch cắt (crop marks) cho bản in (R2 tách từ export.js).
 * Hai đường ra dùng chung một thuật toán vị trí: SVG cho bản in PC (iframe)
 * và nét vẽ vector trực tiếp lên PDF cho điện thoại.
 */

function isCropMarksEnabled() {
    const toggle = document.getElementById('crop-marks-toggle');
    return toggle ? Boolean(toggle.checked) : true;
}

/*
  Vẽ vạch cắt chuẩn máy in (Crop Marks / Cut Marks):
  Kế thừa kỹ thuật công nghiệp in nhãn từ sebastian-software/asn-label-maker.
  - Vạch ticks 3mm ở 4 biên ngoài lưới vé (cách biên vé 1mm).
  - Vạch chữ thập '+' 3mm tại các giao điểm góc giữa các con vé liền kề.
  Giúp người dùng đặt thước nối 2 vạch và rọc/cắt 1 nhát chuẩn 100%.
*/

function drawPdfCropMarks(pdf, options) {
    const {
        startX,
        startY,
        bestCols,
        bestRows,
        ticketW,
        ticketH
    } = options;
    const gridW = bestCols * ticketW;
    const gridH = bestRows * ticketH;

    if (pdf.saveGraphicsState) pdf.saveGraphicsState();
    pdf.setDrawColor(120, 120, 120);
    pdf.setLineWidth(0.15);

    // 1. Ticks ở mép trên và mép dưới (Top & Bottom ticks)
    for (let c = 0; c <= bestCols; c++) {
        const x = startX + c * ticketW;
        pdf.line(x, startY - 4, x, startY - 1);
        pdf.line(x, startY + gridH + 1, x, startY + gridH + 4);
    }

    // 2. Ticks ở mép trái và mép phải (Left & Right ticks)
    for (let r = 0; r <= bestRows; r++) {
        const y = startY + r * ticketH;
        pdf.line(startX - 4, y, startX - 1, y);
        pdf.line(startX + gridW + 1, y, startX + gridW + 4, y);
    }

    // 3. Dấu chữ thập '+' tại các giao điểm bên trong
    for (let c = 1; c < bestCols; c++) {
        const cx = startX + c * ticketW;
        for (let r = 1; r < bestRows; r++) {
            const cy = startY + r * ticketH;
            pdf.line(cx - 1.5, cy, cx + 1.5, cy);
            pdf.line(cx, cy - 1.5, cx, cy + 1.5);
        }
    }

    if (pdf.restoreGraphicsState) pdf.restoreGraphicsState();
}

function generateCropMarksSvg(options) {
    const {
        startX,
        startY,
        bestCols,
        bestRows,
        ticketW,
        ticketH,
        pageWidth,
        pageHeight
    } = options;
    const gridW = bestCols * ticketW;
    const gridH = bestRows * ticketH;
    let lines = '';

    const addLine = (x1, y1, x2, y2) => {
        lines += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#787878" stroke-width="0.18" stroke-linecap="square" />`;
    };

    // 1. Ticks ở mép trên và mép dưới (Top & Bottom ticks)
    for (let c = 0; c <= bestCols; c++) {
        const x = startX + c * ticketW;
        addLine(x, startY - 4, x, startY - 1);
        addLine(x, startY + gridH + 1, x, startY + gridH + 4);
    }

    // 2. Ticks ở mép trái và mép phải (Left & Right ticks)
    for (let r = 0; r <= bestRows; r++) {
        const y = startY + r * ticketH;
        addLine(startX - 4, y, startX - 1, y);
        addLine(startX + gridW + 1, y, startX + gridW + 4, y);
    }

    // 3. Dấu chữ thập '+' tại các giao điểm bên trong
    for (let c = 1; c < bestCols; c++) {
        const cx = startX + c * ticketW;
        for (let r = 1; r < bestRows; r++) {
            const cy = startY + r * ticketH;
            addLine(cx - 1.5, cy, cx + 1.5, cy);
            addLine(cx, cy - 1.5, cx, cy + 1.5);
        }
    }

    return `<svg class="crop-marks-svg" viewBox="0 0 ${pageWidth} ${pageHeight}" xmlns="http://www.w3.org/2000/svg">${lines}</svg>`;
}

/*
  Tạo kế hoạch trang mà không tác động tới dữ liệu vé gốc.
  Mỗi trang được lấp đủ ô; các giá trị null trở thành ô tàng hình.
*/

export { isCropMarksEnabled, drawPdfCropMarks, generateCropMarksSvg };
