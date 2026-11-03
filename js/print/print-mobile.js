/**
 * print/print-mobile.js — đường in PDF cho điện thoại (R2 tách từ export.js).
 * Điện thoại (và trình duyệt trong ứng dụng) nhận PDF dựng bằng jsPDF từ
 * ảnh vé đã raster, kèm vạch cắt vector và tiêu đề mặt trước/sau.
 */
import { t } from '../i18n.js';
import { waitForPaintFrames, waitForPrintImages, waitForCssBackgroundImages, renderVisibleTicketCanvas, renderDuplexSideTitleCanvas } from './raster.js';
import { isCropMarksEnabled, drawPdfCropMarks } from './cropmarks.js';
import { isDuplexPrintEnabled, getNumberShrinkFactor, buildDuplexPrintPlan } from './layout.js';

function isMobilePrintDevice() {
    return (
        /Android|iPad|iPhone|iPod/i.test(navigator.userAgent) ||
        (
            navigator.platform === 'MacIntel' &&
            navigator.maxTouchPoints > 1
        )
    );
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

export { isMobilePrintDevice, buildPrintPdfBlob };
