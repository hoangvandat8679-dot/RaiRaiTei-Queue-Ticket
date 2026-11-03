/**
 * print/print.js — điều phối in/xuất file (R2 tách từ export.js).
 * Nối hộp thoại in với hai đường in (PC iframe / điện thoại PDF), xuất
 * PNG vé đơn và sao lưu JSON thiết kế. Các khối chuyên trách nằm ở
 * raster.js, layout.js, cropmarks.js, print-pc.js, print-mobile.js.
 */
import { t, applyTranslations } from '../i18n.js';
import { calculateAILayout, parseCustomRange, layoutConfig } from '../layout-sync.js';
import { designHistory } from '../design-history.js';
import { guardInAppBrowserForPrint } from '../in-app-guard.js';
import { waitForPrintImages, waitForCssBackgroundImages, clampRasterScale } from './raster.js';
import { isDuplexPrintEnabled } from './layout.js';
import { buildPrintPdfBlob, isMobilePrintDevice } from './print-mobile.js';
import { printDesktopInIsolatedFrame } from './print-pc.js';

const printExportsImpl = { exportTicketPng: null };
export async function exportTicketPng(...args) { return printExportsImpl.exportTicketPng(...args); }
export { isMobilePrintDevice };
export { isCropMarksEnabled, drawPdfCropMarks, generateCropMarksSvg } from './cropmarks.js';

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


    /**
     * Thuật toán Floyd-Steinberg Dithering:
     * Khử răng cưa đơn sắc (1-bit monochrome error diffusion)
     * Tái tạo ảnh giống 100% bản in nhiệt vật lý 203 DPI của máy in hóa đơn.
     */

    /**
     * Xuất ảnh vé đơn chiếc độ phân giải cao (Super-sampled High-Res PNG)
     * Thích hợp cho máy in nhiệt đơn lẻ hoặc chia sẻ
     */
    printExportsImpl.exportTicketPng = async function (scale = 3.5) {
        const ticketNode = document.getElementById('master-ticket-inner');
        if (!ticketNode) return null;

        scale = clampRasterScale(ticketNode, scale);

        try {
            await waitForPrintImages(ticketNode);
            await waitForCssBackgroundImages(ticketNode);

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
                const dataUrl = outCanvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `rairaitei-ticket-${Date.now()}.png`;
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



});
