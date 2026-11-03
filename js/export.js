import { t, applyTranslations } from './i18n.js';
import { calculateAILayout, parseCustomRange, layoutConfig } from './layout-sync.js';
import { designHistory } from './design-history.js';
import { ticketStore } from './core/store.js';
import { guardInAppBrowserForPrint } from './ui-events.js';

// Hai hàm dưới đây hình thành trong DOMContentLoaded — export wrapper ổn định
// (cùng mẫu controls/ticket-drag/design-history).
const printExportsImpl = { exportTicketPng: null, toggleThermalPreview: null };
export async function exportTicketPng(...args) { return printExportsImpl.exportTicketPng(...args); }
export function toggleThermalPreview(...args) { return printExportsImpl.toggleThermalPreview(...args); }
export { isCropMarksEnabled, drawPdfCropMarks, generateCropMarksSvg, isMobilePrintDevice };

function waitForPaintFrames(frameCount = 2) {
    return new Promise((resolve) => {
        let remaining = frameCount;
        let finished = false;

        const done = () => {
            if (finished) return;
            finished = true;
            resolve();
        };

        // Fallback: đảm bảo luôn hoàn thành sau tối đa 40ms, không bao giờ treo tab background
        const fallbackTimer = setTimeout(done, Math.max(25, frameCount * 20));

        const nextFrame = () => {
            if (finished) return;
            remaining--;
            if (remaining <= 0) {
                clearTimeout(fallbackTimer);
                done();
                return;
            }

            if (document.hidden) {
                setTimeout(nextFrame, 16);
            } else {
                requestAnimationFrame(nextFrame);
            }
        };

        if (document.hidden) {
            setTimeout(nextFrame, 16);
        } else {
            requestAnimationFrame(nextFrame);
        }
    });
}

async function waitForPrintImages(root) {
    const images = Array.from(root.querySelectorAll('img'));

    await Promise.all(
        images.map(async (img) => {
            if (!img.complete) {
                await new Promise((resolve) => {
                    const timer = setTimeout(resolve, 2000);
                    const finish = () => {
                        clearTimeout(timer);
                        resolve();
                    };
                    img.addEventListener('load', finish, { once: true });
                    img.addEventListener('error', finish, { once: true });
                });
            }

            if (
                img.naturalWidth > 0 &&
                typeof img.decode === 'function'
            ) {
                try {
                    await Promise.race([
                        img.decode(),
                        new Promise((r) => setTimeout(r, 1000))
                    ]);
                } catch (decodeError) {
                    // A loaded image can still be drawn when decode() is unavailable.
                }
            }
        })
    );

    /*
      iOS may report an image as complete before WebKit paints it.
      Two frames guarantee that the mascot is visible in the first capture.
    */
    await waitForPaintFrames(2);
}

/*
  Nền/khung số/dải băng của mẫu Mùa Xuân là background-image CSS (tải từ
  CDN), không phải thẻ <img> — bộ chụp có thể vẽ thiếu nếu ảnh chưa về.
*/
async function waitForCssBackgroundImages(root) {
    const urls = new Set();

    Array.from(root.querySelectorAll('*')).forEach((element) => {
        const backgroundImage = window.getComputedStyle(element)
            .backgroundImage;

        if (!backgroundImage || backgroundImage === 'none') return;

        const pattern = /url\(["']?([^"')]+)["']?\)/g;
        let match;

        while ((match = pattern.exec(backgroundImage)) !== null) {
            urls.add(match[1]);
        }
    });

    await Promise.all(
        Array.from(urls).map((url) => new Promise((resolve) => {
            const timer = setTimeout(resolve, 2000);
            const finish = () => {
                clearTimeout(timer);
                resolve();
            };
            const probe = new Image();

            probe.crossOrigin = 'anonymous';
            probe.onload = finish;
            probe.onerror = finish;
            probe.src = url;
        }))
    );
}

/*
  Co cỡ số theo độ dài để không tràn khung: 1 chữ số giữ nguyên thiết kế,
  2 chữ số 72%, từ 3 chữ số 55% kích thước gốc.
*/
function getNumberShrinkFactor(text) {
    if (text.length >= 3) return 0.55;
    if (text.length === 2) return 0.72;
    return 1;
}

/*
  360 DPI dùng chung cho mobile và PC: nét hơn bản mobile cũ,
  nhưng vẫn cân bằng dung lượng khi gửi PDF tới máy in combini.
  Tỷ lệ CSS chuẩn là 96 DPI.
*/
function getPdfRasterScale() {
    return 3.75;
}

