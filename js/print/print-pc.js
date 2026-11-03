/**
 * print/print-pc.js — đường in trực tiếp cho PC (R2 tách từ export.js).
 * Dựng trang A4 bằng HTML/CSS mm trong iframe tách biệt rồi gọi in —
 * vector thật, tỉ lệ mm do trình duyệt in đảm nhiệm.
 */
import { waitForPaintFrames, waitForPrintImages, waitForCssBackgroundImages } from './raster.js';
import { isCropMarksEnabled } from './cropmarks.js';
import { isDuplexPrintEnabled, buildPrintPagesHTML } from './layout.js';

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

export { printDesktopInIsolatedFrame };
