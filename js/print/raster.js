/**
 * print/raster.js — dựng ảnh vé để in (R2 tách từ export.js).
 * Chờ ảnh/phông sẵn sàng, chụp vé đang hiển thị thành canvas ở tỉ lệ
 * đủ nét cho in, và dựng tiêu đề mặt trước/sau cho chế độ hai mặt.
 */
import { t } from '../i18n.js';

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

function getPdfRasterScale() {
    return 3.75;
}

// Trần diện tích canvas an toàn cho Safari iOS (giới hạn ~16,7 triệu
// điểm ảnh; máy cũ còn thấp hơn): vượt trần thì thư viện trả canvas
// rỗng lặng lẽ và PDF thành trang trắng. Giảm hệ số phóng cho vừa.
const MAX_CANVAS_PIXELS = 12_000_000;

function clampRasterScale(element, scale) {
    const rect = element && element.getBoundingClientRect ? element.getBoundingClientRect() : null;
    const w = rect ? rect.width : 0;
    const h = rect ? rect.height : 0;

    if (!w || !h) return scale;

    const area = w * h * scale * scale;
    return area > MAX_CANVAS_PIXELS ? Math.max(1, Math.sqrt(MAX_CANVAS_PIXELS / (w * h))) : scale;
}

async function renderVisibleTicketCanvas(
    ticketElement,
    fontEmbedCSS
) {
    const pixelRatio = clampRasterScale(ticketElement, getPdfRasterScale());

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

export { waitForPaintFrames, waitForPrintImages, waitForCssBackgroundImages, renderVisibleTicketCanvas, renderDuplexSideTitleCanvas, clampRasterScale };
