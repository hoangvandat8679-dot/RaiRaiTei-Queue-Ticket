/**
 * print/layout.js — dàn trang A4 cho bản in (R2 tách từ export.js).
 * Kế hoạch trang hai mặt, HTML từng ô vé và toàn bộ trang in PC.
 */
import { t } from '../i18n.js';
import { generateCropMarksSvg } from './cropmarks.js';

function isDuplexPrintEnabled() {
    const toggle = document.getElementById('duplex-print-toggle');
    return Boolean(toggle && toggle.checked);
}

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

export { isDuplexPrintEnabled, getNumberShrinkFactor, buildDuplexPrintPlan, createPrintTicketCellHTML, buildPrintPagesHTML };