async function renderVisibleTicketCanvas(
    ticketElement,
    fontEmbedCSS
) {
    const pixelRatio = getPdfRasterScale();

    if (window.htmlToImage && window.htmlToImage.toCanvas) {
        try {
            return await window.htmlToImage.toCanvas(ticketElement, {
                backgroundColor: '#ffffff',
                pixelRatio,
                cacheBust: false,
                skipAutoScale: true,
                fontEmbedCSS
            });
        } catch (err) {
            console.warn('htmlToImage toCanvas failed, falling back to html2canvas', err);
        }
    }

    if (window.html2canvas) {
        return window.html2canvas(ticketElement, {
            scale: pixelRatio,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            logging: false,
            scrollX: 0,
            scrollY: 0
        });
    }

    throw new Error(t('error_ticket_library'));
}

async function buildPrintPdfBlob(ticketsToPrint, orientation, layout, pdfTab = null) {
    const JsPDF = window.jspdf && window.jspdf.jsPDF;

    if (!JsPDF) {
        throw new Error(t('error_pdf_library'));
    }

    const {
        bestCols,
        bestRows,
        totalPerPage,
        ticketW,
        ticketH
    } = layout;
    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;
    const printableWidth = pageWidth - 10;
    const duplex = isDuplexPrintEnabled();
    const cropMarks = isCropMarksEnabled();
    const duplexHeaderSpace = duplex ? 18 : 0;
    const printableHeight = pageHeight - 10 - duplexHeaderSpace;
    const startX =
        5 + Math.max(0, (printableWidth - bestCols * ticketW) / 2);
    const startY =
        5 + duplexHeaderSpace +
        Math.max(0, (printableHeight - bestRows * ticketH) / 2);
    const masterTicket = document.getElementById('master-ticket');
    const previewNumber = document.getElementById('preview-number');
    const previewBaseFontSize = window.getComputedStyle(previewNumber)
        .fontSize;
    const loadingTitle = document.getElementById('print_loading_title');
    const originalNumber = previewNumber.textContent;
    const originalLoadingTitle = loadingTitle
        ? loadingTitle.textContent
        : '';

    try {
        if (document.fonts && document.fonts.ready) {
            await Promise.race([
                document.fonts.ready,
                new Promise((resolve) => setTimeout(resolve, 1500))
            ]);
        }

        await waitForPrintImages(masterTicket);
        await waitForCssBackgroundImages(masterTicket);

        /*
          Vẽ đủ 10 chữ số để kích hoạt mọi webfont tải trễ, rồi chờ
          fonts.ready lần nữa. Nếu bỏ qua, các vé chụp sau khi font vừa
          tải xong sẽ dùng font khác (số to/lệch khung so với phần còn
          lại của trang) — đúng lỗi thấy ở số 10–12 khi in mẫu Mùa Xuân.
        */
        previewNumber.textContent = '0123456789';
        await waitForPaintFrames(1);

        if (document.fonts && document.fonts.ready) {
            await Promise.race([
                document.fonts.ready,
                new Promise((resolve) => setTimeout(resolve, 1500))
            ]);
        }

        let fontEmbedCSS;

        if (
            window.htmlToImage &&
            window.htmlToImage.getFontEmbedCSS
        ) {
            try {
                fontEmbedCSS = await Promise.race([
                    window.htmlToImage.getFontEmbedCSS(masterTicket),
                    new Promise((resolve) => setTimeout(() => resolve(''), 1500))
                ]);
            } catch (fontError) {
                console.warn('Không thể nhúng phông chữ:', fontError);
            }
        }

        /*
          Warm up the WebKit capture pipeline once. The discarded canvas
          prevents the first real ticket from losing its mascot on iOS.
        */
        const warmupCanvas = await renderVisibleTicketCanvas(
            masterTicket,
            fontEmbedCSS
        );
        warmupCanvas.width = 1;
        warmupCanvas.height = 1;
        await waitForPaintFrames(1);

        const pdf = new JsPDF({
            orientation,
            unit: 'mm',
            format: 'a4',
            compress: true
        });
        let activePage = 0;

        if (duplex) {
            const pagePlan = buildDuplexPrintPlan(ticketsToPrint, layout);
            let completedTickets = 0;
            const totalCaptures = ticketsToPrint.length * 2;

            for (let pageIndex = 0; pageIndex < pagePlan.length; pageIndex++) {
                const page = pagePlan[pageIndex];

                if (pageIndex > 0) {
                    pdf.addPage('a4', orientation);
                }

                const sideTitle = t(
                    page.side === 'front'
                        ? 'print_side_front'
                        : 'print_side_back'
                );
                const titleCanvas = renderDuplexSideTitleCanvas(sideTitle);

                pdf.addImage(
                    titleCanvas.toDataURL('image/png'),
                    'PNG',
                    (pageWidth - 90) / 2,
                    7,
                    90,
                    13.5,
                    undefined,
                    'FAST'
                );
                titleCanvas.width = 1;
                titleCanvas.height = 1;

                for (let cellIndex = 0; cellIndex < page.cells.length; cellIndex++) {
                    const ticketNumber = page.cells[cellIndex];
                    if (ticketNumber === null) continue;

                    const column = cellIndex % bestCols;
                    const row = Math.floor(cellIndex / bestCols);
                    const numberText = String(ticketNumber);

                    previewNumber.textContent = numberText;
                    previewNumber.style.fontSize =
                        getNumberShrinkFactor(numberText) < 1
                            ? `${parseFloat(previewBaseFontSize) *
                                getNumberShrinkFactor(numberText)}px`
                            : '';
                    completedTickets++;

                    if (loadingTitle) {
                        loadingTitle.textContent = t(
                            'progress_ticket',
                            {
                                current: completedTickets,
                                total: totalCaptures
                            }
                        );
                    }

                    if (pdfTab && !pdfTab.closed) {
                        try {
                            const desc = pdfTab.document.getElementById('pdf-status-desc');
                            const bar = pdfTab.document.getElementById('pdf-status-bar');
                            if (desc) desc.textContent = `${completedTickets} / ${totalCaptures} vé`;
                            if (bar) bar.style.width = `${Math.round((completedTickets / totalCaptures) * 100)}%`;
                        } catch (tabErr) {}
                    }

                    await waitForPaintFrames(1);
                    const canvas = await renderVisibleTicketCanvas(
                        masterTicket,
                        fontEmbedCSS
                    );

                    pdf.addImage(
                        canvas.toDataURL('image/jpeg', 0.92),
                        'JPEG',
                        startX + column * ticketW,
                        startY + row * ticketH,
                        ticketW,
                        ticketH,
                        undefined,
                        'FAST'
                    );

                    canvas.width = 1;
                    canvas.height = 1;
                }

                if (cropMarks) {
                    drawPdfCropMarks(pdf, {
                        startX,
                        startY,
                        bestCols,
                        bestRows,
                        ticketW,
                        ticketH,
                        pageWidth,
                        pageHeight
                    });
                }
            }

            return pdf.output('blob');
        }

        for (let index = 0; index < ticketsToPrint.length; index++) {
            const pageIndex = Math.floor(index / totalPerPage);
            const cellIndex = index % totalPerPage;
            const column = cellIndex % bestCols;
            const row = Math.floor(cellIndex / bestCols);

            if (pageIndex > activePage) {
                if (cropMarks) {
                    drawPdfCropMarks(pdf, {
                        startX,
                        startY,
                        bestCols,
                        bestRows,
                        ticketW,
                        ticketH,
                        pageWidth,
                        pageHeight
                    });
                }
                pdf.addPage('a4', orientation);
                activePage = pageIndex;
            }

            const numberText = String(ticketsToPrint[index]);

            previewNumber.textContent = numberText;
            previewNumber.style.fontSize =
                getNumberShrinkFactor(numberText) < 1
                    ? `${parseFloat(previewBaseFontSize) *
                        getNumberShrinkFactor(numberText)}px`
                    : '';

            if (loadingTitle) {
                loadingTitle.textContent = t(
                    'progress_ticket',
                    {
                        current: index + 1,
                        total: ticketsToPrint.length
                    }
                );
            }

            if (pdfTab && !pdfTab.closed) {
                try {
                    const desc = pdfTab.document.getElementById('pdf-status-desc');
                    const bar = pdfTab.document.getElementById('pdf-status-bar');
                    if (desc) desc.textContent = `${index + 1} / ${ticketsToPrint.length} vé`;
                    if (bar) bar.style.width = `${Math.round(((index + 1) / ticketsToPrint.length) * 100)}%`;
                } catch (tabErr) {}
            }

            await waitForPaintFrames(1);

            const canvas = await renderVisibleTicketCanvas(
                masterTicket,
                fontEmbedCSS
            );

            pdf.addImage(
                canvas.toDataURL('image/jpeg', 0.92),
                'JPEG',
                startX + column * ticketW,
                startY + row * ticketH,
                ticketW,
                ticketH,
                undefined,
                'FAST'
            );

            canvas.width = 1;
            canvas.height = 1;
        }

        if (cropMarks) {
            drawPdfCropMarks(pdf, {
                startX,
                startY,
                bestCols,
                bestRows,
                ticketW,
                ticketH,
                pageWidth,
                pageHeight
            });
        }

        return pdf.output('blob');
    } finally {
        previewNumber.textContent = originalNumber;
        previewNumber.style.fontSize = '';

        if (loadingTitle) {
            loadingTitle.textContent = originalLoadingTitle;
        }
    }
}

