window.layoutConfig = { bestCols: 0, bestRows: 0, totalPerPage: 0, orientation: 'portrait', ticketW: 0, ticketH: 0 };

// THUẬT TOÁN ĐỌC SỐ LẺ AN TOÀN CHỐNG TREO MÁY
window.parseCustomRange = function(input) {
    if (!input || input.trim() === '') return [];

    const numbers = new Set();
    const parts = input.split(';');

    for (const rawPart of parts) {
        const part = rawPart.trim();

        if (!part) continue;

        const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);

        if (rangeMatch) {
            const start = Number(rangeMatch[1]);
            const end = Number(rangeMatch[2]);

            if (start >= 1 && start <= end && end <= 5000) {
                for (let number = start; number <= end; number++) {
                    numbers.add(number);
                }
            }

            continue;
        }

        if (!/^\d+$/.test(part)) continue;

        const number = Number(part);

        if (number >= 1 && number <= 5000) {
            numbers.add(number);
        }
    }

    return Array.from(numbers).sort((a, b) => a - b);
};

window.calculateAILayout = function() {
    const coreW = Math.min(297, Math.max(1, parseFloat(document.getElementById('core-width-input').value) || 44));
    const coreH = Math.min(297, Math.max(1, parseFloat(document.getElementById('core-height-input').value) || 79));
    const bodyStyles = getComputedStyle(document.body);
    const marginX = Math.min(
        10,
        Math.max(
            0,
            parseFloat(
                bodyStyles.getPropertyValue('--cut-margin-x')
            ) || 0
        )
    );
    const marginY = Math.min(
        10,
        Math.max(
            0,
            parseFloat(
                bodyStyles.getPropertyValue('--cut-margin-y')
            ) || 0
        )
    );
    
    // Kiểm tra an toàn trước khi gọi Mode
    const modeRadio = document.querySelector('input[name="print-mode"]:checked');
    const mode = modeRadio ? modeRadio.value : 'sequential';
    
    let qty = 0;
    if (mode === 'sequential') {
        qty = Math.min(5000, Math.max(1, parseInt(document.getElementById('print-quantity').value, 10) || 30));
    } else {
        const customInput = document.getElementById('print-custom');
        qty = customInput ? window.parseCustomRange(customInput.value).length : 0;
    }

    const w = coreW + (marginX * 2); const h = coreH + (marginY * 2);
    const duplexToggle = document.getElementById('duplex-print-toggle');
    const isDuplex = Boolean(duplexToggle && duplexToggle.checked);
    /*
      Chế độ hai mặt dành 18 mm cho tiêu đề MẶT TRƯỚC / MẶT SAU.
      Cùng kích thước này được dùng trong iframe in PC và PDF mobile.
    */
    const duplexHeaderSpace = isDuplex ? 18 : 0;

    /*
      Vùng nội dung A4 chừa 5 mm ở mỗi cạnh.
      Trên iOS vùng này được dựng vào PDF thật, không giao cho Safari phân trang.
    */
    const portraitW = 200; const portraitH = 287 - duplexHeaderSpace;
    const landscapeW = 287; const landscapeH = 200 - duplexHeaderSpace;
    const colsP = Math.floor(portraitW / w); const rowsP = Math.floor(portraitH / h); const totalP = colsP * rowsP;
    const colsL = Math.floor(landscapeW / w); const rowsL = Math.floor(landscapeH / h); const totalL = colsL * rowsL;
    
    if (totalL > totalP) window.layoutConfig = { bestCols: colsL, bestRows: rowsL, totalPerPage: totalL, orientation: 'landscape', ticketW: w, ticketH: h };
    else window.layoutConfig = { bestCols: colsP, bestRows: rowsP, totalPerPage: totalP, orientation: 'portrait', ticketW: w, ticketH: h };

    const sizeEl = document.getElementById('info-size');
    if(sizeEl) sizeEl.textContent = `${w.toFixed(1)} x ${h.toFixed(1)} mm`;
    
    const translate = window.t || ((key) => key);
    const ticketUnit = translate('tickets_unit');
    const pageUnit = translate('pages_unit');

    if (window.layoutConfig.totalPerPage > 0) {
        document.getElementById('info-orientation').textContent =
            window.layoutConfig.orientation === 'portrait'
                ? translate('paper_portrait')
                : translate('paper_landscape');
        document.getElementById('info-per-page').textContent =
            `${window.layoutConfig.totalPerPage} ${ticketUnit}`;
        const sidePages = Math.ceil(qty / window.layoutConfig.totalPerPage);
        const printedPages = isDuplex ? sidePages * 2 : sidePages;
        document.getElementById('info-total-pages').textContent =
            `${printedPages} ${pageUnit}`;
    } else {
        document.getElementById('info-orientation').textContent = '—';
        document.getElementById('info-per-page').textContent =
            `0 ${ticketUnit}`;
        document.getElementById('info-total-pages').textContent = '—';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.calculateAILayout();

    const duplexToggle = document.getElementById('duplex-print-toggle');
    if (duplexToggle) {
        duplexToggle.addEventListener('change', window.calculateAILayout);
    }
});