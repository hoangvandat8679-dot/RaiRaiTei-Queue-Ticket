function waitForPaintFrames(frameCount = 2) {
    return new Promise((resolve) => {
        const nextFrame = (remaining) => {
            if (remaining <= 0) {
                resolve();
                return;
            }

            requestAnimationFrame(() => nextFrame(remaining - 1));
        };

        nextFrame(frameCount);
    });
}

async function waitForPrintImages(root) {
    const images = Array.from(root.querySelectorAll('img'));

    await Promise.all(
        images.map(async (img) => {
            if (!img.complete) {
                await new Promise((resolve) => {
                    img.addEventListener('load', resolve, { once: true });
                    img.addEventListener('error', resolve, { once: true });
                });
            }

            if (
                img.naturalWidth > 0 &&
                typeof img.decode === 'function'
            ) {
                try {
                    await img.decode();
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
            const probe = new Image();

            probe.crossOrigin = 'anonymous';
            probe.onload = resolve;
            probe.onerror = resolve;
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
        return window.htmlToImage.toCanvas(ticketElement, {
            backgroundColor: '#ffffff',
            pixelRatio,
            cacheBust: false,
            skipAutoScale: true,
            fontEmbedCSS
        });
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

    throw new Error(window.t('error_ticket_library'));
}

async function buildPrintPdfBlob(ticketsToPrint, orientation, layout) {
    const JsPDF = window.jspdf && window.jspdf.jsPDF;

    if (!JsPDF) {
        throw new Error(window.t('error_pdf_library'));
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
            await document.fonts.ready;
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
        await waitForPaintFrames(2);

        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }

        let fontEmbedCSS;

        if (
            window.htmlToImage &&
            window.htmlToImage.getFontEmbedCSS
        ) {
            try {
                fontEmbedCSS =
                    await window.htmlToImage.getFontEmbedCSS(masterTicket);
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
        await waitForPaintFrames(2);

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

                const sideTitle = window.t(
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
                        loadingTitle.textContent = window.t(
                            'progress_ticket',
                            {
                                current: completedTickets,
                                total: totalCaptures
                            }
                        );
                    }

                    await waitForPaintFrames(2);
                    const canvas = await renderVisibleTicketCanvas(
                        masterTicket,
                        fontEmbedCSS
                    );

                    pdf.addImage(
                        canvas.toDataURL('image/png'),
                        'PNG',
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
            }

            return pdf.output('blob');
        }

        for (let index = 0; index < ticketsToPrint.length; index++) {
            const pageIndex = Math.floor(index / totalPerPage);
            const cellIndex = index % totalPerPage;
            const column = cellIndex % bestCols;
            const row = Math.floor(cellIndex / bestCols);

            if (pageIndex > activePage) {
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
                loadingTitle.textContent = window.t(
                    'progress_ticket',
                    {
                        current: index + 1,
                        total: ticketsToPrint.length
                    }
                );
            }

            await waitForPaintFrames(2);

            const canvas = await renderVisibleTicketCanvas(
                masterTicket,
                fontEmbedCSS
            );

            pdf.addImage(
                canvas.toDataURL('image/png'),
                'PNG',
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

    const cellHTML = ticketInnerTemplate.replace(
        /<div class="queue-number"[^>]*>.*?<\/div>/,
        `<div class="queue-number">${ticketNumber}</div>`
    );

    return `<div class="ticket-wrapper">${cellHTML}</div>`;
}

function buildPrintPagesHTML(ticketsToPrint, layout, duplex = false) {
    const { totalPerPage } = layout;
    const ticketInnerTemplate =
        document.getElementById('master-ticket-inner').outerHTML;

    if (duplex) {
        return buildDuplexPrintPlan(ticketsToPrint, layout)
            .map((page) => {
                const title = window.t(
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

                return '<section class="a4-print-page duplex-print-page">' +
                    '<header class="print-side-title">' + title + '</header>' +
                    '<div class="a4-print-grid">' + cells + '</div>' +
                    '</section>';
            })
            .join('');
    }

    const totalPages = Math.ceil(ticketsToPrint.length / totalPerPage);
    let ticketIndex = 0;
    let printHTML = '';

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        printHTML +=
            '<section class="a4-print-page">' +
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

        printHTML += '</div></section>';
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
    const printHTML = buildPrintPagesHTML(
        ticketsToPrint,
        layout,
        duplex
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
                window.guardInAppBrowserForPrint &&
                !window.guardInAppBrowserForPrint()
            ) {
                return;
            }

            window.calculateAILayout();

            const {
                bestCols,
                bestRows,
                totalPerPage,
                orientation,
                ticketW,
                ticketH
            } = window.layoutConfig;

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
                ticketsToPrint = window.parseCustomRange(
                    document.getElementById('print-custom').value
                );
            }

            const totalTickets = ticketsToPrint.length;

            if (totalTickets === 0) {
                alert(window.t('error_invalid_quantity'));
                return;
            }

            if (
                !Number.isFinite(totalPerPage) ||
                totalPerPage < 1 ||
                bestCols < 1 ||
                bestRows < 1
            ) {
                alert(window.t('error_ticket_too_large'));
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

            const pdfTab = window.open('', '_blank');

            if (pdfTab) {
                pdfTab.document.write(
                    '<meta name="viewport" content="width=device-width">' +
                    '<body style="margin:0;background:#111;color:#fff;' +
                    'font-family:-apple-system,sans-serif;display:flex;' +
                    'min-height:100vh;align-items:center;' +
                    'justify-content:center;text-align:center;padding:24px">' +
                    '<p>' + window.t('pdf_wait') + '</p></body>'
                );
                pdfTab.document.close();
            }

            try {
                const pdfBlob = await buildPrintPdfBlob(
                    ticketsToPrint,
                    orientation,
                    layout
                );
                const pdfUrl = URL.createObjectURL(pdfBlob);

                if (pdfTab) {
                    pdfTab.location.replace(pdfUrl);
                    pdfTab.focus();
                } else {
                    alert(window.t('popup_blocked_notice'));

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
            alert(window.t('error_pdf_create'));
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
            buttonLabel.textContent = window.t('processing');
        } else {
            btn.textContent = window.t('processing');
        }

        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            const design = window.designHistory
                ? window.designHistory.collect()
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
            alert(window.t('error_backup_create'));
        } finally {
            btn.disabled = false;

            if (window.applyTranslations) {
                window.applyTranslations();
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
            design && window.designHistory
                ? window.designHistory.apply(design)
                : false;

        if (!applied) {
            alert(window.t('error_backup_create'));
            return;
        }

        if (window.designHistory) {
            window.designHistory.capture();
        }
    });
});