function isMobilePrintDevice() {
    return (
        /Android|iPad|iPhone|iPod/i.test(navigator.userAgent) ||
        (
            navigator.platform === 'MacIntel' &&
            navigator.maxTouchPoints > 1
        )
    );
}


function isDuplexPrintEnabled() {
    const toggle = document.getElementById('duplex-print-toggle');
    return Boolean(toggle && toggle.checked);
}

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
function buildDuplexPrintPlan(ticketsToPrint, layout) {
    const { bestCols, totalPerPage } = layout;
    const sourcePages = [];

    for (let start = 0; start < ticketsToPrint.length; start += totalPerPage) {
        const cells = ticketsToPrint
            .slice(start, start + totalPerPage)
            .map((number) => Number(number));

        while (cells.length < totalPerPage) {
            cells.push(null);
        }

        sourcePages.push(cells);
    }

    const frontPages = sourcePages.map((cells) => ({
        side: 'front',
        cells: [...cells]
    }));
    const backPages = sourcePages.map((cells) => {
        const mirroredCells = [];

        for (let start = 0; start < cells.length; start += bestCols) {
            /*
              Các ô null được đặt trước khi đảo: hàng lẻ vẫn giữ đúng
              số cột, vì vậy vị trí thực của vé sẽ khớp với mặt trước.
            */
            mirroredCells.push(
                ...cells.slice(start, start + bestCols).reverse()
            );
        }

        return {
            side: 'back',
            cells: mirroredCells
        };
    });

    return [...frontPages, ...backPages];
}

/*
  jsPDF's core Helvetica font cannot encode Vietnamese or Japanese safely.
  The side heading is drawn by the browser (Unicode-capable) then embedded
  as a PNG, while the existing jsPDF ticket workflow stays untouched.
*/
function renderDuplexSideTitleCanvas(title) {
    const canvas = document.createElement('canvas');
    // Tỉ lệ 20:3 được giữ nguyên khi chèn vào PDF, tránh kéo méo chữ.
    canvas.width = 1200;
    canvas.height = 180;

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#111111';
    context.font =
        '700 58px Arial, "Noto Sans JP", "Helvetica Neue", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(title, canvas.width / 2, canvas.height / 2);

    return canvas;
}

function createPrintTicketCellHTML(ticketInnerTemplate, ticketNumber) {
    if (ticketNumber === null) {
        return '<div class="ticket-empty duplex-placeholder" aria-hidden="true"></div>';
    }

    const numberText = String(ticketNumber);
    const shrink = getNumberShrinkFactor(numberText);

    // Thay thế số thứ tự trong thẻ số queue-number / preview-number (bảo toàn class, style và co số dài)
    const cellHTML = ticketInnerTemplate.replace(
        /(<div[^>]*\b(?:queue-number|preview-number)\b[^>]*>)([\s\S]*?)(<\/div>)/i,
        (match, openTag, oldContent, closeTag) => {
            let updatedOpenTag = openTag;
            if (shrink < 1) {
                if (/style=["'][^"']*["']/i.test(updatedOpenTag)) {
                    updatedOpenTag = updatedOpenTag.replace(
                        /style=(["'])([^"']*)(\1)/i,
                        (m, q1, styleVal, q2) => {
                            const trimmed = styleVal.trim().replace(/;$/, '');
                            return `style=${q1}${trimmed}; font-size: calc(var(--number-size) * ${shrink}) !important;${q2}`;
                        }
                    );
                } else {
                    updatedOpenTag = updatedOpenTag.replace(
                        />$/,
                        ` style="font-size: calc(var(--number-size) * ${shrink}) !important;">`
                    );
                }
            }
            return `${updatedOpenTag}${numberText}${closeTag}`;
        }
    );

    return `<div class="ticket-wrapper">${cellHTML}</div>`;
}

function buildPrintPagesHTML(
    ticketsToPrint,
    layout,
    duplex = false,
    cropMarks = false,
    orientation = 'portrait'
) {
    const {
        bestCols,
        bestRows,
        totalPerPage,
        ticketW,
        ticketH
    } = layout;
    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;
    const printableWidth = pageWidth - 10;
    const duplexHeaderSpace = duplex ? 18 : 0;
    const printableHeight = pageHeight - 10 - duplexHeaderSpace;
    const startX =
        5 + Math.max(0, (printableWidth - bestCols * ticketW) / 2);
    const startY =
        5 + duplexHeaderSpace +
        Math.max(0, (printableHeight - bestRows * ticketH) / 2);

    const ticketInnerTemplate =
        document.getElementById('master-ticket-inner').outerHTML;

    const cropSvg = cropMarks
        ? generateCropMarksSvg({
            startX,
            startY,
            bestCols,
            bestRows,
            ticketW,
            ticketH,
            pageWidth,
            pageHeight
        })
        : '';
    const cropClass = cropMarks ? ' has-crop-marks' : '';

    if (duplex) {
        return buildDuplexPrintPlan(ticketsToPrint, layout)
            .map((page) => {
                const title = t(
                    page.side === 'front'
                        ? 'print_side_front'
                        : 'print_side_back'
                );
                const cells = page.cells
                    .map((number) =>
                        createPrintTicketCellHTML(
                            ticketInnerTemplate,
                            number
                        )
                    )
                    .join('');

                return '<section class="a4-print-page duplex-print-page' + cropClass + '">' +
                    '<header class="print-side-title">' + title + '</header>' +
                    '<div class="a4-print-grid">' + cells + '</div>' +
                    cropSvg +
                    '</section>';
            })
            .join('');
    }

    const totalPages = Math.ceil(ticketsToPrint.length / totalPerPage);
    let ticketIndex = 0;
    let printHTML = '';

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        printHTML +=
            '<section class="a4-print-page' + cropClass + '">' +
            '<div class="a4-print-grid">';

        for (let cellIndex = 0; cellIndex < totalPerPage; cellIndex++) {
            if (ticketIndex < ticketsToPrint.length) {
                printHTML += createPrintTicketCellHTML(
                    ticketInnerTemplate,
                    Number(ticketsToPrint[ticketIndex])
                );
                ticketIndex++;
            } else {
                printHTML += '<div class="ticket-empty"></div>';
            }
        }

        printHTML += '</div>' + cropSvg + '</section>';
    }

    return printHTML;
}

function waitForFrameStyleSheets(frameDocument) {
    const links = Array.from(
        frameDocument.querySelectorAll('link[rel="stylesheet"]')
    );

    return Promise.all(
        links.map((link) => {
            if (link.sheet) return Promise.resolve();

            return new Promise((resolve) => {
                let completed = false;
                const finish = () => {
                    if (completed) return;
                    completed = true;
                    resolve();
                };

                link.addEventListener('load', finish, { once: true });
                link.addEventListener('error', finish, { once: true });
                setTimeout(finish, 5000);
            });
        })
    );
}

async function printDesktopInIsolatedFrame(
    ticketsToPrint,
    orientation,
    layout
) {
    const {
        bestCols,
        bestRows,
        ticketW,
        ticketH
    } = layout;
    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;
    const frame = document.createElement('iframe');

    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('tabindex', '-1');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '1px';
    frame.style.height = '1px';
    frame.style.border = '0';
    frame.style.opacity = '0';
    frame.style.pointerEvents = 'none';
    document.body.appendChild(frame);

    const frameDocument = frame.contentDocument;
    const copiedStyles = Array.from(
        document.head.querySelectorAll(
            'link[rel="stylesheet"], style'
        )
    )
        .map((node) => node.outerHTML)
        .join('\n');
    const duplex = isDuplexPrintEnabled();
    const cropMarks = isCropMarksEnabled();
    const printHTML = buildPrintPagesHTML(
        ticketsToPrint,
        layout,
        duplex,
        cropMarks,
        orientation
    );
    const directPrintStyles = `
        @page {
            size: A4 ${orientation};
            margin: 0 !important;
        }

        html,
        body {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: ${pageWidth}mm !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
        }

        #desktop-print-root {
            display: block !important;
            width: ${pageWidth}mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
        }

        .a4-print-page {
            display: block !important;
            position: relative !important;
            width: ${pageWidth}mm !important;
            min-width: ${pageWidth}mm !important;
            max-width: ${pageWidth}mm !important;
            height: ${pageHeight}mm !important;
            min-height: ${pageHeight}mm !important;
            max-height: ${pageHeight}mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            page-break-before: auto !important;
            break-before: auto !important;
            page-break-after: auto !important;
            break-after: auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
        }

        .crop-marks-svg {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: ${pageWidth}mm !important;
            height: ${pageHeight}mm !important;
            pointer-events: none !important;
            z-index: 99 !important;
        }

        .has-crop-marks .ticket-wrapper {
            box-shadow: inset 0 0 0 0.25mm rgba(120, 120, 120, 0.35) !important;
        }

        .a4-print-page + .a4-print-page {
            page-break-before: always !important;
            break-before: page !important;
        }

        .a4-print-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
        }

        .duplex-print-page {
            display: flex !important;
            flex-direction: column !important;
            gap: 3mm !important;
        }

        .duplex-print-page .print-side-title {
            display: flex !important;
            flex: 0 0 15mm !important;
            height: 15mm !important;
            align-items: center !important;
            justify-content: center !important;
            color: #111111 !important;
            font-family: Arial, sans-serif !important;
            font-size: 14pt !important;
            font-weight: 700 !important;
            letter-spacing: 0.18em !important;
        }

        .duplex-print-page .a4-print-grid {
            flex: 0 0 calc(100% - 18mm) !important;
            height: calc(100% - 18mm) !important;
        }

        .duplex-placeholder {
            visibility: hidden !important;
        }

        .a4-print-grid {
            display: grid !important;
            grid-template-columns: repeat(
                var(--print-cols),
                var(--print-ticket-width)
            ) !important;
            grid-template-rows: repeat(
                var(--print-rows),
                var(--print-ticket-height)
            ) !important;
            gap: 0 !important;
            width: 100% !important;
            height: 100% !important;
            justify-content: center !important;
            align-content: center !important;
            box-sizing: border-box !important;
        }
    `;

    frameDocument.open();
    frameDocument.write(
        '<!DOCTYPE html><html><head>' +
        '<meta charset="UTF-8">' +
        `<base href="${document.baseURI}">` +
        copiedStyles +
        '<style id="desktop-direct-print-style">' +
        directPrintStyles +
        '</style></head><body>' +
        '<main id="desktop-print-root">' +
        printHTML +
        '</main></body></html>'
    );
    frameDocument.close();

    frameDocument.documentElement.lang =
        document.documentElement.lang;

    Array.from(document.body.style).forEach((propertyName) => {
        if (!propertyName.startsWith('--')) return;

        frameDocument.body.style.setProperty(
            propertyName,
            document.body.style.getPropertyValue(propertyName),
            document.body.style.getPropertyPriority(propertyName)
        );
    });

    frameDocument.body.style.backgroundColor = '#ffffff';

    const printRoot =
        frameDocument.getElementById('desktop-print-root');
    printRoot.style.setProperty('--print-cols', String(bestCols));
    printRoot.style.setProperty('--print-rows', String(bestRows));
    printRoot.style.setProperty(
        '--print-ticket-width',
        `${ticketW}mm`
    );
    printRoot.style.setProperty(
        '--print-ticket-height',
        `${ticketH}mm`
    );

    await waitForFrameStyleSheets(frameDocument);

    if (frameDocument.fonts && frameDocument.fonts.ready) {
        await frameDocument.fonts.ready;
    }

    await waitForPrintImages(printRoot);
    await waitForCssBackgroundImages(printRoot);
    await waitForPaintFrames(2);

    const frameWindow = frame.contentWindow;
    let cleanedUp = false;
    const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        frame.remove();
    };

    frameWindow.addEventListener('afterprint', cleanup, {
        once: true
    });
    setTimeout(cleanup, 120000);

    frameWindow.focus();
    frameWindow.print();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generate-pdf-btn').addEventListener('click', async () => {
        try {
            if (
                guardInAppBrowserForPrint &&
                !guardInAppBrowserForPrint()
            ) {
                return;
            }

            calculateAILayout();

            const {
                bestCols,
                bestRows,
                totalPerPage,
                orientation,
                ticketW,
                ticketH
            } = layoutConfig;

            const modeRadio = document.querySelector(
                'input[name="print-mode"]:checked'
            );
            const mode = modeRadio ? modeRadio.value : 'sequential';
            let ticketsToPrint = [];

            if (mode === 'sequential') {
                const max = parseInt(
                    document.getElementById('print-quantity').value,
                    10
                );

                for (let i = 1; i <= max; i++) {
                    ticketsToPrint.push(i);
                }
            } else {
                ticketsToPrint = parseCustomRange(
                    document.getElementById('print-custom').value
                );
            }

            const totalTickets = ticketsToPrint.length;

            if (totalTickets === 0) {
                alert(t('error_invalid_quantity'));
                return;
            }

            if (
                !Number.isFinite(totalPerPage) ||
                totalPerPage < 1 ||
                bestCols < 1 ||
                bestRows < 1
            ) {
                alert(t('error_ticket_too_large'));
                return;
            }

            document.getElementById('export-modal').classList.add('hidden');
            document.getElementById('export-modal').classList.remove('flex');

            const overlay =
                document.getElementById('print-overlay');
            const layout = {
                bestCols,
                bestRows,
                totalPerPage,
                ticketW,
                ticketH
            };

            overlay.classList.remove('hidden');
            overlay.classList.add('flex');

            if (!isMobilePrintDevice()) {
                try {
                    await printDesktopInIsolatedFrame(
                        ticketsToPrint,
                        orientation,
                        layout
                    );
                } finally {
                    overlay.classList.add('hidden');
                    overlay.classList.remove('flex');
                }

                return;
            }

            const duplex = isDuplexPrintEnabled();
            const pdfTab = window.open('', '_blank');

            if (pdfTab) {
                const totalTarget = duplex ? ticketsToPrint.length * 2 : ticketsToPrint.length;
                pdfTab.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xuất File In PDF - RaiRaiTei</title>
    <style>
        body {
            margin: 0;
            background: #0f172a;
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            min-height: 100vh;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 24px;
            box-sizing: border-box;
        }
        .container {
            max-width: 400px;
            width: 100%;
            background: #1e293b;
            padding: 32px 24px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.08);
        }
        .spinner {
            width: 44px;
            height: 44px;
            border: 4px solid rgba(255,255,255,0.1);
            border-top-color: #38bdf8;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 18px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        h2 { margin: 0 0 8px; font-size: 1.2rem; font-weight: 700; color: #f1f5f9; }
        p { margin: 0 0 18px; color: #94a3b8; font-size: 0.9rem; line-height: 1.4; }
        .progress-track {
            background: rgba(255,255,255,0.1);
            border-radius: 999px;
            height: 8px;
            overflow: hidden;
            margin-bottom: 12px;
        }
        .progress-bar {
            background: linear-gradient(90deg, #38bdf8, #818cf8);
            height: 100%;
            width: 0%;
            border-radius: 999px;
            transition: width 0.2s ease;
        }
        .status-desc { font-size: 0.88rem; font-weight: 600; color: #38bdf8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Đang tạo PDF A4...</h2>
        <p>Vui lòng giữ tab này mở trong quá trình xử lý.</p>
        <div class="progress-track"><div class="progress-bar" id="pdf-status-bar"></div></div>
        <div class="status-desc" id="pdf-status-desc">0 / ${totalTarget} vé</div>
    </div>
</body>
</html>`);
                pdfTab.document.close();
            }

            try {
                const pdfBlob = await buildPrintPdfBlob(
                    ticketsToPrint,
                    orientation,
                    layout,
                    pdfTab
                );
                const pdfUrl = URL.createObjectURL(pdfBlob);

                if (pdfTab && !pdfTab.closed) {
                    try {
                        pdfTab.document.title = 'RaiRaiTei-Tickets.pdf';
                        pdfTab.document.body.innerHTML = `
                            <style>
                                html, body { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#0f172a; }
                                .mobile-pdf-bar {
                                    position: fixed; top: 0; left: 0; right: 0; height: 54px;
                                    background: #1e293b; display: flex; align-items: center; justify-content: space-between;
                                    padding: 0 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.4); z-index: 100;
                                    border-bottom: 1px solid rgba(255,255,255,0.1);
                                }
                                .mobile-pdf-bar span { color: #f8fafc; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                                .mobile-pdf-bar a {
                                    background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700;
                                    padding: 8px 16px; border-radius: 8px; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                                    box-shadow: 0 4px 12px rgba(37,99,235,0.3);
                                }
                                iframe { width: 100%; height: calc(100% - 54px); margin-top: 54px; border: none; background: #334155; }
                            </style>
                            <div class="mobile-pdf-bar">
                                <span>📄 RaiRaiTei-Tickets.pdf</span>
                                <a href="${pdfUrl}" download="RaiRaiTei-Tickets.pdf">Tải PDF Về Máy</a>
                            </div>
                            <iframe src="${pdfUrl}" type="application/pdf"></iframe>
                        `;
                        pdfTab.focus();
                    } catch (tabNavError) {
                        pdfTab.location.href = pdfUrl;
                    }
                } else {
                    alert(t('popup_blocked_notice'));

                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = 'RaiRaiTei-Tickets.pdf';
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                }

                setTimeout(
                    () => URL.revokeObjectURL(pdfUrl),
                    300000
                );
            } catch (pdfError) {
                if (pdfTab && !pdfTab.closed) {
                    pdfTab.close();
                }

                throw pdfError;
            } finally {
                overlay.classList.add('hidden');
                overlay.classList.remove('flex');
            }
        } catch (error) {
            console.error(error);
            alert(t('error_pdf_create'));
        }
    });

    /*
      Lưu thiết kế dưới dạng tệp tùy chỉnh nhỏ gọn (JSON) thay vì chụp
      toàn bộ trang HTML: không còn nhúng source ứng dụng nên không thể
      dùng tệp để truy cập/sửa code, đồng thời dễ nhập lại sau này.
      Bộ thu thập/áp dụng dùng chung với undo/redo (design-history.js).
    */
    document.getElementById('backup-btn').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;
        const buttonLabel = document.getElementById('btn_backup');

        if (buttonLabel) {
            buttonLabel.textContent = t('processing');
        } else {
            btn.textContent = t('processing');
        }

        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            const design = designHistory
                ? designHistory.collect()
                : null;

            if (!design) {
                throw new Error('design history module unavailable');
            }

            const blob = new Blob([JSON.stringify(design, null, 2)], {
                type: 'application/json;charset=utf-8'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            a.href = url;

            const d = new Date();
            const timeStr =
                `${d.getFullYear()}` +
                `${('0' + (d.getMonth() + 1)).slice(-2)}` +
                `${('0' + d.getDate()).slice(-2)}`;

            a.download = `Ticket_Design_${timeStr}.customization.json`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert(t('error_backup_create'));
        } finally {
            btn.disabled = false;

            if (applyTranslations) {
                applyTranslations();
            } else {
                btn.innerHTML = originalText;
            }

            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });

    /*
      Nhập lại tệp tùy chỉnh (.customization.json): áp dụng qua bộ dùng
      chung của design-history (có xác thực định dạng/màu/font), rồi ghi
      vào lịch sử để undo/redo hoạt động nhất quán.
    */
    const restoreInput = document.getElementById('restore-file');

    document.getElementById('restore-btn').addEventListener('click', () => {
        restoreInput.value = '';
        restoreInput.click();
    });

    restoreInput.addEventListener('change', async () => {
        const file = restoreInput.files && restoreInput.files[0];

        if (!file) return;

        let design = null;

        try {
            design = JSON.parse(await file.text());
        } catch (error) {
            console.error(error);
        }

        const applied =
            design && designHistory
                ? designHistory.apply(design)
                : false;

        if (!applied) {
            alert(t('error_backup_create'));
            return;
        }

        if (designHistory) {
            designHistory.capture();
        }
    });

    /**
    /**
     * Thuật toán Floyd-Steinberg Dithering:
     * Khử răng cưa đơn sắc (1-bit monochrome error diffusion)
     * Tái tạo ảnh giống 100% bản in nhiệt vật lý 203 DPI của máy in hóa đơn.
     */
    function applyFloydSteinbergDithering(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        const gray = new Float32Array(width * height);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                const oldVal = gray[idx];
                const newVal = oldVal < 128 ? 0 : 255;
                gray[idx] = newVal;
                const err = oldVal - newVal;

                if (x + 1 < width) {
                    gray[idx + 1] += err * (7 / 16);
                }
                if (x - 1 >= 0 && y + 1 < height) {
                    gray[(y + 1) * width + (x - 1)] += err * (3 / 16);
                }
                if (y + 1 < height) {
                    gray[(y + 1) * width + x] += err * (5 / 16);
                }
                if (x + 1 < width && y + 1 < height) {
                    gray[(y + 1) * width + (x + 1)] += err * (1 / 16);
                }
            }
        }

        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const val = gray[j] < 128 ? 0 : 255;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
            data[i + 3] = 255;
        }

        ctx.putImageData(imgData, 0, 0);
        return canvas;
    }

    /**
     * Xuất ảnh vé đơn chiếc độ phân giải cao (Super-sampled High-Res PNG)
     * Thích hợp cho máy in nhiệt đơn lẻ hoặc chia sẻ
     */
    printExportsImpl.exportTicketPng = async function (scale = 3.5) {
        const ticketNode = document.getElementById('master-ticket-inner');
        if (!ticketNode) return null;

        try {
            await waitForPrintImages(ticketNode);
            await waitForCssBackgroundImages(ticketNode);

            const isThermal = document.body.classList.contains('thermal-simulation-mode');
            let outCanvas = null;

            if (window.htmlToImage && typeof window.htmlToImage.toCanvas === 'function') {
                outCanvas = await window.htmlToImage.toCanvas(ticketNode, {
                    pixelRatio: scale,
                    backgroundColor: '#ffffff'
                });
            } else if (window.html2canvas) {
                outCanvas = await window.html2canvas(ticketNode, {
                    scale: scale,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });
            }

            if (outCanvas) {
                if (isThermal) {
                    applyFloydSteinbergDithering(outCanvas);
                }

                const dataUrl = outCanvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `rairaitei-ticket-${isThermal ? 'thermal-' : ''}${Date.now()}.png`;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                link.remove();
                return true;
            }
        } catch (err) {
            console.error('[ExportTicketPng] Lỗi xuất ảnh:', err);
        }
        return false;
    };

    /**
     * Chuyển đổi chế độ mô phỏng máy in nhiệt đơn sắc (Thermal Monochrome Simulation)
     */
    printExportsImpl.toggleThermalPreview = function (forceState) {
        const body = document.body;
        const nextState = typeof forceState === 'boolean' 
            ? forceState 
            : !body.classList.contains('thermal-simulation-mode');
        
        body.classList.toggle('thermal-simulation-mode', nextState);
        if (ticketStore && ticketStore.studio && ticketStore.studio.showThermalMonochrome) {
            ticketStore.studio.showThermalMonochrome.set(nextState);
        }

        const btn = document.getElementById('thermal-preview-toggle-btn');
        if (btn) {
            btn.classList.toggle('is-active', nextState);
            btn.setAttribute('aria-pressed', String(nextState));
        }
        return nextState;
    };


});